'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Bot,
  Play,
  Square,
  RotateCw,
  FileText,
  Search,
  Activity,
  Layers,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';
import { IService } from '@/types';

export default function BotManagerPage() {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bots' | 'api' | 'web'>('all');
  const [search, setSearch] = useState('');
  const [activeLogService, setActiveLogService] = useState<IService | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    const res = await api.get<IService[]>('/services');
    if (res.success && res.data) {
      setServices(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();

    const socket = getSocket();
    if (socket) {
      socket.on('service:updated', (updated: IService) => {
        setServices(prev => prev.map(s => s._id === updated._id ? updated : s));
      });
    }

    return () => {
      if (socket) {
        socket.off('service:updated');
      }
    };
  }, []);

  const handleAction = async (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`${serviceId}-${action}`);
    const res = await api.post('/services/action', { serviceId, action });
    if (res.success && res.data) {
      setServices(prev => prev.map(s => s._id === serviceId ? res.data : s));
    }
    setActionLoading(null);
  };

  const handleViewLogs = async (service: IService) => {
    setActiveLogService(service);
    const res = await api.get<{ logs: string[] }>(`/services/${service._id}/logs`);
    if (res.success && res.data) {
      setLogs(res.data.logs);
    } else {
      setLogs([service.lastLogSnippet || 'No logs recorded']);
    }
  };

  const filtered = services.filter(s => {
    if (filter === 'bots' && !s.isBot && s.category !== 'telegram_bot') return false;
    if (filter === 'api' && s.category !== 'api_service') return false;
    if (filter === 'web' && s.category !== 'web_app') return false;
    if (search && !s.displayName.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" />
            Service & Telegram Bot Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Supervise, restart, inspect, and stream live stdout/stderr from PM2 and background workers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={RotateCw} onClick={fetchServices} loading={loading}>
            Sync Services
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            All Services ({services.length})
          </button>
          <button
            onClick={() => setFilter('bots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'bots' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Telegram Bots ({services.filter(s => s.isBot || s.category === 'telegram_bot').length})
          </button>
          <button
            onClick={() => setFilter('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'api' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            APIs
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search processes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => {
          const isRunning = service.status === 'running';
          return (
            <GlassCard key={service._id} className="p-5 flex flex-col justify-between" glow>
              <div>
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      {service.isBot ? <Bot className="w-4 h-4 text-blue-400" /> : <Activity className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{service.displayName}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">{service.name}</p>
                    </div>
                  </div>
                  <Badge variant={isRunning ? 'online' : 'offline'} pulse={isRunning}>
                    {service.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Command & Metadata */}
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] mb-3 text-[11px] font-mono text-gray-300 break-all">
                  $ {service.command || 'custom runtime'}
                </div>

                {/* Resource Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-white/[0.06] pt-3 mb-4">
                  <div>
                    <span className="text-gray-500 text-[10px] block">PID</span>
                    <span className="font-mono text-gray-200 font-semibold">{service.pid || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Memory</span>
                    <span className="font-mono text-gray-200 font-semibold">
                      {service.memoryBytes ? (service.memoryBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Restarts</span>
                    <span className="font-mono text-cyan-400 font-semibold">{service.restartsCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCw}
                  className="flex-1"
                  loading={actionLoading === `${service._id}-restart`}
                  onClick={() => handleAction(service._id, 'restart')}
                >
                  Restart
                </Button>

                {isRunning ? (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Square}
                    loading={actionLoading === `${service._id}-stop`}
                    onClick={() => handleAction(service._id, 'stop')}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Play}
                    loading={actionLoading === `${service._id}-start`}
                    onClick={() => handleAction(service._id, 'start')}
                  >
                    Start
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  icon={FileText}
                  onClick={() => handleViewLogs(service)}
                  title="View Realtime Logs"
                />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Log Viewer Modal */}
      <Modal
        isOpen={!!activeLogService}
        onClose={() => setActiveLogService(null)}
        title={`Live Logs: ${activeLogService?.displayName}`}
        description={`Process PID: ${activeLogService?.pid || 'N/A'} · Supervisor: ${activeLogService?.type}`}
        maxWidth="max-w-3xl"
      >
        <div className="bg-black/90 rounded-xl p-4 font-mono text-xs text-gray-300 h-96 overflow-y-auto space-y-1.5 custom-scrollbar border border-white/10">
          {logs.map((line, idx) => (
            <div key={idx} className="leading-relaxed hover:bg-white/[0.03] px-1 rounded">
              <span className="text-gray-500 mr-2">{idx + 1}</span>
              <span className={line.includes('[INFO]') ? 'text-cyan-300' : line.includes('ERR') ? 'text-rose-400' : 'text-gray-300'}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
