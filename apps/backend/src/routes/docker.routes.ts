import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { agentGateway } from '../services/agentGateway';

const router = Router();

// GET /api/docker/containers - List containers
router.get('/containers', authenticate, (req: AuthRequest, res: Response) => {
  const serverId = (req.query.serverId as string) || Array.from(store.servers.keys())[0];
  const containers = store.dockerContainers.get(serverId) || [];
  return res.json({ success: true, data: containers });
});

// POST /api/docker/containers/:id/action - Start/Stop/Restart
router.post('/containers/:id/action', authenticate, async (req: AuthRequest, res: Response) => {
  const { action, serverId } = req.body;
  const targetServerId = serverId || Array.from(store.servers.keys())[0];
  const containers = store.dockerContainers.get(targetServerId) || [];
  const container = containers.find(c => c.id === req.params.id);

  if (!container) {
    return res.status(404).json({ success: false, error: 'Container not found' });
  }

  // Update container status
  if (action === 'stop') {
    container.state = 'exited';
    container.status = 'Exited (0)';
  } else if (action === 'start' || action === 'restart') {
    container.state = 'running';
    container.status = 'Up Less than a second';
  }

  store.dockerContainers.set(targetServerId, containers);

  // If agent connected, dispatch
  if (agentGateway.isAgentConnected(targetServerId)) {
    await agentGateway.executeOnAgent(targetServerId, `docker_${action}`, { containerId: container.id });
  }

  return res.json({
    success: true,
    message: `Container ${container.name} (${container.id}) ${action}ed successfully.`,
    data: container,
  });
});

// GET /api/docker/containers/:id/logs - Container logs
router.get('/containers/:id/logs', authenticate, (req: AuthRequest, res: Response) => {
  const containerId = req.params.id;
  const logs = [
    `[2026-10-31 10:14:02.102] Server initialized on port 6379`,
    `[2026-10-31 10:14:02.103] Ready to accept TCP connections`,
    `[2026-10-31 10:14:02.105] Background AOF persistence enabled`,
    `[2026-10-31 10:14:05.890] Accepted 127.0.0.1:48290 client connection`,
    `[2026-10-31 10:20:00.001] 100 keys saved in DB 0. Peak memory: 34.2 MB.`,
  ];
  return res.json({ success: true, data: { containerId, logs } });
});

// GET /api/docker/images - List images
router.get('/images', authenticate, (req: AuthRequest, res: Response) => {
  const sampleImages = [
    { id: 'img_redis_01', repository: 'redis', tag: '7-alpine', size: '32.4 MB', created: '2 weeks ago' },
    { id: 'img_nginx_02', repository: 'nginx', tag: 'alpine-slim', size: '14.1 MB', created: '1 month ago' },
    { id: 'img_node_03', repository: 'node', tag: '20-alpine', size: '178 MB', created: '3 weeks ago' },
  ];
  return res.json({ success: true, data: sampleImages });
});

export default router;
