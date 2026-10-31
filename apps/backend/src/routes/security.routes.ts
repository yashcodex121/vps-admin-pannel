import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';

const router = Router();

// GET /api/security/audit-logs - Audit trail
router.get('/audit-logs', authenticate, (req: AuthRequest, res: Response) => {
  return res.json({ success: true, data: store.auditLogs });
});

// GET /api/security/overview - Security posture overview
router.get('/overview', authenticate, (req: AuthRequest, res: Response) => {
  const activeSessions = [
    {
      id: 'ses_current_01',
      device: 'Chrome on Windows 11',
      ip: req.ip || '127.0.0.1',
      location: 'Local Workspace',
      current: true,
      lastActive: new Date().toISOString(),
    },
  ];

  const securityScore = 92;
  const recommendations = [
    { id: 'rec_1', title: 'Enable Two-Factor Authentication', status: 'recommended', impact: 'high' },
    { id: 'rec_2', title: 'Disable SSH Password Auth (Use Keys only)', status: 'configured', impact: 'critical' },
    { id: 'rec_3', title: 'Keep NEXUS Agent Updated to v1.2.0+', status: 'good', impact: 'medium' },
  ];

  return res.json({
    success: true,
    data: {
      securityScore,
      activeSessions,
      recommendations,
      totalAuditEvents: store.auditLogs.length,
    },
  });
});

export default router;
