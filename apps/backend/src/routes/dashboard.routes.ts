import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';

const router = Router();

// GET /api/dashboard - Aggregated stats for Main Dashboard
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const servers = Array.from(store.servers.values());
  const services = Array.from(store.services.values());
  const deployments = Array.from(store.deployments.values());

  const totalServers = servers.length;
  const onlineServers = servers.filter(s => s.status === 'online').length;
  const runningServices = services.filter(s => s.status === 'running').length;
  const failedServices = services.filter(s => s.status === 'failed').length;
  const activeDeployments = deployments.filter(d => ['cloning', 'building', 'deploying'].includes(d.stage)).length;

  // Aggregate metrics from the most active online server
  const primaryServer = servers[0];
  let primaryMetricsHistory: any[] = [];
  let latestMetrics: any = null;

  if (primaryServer && store.metrics.has(primaryServer._id)) {
    const list = store.metrics.get(primaryServer._id) || [];
    primaryMetricsHistory = list.slice(-15);
    latestMetrics = list[list.length - 1];
  }

  // Count service categories
  const telegramBots = services.filter(s => s.isBot || s.category === 'telegram_bot').length;
  const webApps = services.filter(s => s.category === 'web_app').length;
  const apis = services.filter(s => s.category === 'api_service').length;
  const pm2Services = services.filter(s => s.type === 'pm2').length;
  const dockerServices = services.filter(s => s.type === 'docker').length;
  const systemdServices = services.filter(s => s.type === 'systemd').length;

  return res.json({
    success: true,
    data: {
      stats: {
        totalServers,
        onlineServers,
        runningServices,
        failedServices,
        activeDeployments,
      },
      breakdown: {
        telegramBots,
        webApps,
        apis,
        pm2Services,
        dockerServices,
        systemdServices,
      },
      primaryServer: primaryServer ? {
        id: primaryServer._id,
        name: primaryServer.name,
        ip: primaryServer.ip,
        status: primaryServer.status,
        agentConnected: primaryServer.agentConnected,
        specs: primaryServer.specs,
      } : null,
      latestMetrics,
      primaryMetricsHistory,
      recentAlerts: Array.from(store.alerts.values()).slice(-5),
      recentDeployments: deployments.slice(-5),
    },
  });
});

export default router;
