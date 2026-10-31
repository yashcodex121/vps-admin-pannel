'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import {
  Rocket,
  GitBranch,
  Github,
  RotateCcw,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { IDeployment } from '@/types';

export default function DeploymentCenterPage() {
  const [deployments, setDeployments] = useState<IDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Deploy Form State
  const [projectName, setProjectName] = useState('quiz-bot-backend');
  const [target, setTarget] = useState<'vps' | 'vercel' | 'heroku'>('vps');
  const [repositoryUrl, setRepositoryUrl] = useState('https://github.com/nexus-dev/nexus-ai-quizbot');
  const [branch, setBranch] = useState('main');
  const [buildCommand, setBuildCommand] = useState('npm run build');

  const fetchDeployments = async () => {
    setLoading(true);
    const res = await api.get<IDeployment[]>('/deployments');
    if (res.success && res.data) {
      setDeployments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post('/deployments', {
      projectName,
      target,
      repositoryUrl,
      branch,
      buildCommand,
    });

    if (res.success && res.data) {
      setIsModalOpen(false);
      fetchDeployments();
    }
    setSubmitting(false);
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Are you sure you want to rollback to the previous stable snapshot?')) return;
    const res = await api.post(`/deployments/${id}/rollback`);
    if (res.success) {
      fetchDeployments();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Rocket className="w-6 h-6 text-purple-400" />
            Deployment Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Automated CI/CD orchestration for GitHub repositories to Ubuntu VPS, Vercel, and Heroku
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/deployment-terminal">
            <Button variant="outline" size="sm" icon={Terminal}>
              Live Terminal
            </Button>
          </Link>
          <Button variant="gradient" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Deploy New Project
          </Button>
        </div>
      </div>

      {/* Target Environments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-5" glow>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Primary Target</span>
            <Badge variant="online">Live</Badge>
          </div>
          <h3 className="text-base font-bold text-white">Ubuntu 24.04 VPS</h3>
          <p className="text-xs text-gray-400 mt-1">Direct deployment with PM2 & Docker supervisor on port 3000</p>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-300">
            <span>Server: 194.164.72.105</span>
            <span className="font-mono text-cyan-400">Zero-Downtime</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5" glow>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Cloud Frontend</span>
            <Badge variant="cyan">Connected</Badge>
          </div>
          <h3 className="text-base font-bold text-white">Vercel Integration</h3>
          <p className="text-xs text-gray-400 mt-1">Next.js Edge network with automatic preview branching</p>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-300">
            <span>2 Active Projects</span>
            <Link href="/integrations/vercel" className="text-purple-400 hover:underline">Manage</Link>
          </div>
        </GlassCard>

        <GlassCard className="p-5" glow>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Cloud Workers</span>
            <Badge variant="neutral">Ready</Badge>
          </div>
          <h3 className="text-base font-bold text-white">Heroku Integration</h3>
          <p className="text-xs text-gray-400 mt-1">Heroku dynos for background scheduled cron jobs</p>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-300">
            <span>1 Worker Dyno</span>
            <Link href="/integrations/heroku" className="text-indigo-400 hover:underline">Manage</Link>
          </div>
        </GlassCard>
      </div>

      {/* Deployment History Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">Deployment Pipeline History</h3>
            <p className="text-xs text-gray-400 mt-0.5">Audit log of commits, build duration, and target servers</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDeployments} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Project & Repository</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Branch</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              {deployments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No active or past deployments recorded yet. Click &quot;Deploy New Project&quot; above.
                  </td>
                </tr>
              ) : (
                deployments.map((dep) => (
                  <tr key={dep._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-gray-100 font-semibold">{dep.projectName}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{dep.repositoryUrl}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 uppercase font-semibold text-[11px] text-purple-400">
                      {dep.target}
                    </td>
                    <td className="py-3 font-mono text-gray-300">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-gray-500" />
                        {dep.branch}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          dep.stage === 'live'
                            ? 'online'
                            : dep.stage === 'failed'
                            ? 'offline'
                            : dep.stage === 'rolled_back'
                            ? 'warning'
                            : 'purple'
                        }
                        pulse={['cloning', 'building', 'deploying'].includes(dep.stage)}
                      >
                        {dep.stage.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-gray-400">
                      {dep.durationSeconds ? `${dep.durationSeconds}s` : '13s'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(dep.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <Link href="/deployment-terminal">
                        <Button variant="secondary" size="sm" icon={Terminal}>
                          Logs
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => handleRollback(dep._id)}
                        title="Rollback deployment"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New Deployment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Deploy Repository"
        description="Configure target environment, Git branch, and build commands"
      >
        <form onSubmit={handleCreateDeployment} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Project Name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Deployment Target</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTarget('vps')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  target === 'vps' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-black/30 border-white/10 text-gray-400'
                }`}
              >
                Ubuntu VPS
              </button>
              <button
                type="button"
                onClick={() => setTarget('vercel')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  target === 'vercel' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-black/30 border-white/10 text-gray-400'
                }`}
              >
                Vercel
              </button>
              <button
                type="button"
                onClick={() => setTarget('heroku')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  target === 'heroku' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-black/30 border-white/10 text-gray-400'
                }`}
              >
                Heroku
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Git Repository URL</label>
            <input
              type="url"
              required
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Build Command</label>
              <input
                type="text"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm" icon={Rocket} loading={submitting}>
              Launch Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
