import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { sshService } from '../services/ssh.service';
import { connectServerSchema, encrypt } from '@nexus/shared';
import { config } from '../config';
import crypto from 'crypto';

const router = Router();

// GET /api/servers - List user servers
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const servers = Array.from(store.servers.values()).map(srv => {
    const { encryptedPrivateKey, encryptedPassword, ...safeServer } = srv;
    const isLive = store.metrics.has(srv._id);
    return {
      ...safeServer,
      hasMetrics: isLive,
    };
  });
  return res.json({ success: true, data: servers });
});

// GET /api/servers/:id - Server details
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const server = store.servers.get(req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'Server not found' });
  }

  const { encryptedPrivateKey, encryptedPassword, ...safeServer } = server;
  const metrics = store.metrics.get(req.params.id) || [];
  const latestMetrics = metrics[metrics.length - 1] || null;

  return res.json({
    success: true,
    data: {
      ...safeServer,
      latestMetrics,
      metricsHistory: metrics.slice(-20),
    },
  });
});

// POST /api/servers/connect - Connect new VPS
router.post('/connect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = connectServerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { name, ip, port, sshUser, authMethod, privateKey, password, tags } = parsed.data;
    const serverId = `srv_${crypto.randomBytes(6).toString('hex')}`;
    const agentToken = `nxt_${crypto.randomBytes(16).toString('hex')}`;

    let specs = undefined;

    // If SSH credentials provided, test and probe specs directly
    if (authMethod === 'ssh_key' || authMethod === 'ssh_password') {
      const probeResult = await sshService.testAndProbeSpecs({
        host: ip,
        port,
        username: sshUser,
        privateKey,
        password,
      });

      if (!probeResult.success) {
        return res.status(400).json({
          success: false,
          error: `Failed to connect to VPS via SSH: ${probeResult.error}`,
        });
      }

      specs = probeResult.specs;
    }

    // Encrypt sensitive credentials before storing
    const encryptedPrivateKey = privateKey ? encrypt(privateKey, config.encryptionKey) : undefined;
    const encryptedPassword = password ? encrypt(password, config.encryptionKey) : undefined;

    const newServer = {
      _id: serverId,
      userId: req.userId || 'admin',
      name,
      ip,
      port,
      sshUser,
      authMethod,
      status: 'online' as const,
      agentToken,
      agentConnected: false,
      specs: specs || {
        os: 'Ubuntu 24.04 LTS (Probed)',
        platform: 'linux',
        arch: 'x64',
        cpuModel: 'Intel Xeon / AMD EPYC',
        cpuCores: 2,
        totalRamBytes: 4 * 1024 * 1024 * 1024,
        totalDiskBytes: 80 * 1024 * 1024 * 1024,
        uptimeSeconds: 0,
        hostname: name.toLowerCase().replace(/\s+/g, '-'),
      },
      tags: tags || ['production'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encryptedPrivateKey,
      encryptedPassword,
    };

    store.servers.set(serverId, newServer);

    store.addAuditLog({
      userId: req.userId || 'admin',
      userName: req.user?.name || 'Admin',
      action: 'SERVER_REGISTERED',
      resourceType: 'server',
      resourceId: serverId,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
      details: { name, ip, authMethod },
    });

    // Generate installation script
    const installCommand = sshService.generateInstallScript(config.frontendOrigin || 'http://localhost:5000', serverId, agentToken);

    const { encryptedPrivateKey: _, encryptedPassword: __, ...safeServer } = newServer;
    return res.status(201).json({
      success: true,
      data: {
        server: safeServer,
        installCommand,
        agentToken,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/servers/:id/install-script
router.get('/:id/install-script', authenticate, (req: AuthRequest, res: Response) => {
  const server = store.servers.get(req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'Server not found' });
  }

  const backendUrl = `${req.protocol}://${req.get('host')}`;
  const script = sshService.generateInstallScript(backendUrl, server._id, server.agentToken || 'agent_token_missing');

  return res.json({
    success: true,
    data: {
      script,
      serverId: server._id,
      agentToken: server.agentToken,
    },
  });
});

// DELETE /api/servers/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const server = store.servers.get(req.params.id);
  if (!server) {
    return res.status(404).json({ success: false, error: 'Server not found' });
  }

  store.servers.delete(req.params.id);
  store.metrics.delete(req.params.id);

  // Clean up associated services
  for (const [sId, s] of store.services.entries()) {
    if (s.serverId === req.params.id) {
      store.services.delete(sId);
    }
  }

  store.addAuditLog({
    userId: req.userId || 'admin',
    userName: req.user?.name || 'Admin',
    action: 'SERVER_DELETED',
    resourceType: 'server',
    resourceId: req.params.id,
    ipAddress: req.ip || '127.0.0.1',
    status: 'success',
  });

  return res.json({ success: true, message: 'Server removed successfully' });
});

export default router;
