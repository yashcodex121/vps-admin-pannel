'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import {
  Container,
  Play,
  Square,
  RotateCw,
  FileText,
  Layers,
  HardDrive,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { IDockerContainer, IDockerImage } from '@/types';

export default function DockerManagerPage() {
  const [containers, setContainers] = useState<IDockerContainer[]>([]);
  const [images, setImages] = useState<IDockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLogContainer, setActiveLogContainer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDockerData = async () => {
    setLoading(true);
    const [resC, resI] = await Promise.all([
      api.get<IDockerContainer[]>('/docker/containers'),
      api.get<IDockerImage[]>('/docker/images'),
    ]);

    if (resC.success && resC.data) setContainers(resC.data);
    if (resI.success && resI.data) setImages(resI.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDockerData();
  }, []);

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`${id}-${action}`);
    const res = await api.post(`/docker/containers/${id}/action`, { action });
    if (res.success && res.data) {
      setContainers(prev => prev.map(c => c.id === id ? res.data : c));
    }
    setActionLoading(null);
  };

  const handleViewLogs = async (id: string) => {
    setActiveLogContainer(id);
    const res = await api.get<{ logs: string[] }>(`/docker/containers/${id}/logs`);
    if (res.success && res.data) {
      setLogs(res.data.logs);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Container className="w-6 h-6 text-cyan-400" />
            Docker Container Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Sandboxed container daemon supervision via authenticated NEXUS Agent outbound proxy
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchDockerData} loading={loading}>
          Refresh Containers
        </Button>
      </div>

      {/* Containers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {containers.map((container) => {
          const isRunning = container.state === 'running';
          return (
            <GlassCard key={container.id} className="p-6 flex flex-col justify-between" glow>
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Container className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{container.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{container.image}</p>
                    </div>
                  </div>
                  <Badge variant={isRunning ? 'online' : 'offline'} pulse={isRunning}>
                    {container.state.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1 text-xs font-mono text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Container ID:</span>
                    <span className="text-cyan-400">{container.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ports:</span>
                    <span>{container.ports.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPU Usage:</span>
                    <span>{container.cpuPercent || 0.4}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Memory:</span>
                    <span>{container.memoryUsage || '34.2 MB'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/[0.06]">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCw}
                  className="flex-1"
                  loading={actionLoading === `${container.id}-restart`}
                  onClick={() => handleAction(container.id, 'restart')}
                >
                  Restart
                </Button>

                {isRunning ? (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Square}
                    loading={actionLoading === `${container.id}-stop`}
                    onClick={() => handleAction(container.id, 'stop')}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Play}
                    loading={actionLoading === `${container.id}-start`}
                    onClick={() => handleAction(container.id, 'start')}
                  >
                    Start
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  icon={FileText}
                  onClick={() => handleViewLogs(container.id)}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Docker Images Table */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Cached Docker Images
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Repository</th>
                <th className="pb-3">Tag</th>
                <th className="pb-3">Image ID</th>
                <th className="pb-3">Size</th>
                <th className="pb-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              {images.map((img) => (
                <tr key={img.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-semibold text-gray-100">{img.repository}</td>
                  <td className="py-3 font-mono text-cyan-400">{img.tag}</td>
                  <td className="py-3 font-mono text-gray-400">{img.id}</td>
                  <td className="py-3 font-mono text-gray-300">{img.size}</td>
                  <td className="py-3 text-right text-gray-400">{img.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Container Logs Modal */}
      <Modal
        isOpen={!!activeLogContainer}
        onClose={() => setActiveLogContainer(null)}
        title={`Container Logs: ${activeLogContainer}`}
        description="Live container stdout & stderr stream"
        maxWidth="max-w-2xl"
      >
        <div className="bg-black/90 rounded-xl p-4 font-mono text-xs text-gray-300 h-80 overflow-y-auto space-y-1 custom-scrollbar border border-white/10">
          {logs.map((line, idx) => (
            <div key={idx} className="hover:bg-white/[0.03] px-1 py-0.5 rounded leading-relaxed">
              {line}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
