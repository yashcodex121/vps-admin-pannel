'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import {
  Archive,
  RotateCcw,
  Plus,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { IBackup } from '@/types';

export default function BackupsPage() {
  const [backups, setBackups] = useState<IBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetPath, setTargetPath] = useState('/home/deploy');
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    const res = await api.get<IBackup[]>('/backups');
    if (res.success && res.data) {
      setBackups(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await api.post('/backups', { name, targetPath });
    if (res.success) {
      setIsModalOpen(false);
      setName('');
      fetchBackups();
    }
    setCreating(false);
  };

  const handleRestore = async (id: string, backupName: string) => {
    if (!confirm(`Warning: Restoring backup "${backupName}" will overwrite existing files in the target directory. Continue?`)) {
      return;
    }
    const res = await api.post(`/backups/${id}/restore`);
    if (res.success) {
      alert(res.data?.message || 'Backup restored successfully.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Archive className="w-6 h-6 text-cyan-400" />
            Backup & Snapshot Recovery
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Automated and manual snapshots for Telegram bot databases, PM2 configs, and application directories
          </p>
        </div>

        <Button variant="gradient" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Create Backup
        </Button>
      </div>

      {/* Backups Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Backup Name</th>
                <th className="pb-3">Target Directory</th>
                <th className="pb-3">Server</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No backups created yet. Click &quot;Create Backup&quot; to preserve server state.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-semibold text-gray-100 flex items-center gap-2">
                      <Archive className="w-4 h-4 text-purple-400" />
                      {b.name}
                    </td>
                    <td className="py-3 font-mono text-cyan-400">{b.targetPath}</td>
                    <td className="py-3 text-gray-300">{b.serverName}</td>
                    <td className="py-3 font-mono text-gray-400">{(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB</td>
                    <td className="py-3">
                      <Badge variant="online">Completed</Badge>
                    </td>
                    <td className="py-3 text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => handleRestore(b._id, b.name)}
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Create Backup Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Server Snapshot"
        description="Archives the target directory into an encrypted tar.gz on the VPS"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Backup Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Pre-deploy-QuizBot-Snapshot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Target Directory to Archive</label>
            <input
              type="text"
              required
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm" icon={Archive} loading={creating}>
              Create Backup
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
