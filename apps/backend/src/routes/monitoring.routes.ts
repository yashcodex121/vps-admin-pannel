import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';

const router = Router();

// GET /api/monitoring/metrics - Real-time metrics history
router.get('/metrics', authenticate, (req: AuthRequest, res: Response) => {
  const serverId = (req.query.serverId as string) || Array.from(store.servers.keys())[0];
  const history = store.metrics.get(serverId) || [];
  return res.json({ success: true, data: history });
});

// GET /api/monitoring/alerts - System alerts
router.get('/alerts', authenticate, (req: AuthRequest, res: Response) => {
  const alerts = Array.from(store.alerts.values()).reverse();
  return res.json({ success: true, data: alerts });
});

// POST /api/monitoring/alerts/:id/ack - Acknowledge alert
router.post('/alerts/:id/ack', authenticate, (req: AuthRequest, res: Response) => {
  const alert = store.alerts.get(req.params.id);
  if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
  alert.acknowledged = true;
  store.alerts.set(alert._id, alert);
  return res.json({ success: true, data: alert });
});

// GET /api/logs/system - Unified system logs
router.get('/logs', authenticate, (req: AuthRequest, res: Response) => {
  const sampleLogs = [
    `[2026-10-31 14:40:02] systemd[1]: Started Nexus VPS Telemetry Agent Daemon.`,
    `[2026-10-31 14:40:05] nexus-agent[14201]: Established secure WebSocket connection to backend.`,
    `[2026-10-31 14:40:10] nginx[24501]: 194.164.72.105 - - [31/Oct/2026:14:40:10 +0000] "GET /api/v1/health HTTP/1.1" 200 48`,
    `[2026-10-31 14:41:00] pm2[14205]: [quiz-bot] Ingested 18 user messages via Telegram Bot API webhook`,
    `[2026-10-31 14:41:45] dockerd[1102]: Container c7d9a10f8231 healthy. Memory: 34.2 MB`,
    `[2026-10-31 14:42:01] CRON[26010]: (root) CMD (/usr/local/bin/nexus-disk-check)`,
  ];
  return res.json({ success: true, data: sampleLogs });
});

export default router;
