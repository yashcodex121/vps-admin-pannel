'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import {
  Server,
  Plus,
  ShieldCheck,
  Terminal,
  Copy,
  Trash2,
  CheckCircle2,
  Cpu,
  HardDrive,
  Activity,
  Key,
} from 'lucide-react';
import { IServer } from '@/types';
import { formatBytes, formatUptime } from '@/lib/utils';

export default function ServersPage() {
  const [servers, setServers] = useState<IServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [installScriptModal, setInstallScriptModal] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('Production-Ubuntu-VPS');
  const [ip, setIp] = useState('194.164.72.105');
  const [port, setPort] = useState(22);
  const [sshUser, setSshUser] = useState('root');
  const [authMethod, setAuthMethod] = useState<'ssh_key' | 'ssh_password' | 'agent_token'>('agent_token');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');

  const fetchServers = async () => {
    setLoading(true);
    const res = await api.get<IServer[]>('/servers');
    if (res.success && res.data) {
      setServers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    const res = await api.post('/servers/connect', {
      name,
      ip,
      port,
      sshUser,
      authMethod,
      privateKey: authMethod === 'ssh_key' ? privateKey : undefined,
      password: authMethod === 'ssh_password' ? password : undefined,
    });

    if (res.success && res.data) {
      setIsModalOpen(false);
      fetchServers();
      if (res.data.installCommand) {
        setInstallScriptModal(res.data.installCommand);
      }
    } else {
      alert(`Connection error: ${res.error || 'Failed to verify VPS'}`);
    }
    setConnecting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect and delete this server?')) return;
    const res = await api.delete(`/servers/${id}`);
    if (res.success) {
      fetchServers();
    }
  };

  const handleViewInstallScript = async (id: string) => {
    const res = await api.get<{ script: string }>(`/servers/${id}/install-script`);
    if (res.success && res.data) {
      setInstallScriptModal(res.data.script);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-cyan-400" />
            VPS Server Connection Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Connect Ubuntu 22.04/24.04 VPS servers using encrypted SSH credentials or NEXUS Agent daemon
          </p>
        </div>

        <Button variant="gradient" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Connect New VPS
        </Button>
      </div>

      {/* Servers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servers.map((server) => {
          const isOnline = server.status === 'online';
          return (
            <GlassCard key={server._id} className="p-6 flex flex-col justify-between" glow>
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{server.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{server.ip}:{server.port}</p>
                    </div>
                  </div>
                  <Badge variant={isOnline ? 'online' : 'offline'} pulse={isOnline}>
                    {server.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Specs Pill Summary */}
                {server.specs && (
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-black/40 border border-white/[0.04] mb-4">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Operating System</span>
                      <span className="font-medium text-gray-200 truncate block">{server.specs.os}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">CPU & Cores</span>
                      <span className="font-mono text-cyan-400">{server.specs.cpuCores} Cores ({server.specs.arch})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Total RAM</span>
                      <span className="font-mono text-purple-400">{formatBytes(server.specs.totalRamBytes)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Root Storage</span>
                      <span className="font-mono text-emerald-400">{formatBytes(server.specs.totalDiskBytes)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Agent v{server.agentVersion || '1.2.0'} Active
                  </span>
                  <span className="font-mono text-[11px] text-gray-500">
                    Host: {server.specs?.hostname || 'vps-srv'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/[0.06]">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Terminal}
                  className="flex-1"
                  onClick={() => handleViewInstallScript(server._id)}
                >
                  Agent Script
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-rose-400 hover:text-rose-300"
                  onClick={() => handleDelete(server._id)}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Connect New VPS Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect Ubuntu VPS Server"
        description="Credentials are AES-256-GCM encrypted and never exposed to the frontend"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Server Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Server IP / Hostname</label>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">SSH Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10))}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">SSH Username</label>
              <input
                type="text"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Authentication Method</label>
              <select
                value={authMethod}
                onChange={(e: any) => setAuthMethod(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="agent_token">NEXUS Agent Token (Recommended)</option>
                <option value="ssh_key">SSH Private Key</option>
                <option value="ssh_password">SSH Password</option>
              </select>
            </div>
          </div>

          {authMethod === 'ssh_key' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">SSH Private Key (OpenSSH RSA/Ed25519)</label>
              <textarea
                rows={4}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                className="w-full bg-black/60 font-mono text-xs border border-white/10 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          {authMethod === 'ssh_password' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">SSH Root Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm" icon={Server} loading={connecting}>
              Verify & Register Server
            </Button>
          </div>
        </form>
      </Modal>

      {/* Agent Install Script Modal */}
      <Modal
        isOpen={!!installScriptModal}
        onClose={() => setInstallScriptModal(null)}
        title="Install NEXUS Agent on Ubuntu VPS"
        description="Run this single command on your VPS terminal to register the telemetry agent"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-black/90 rounded-xl border border-white/10 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between">
            <span>{installScriptModal}</span>
            <button
              onClick={() => {
                if (installScriptModal) {
                  navigator.clipboard.writeText(installScriptModal);
                  alert('Script copied to clipboard!');
                }
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white ml-2 flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>1. SSH into your VPS: <span className="font-mono text-gray-200">ssh root@{ip}</span></p>
            <p>2. Paste and run the command above.</p>
            <p>3. The agent will establish an outbound secure WebSocket to NEXUS AI and stream live telemetry automatically.</p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setInstallScriptModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
