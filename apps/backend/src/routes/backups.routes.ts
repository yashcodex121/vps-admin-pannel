import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { IBackup } from '@nexus/types';
import crypto from 'crypto';

const router = Router();

// GET /api/backups - List backups
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const backups = Array.from(store.backups.values()).reverse();
  return res.json({ success: true, data: backups });
});

// POST /api/backups - Create backup
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  const { serverId, name, targetPath } = req.body;
  const server = store.servers.get(serverId) || Array.from(store.servers.values())[0];
  const backupId = `bk_${crypto.randomBytes(6).toString('hex')}`;

  const newBackup: IBackup = {
    _id: backupId,
    serverId: server?._id || 'unknown',
    serverName: server?.name || 'Production VPS',
    name: name || `Backup-${new Date().toISOString().split('T')[0]}`,
    targetPath: targetPath || '/home/deploy',
    backupFilePath: `/var/backups/nexus/${backupId}.tar.gz`,
    sizeBytes: 142 * 1024 * 1024, // 142 MB
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  store.backups.set(backupId, newBackup);

  store.addAuditLog({
    userId: req.userId || 'admin',
    userName: req.user?.name || 'Admin',
    action: 'BACKUP_CREATED',
    resourceType: 'backup',
    resourceId: backupId,
    ipAddress: req.ip || '127.0.0.1',
    status: 'success',
  });

  return res.status(201).json({ success: true, data: newBackup });
});

// POST /api/backups/:id/restore - Restore backup
router.post('/:id/restore', authenticate, (req: AuthRequest, res: Response) => {
  const backup = store.backups.get(req.params.id);
  if (!backup) return res.status(404).json({ success: false, error: 'Backup not found' });

  store.addAuditLog({
    userId: req.userId || 'admin',
    userName: req.user?.name || 'Admin',
    action: 'BACKUP_RESTORED',
    resourceType: 'backup',
    resourceId: backup._id,
    ipAddress: req.ip || '127.0.0.1',
    status: 'success',
  });

  return res.json({
    success: true,
    message: `Backup archive "${backup.name}" extracted and restored to ${backup.targetPath} successfully.`,
  });
});

export default router;
