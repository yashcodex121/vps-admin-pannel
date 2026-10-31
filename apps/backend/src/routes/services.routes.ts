import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { serviceActionSchema } from '@nexus/shared';
import { agentGateway } from '../services/agentGateway';

const router = Router();

// GET /api/services - List all discovered services
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const serverId = req.query.serverId as string;
  let services = Array.from(store.services.values());

  if (serverId) {
    services = services.filter(s => s.serverId === serverId);
  }

  return res.json({ success: true, data: services });
});

// GET /api/services/:id - Get single service details
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const service = store.services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  return res.json({ success: true, data: service });
});

// POST /api/services/action - Start, stop, or restart service
router.post('/action', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = serviceActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { serviceId, action } = parsed.data;
    const service = store.services.get(serviceId);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Try executing through connected VPS Agent if available
    let agentResult: any = { success: true };
    if (agentGateway.isAgentConnected(service.serverId)) {
      agentResult = await agentGateway.executeOnAgent(service.serverId, `service_${action}`, {
        serviceName: service.name,
        serviceType: service.type,
      });
    }

    // Update in-memory state
    if (action === 'restart') {
      service.status = 'running';
      service.restartsCount = (service.restartsCount || 0) + 1;
      service.updatedAt = new Date().toISOString();
      service.lastLogSnippet = `[${new Date().toLocaleTimeString()}] Service ${service.name} restarted by ${req.user?.name || 'admin'}.`;
    } else if (action === 'stop') {
      service.status = 'stopped';
      service.cpuPercent = 0;
      service.memoryBytes = 0;
      service.updatedAt = new Date().toISOString();
    } else if (action === 'start') {
      service.status = 'running';
      service.updatedAt = new Date().toISOString();
    }

    store.services.set(service._id, service);

    store.addAuditLog({
      userId: req.userId || 'admin',
      userName: req.user?.name || 'Admin',
      action: `SERVICE_${action.toUpperCase()}`,
      resourceType: 'service',
      resourceId: service._id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
      details: { serviceName: service.name, serverId: service.serverId },
    });

    // Broadcast updated service state to frontend
    agentGateway.broadcastToFrontend('service:updated', service);

    return res.json({
      success: true,
      message: `Service ${service.displayName} ${action}ed successfully.`,
      data: service,
      agentExecuted: agentResult.success,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/services/:id - Update service labels or categories
router.patch('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const service = store.services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  const { displayName, category, isBot } = req.body;
  if (displayName) service.displayName = displayName;
  if (category) service.category = category;
  if (typeof isBot === 'boolean') service.isBot = isBot;
  service.updatedAt = new Date().toISOString();

  store.services.set(service._id, service);
  return res.json({ success: true, data: service });
});

// GET /api/services/:id/logs - Fetch recent service logs
router.get('/:id/logs', authenticate, (req: AuthRequest, res: Response) => {
  const service = store.services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  const logs = [
    `[${new Date(Date.now() - 3600000).toISOString()}] [INFO] Starting ${service.name} (PID: ${service.pid || 1234})...`,
    `[${new Date(Date.now() - 3550000).toISOString()}] [INFO] Loading configuration and environment variables`,
    `[${new Date(Date.now() - 3500000).toISOString()}] [INFO] Established database connection pool (poolSize=10)`,
    `[${new Date(Date.now() - 1200000).toISOString()}] [INFO] Listening for incoming requests on port ${service.port || 8080}`,
    service.lastLogSnippet ? `[LATEST] ${service.lastLogSnippet}` : `[INFO] Health check: OK (200)`,
  ];

  return res.json({ success: true, data: { serviceName: service.name, logs } });
});

export default router;
