'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Activity,
  AlertTriangle,
  Radio,
  CheckCircle,
  FileText,
  RotateCw,
  HardDrive,
  Cpu,
  Wifi,
} from 'lucide-react';
import { ISystemAlert } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function MonitoringLogsPage() {
  const [alerts, setAlerts] = useState<ISystemAlert[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitoring = async () => {
    setLoading(true);
    const [resA, resL, resM] = await Promise.all([
      api.get<ISystemAlert[]>('/monitoring/alerts'),
      api.get<string[]>('/monitoring/logs'),
      api.get<any[]>('/monitoring/metrics'),
    ]);

    if (resA.success && resA.data) setAlerts(resA.data);
    if (resL.success && resL.data) setLogs(resL.data);
    if (resM.success && resM.data) {
      const formatted = resM.data.map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: m.cpuUsagePercent,
        ram: m.memoryPercent,
        netRx: Math.round(m.networkRxBytesSec / 1024),
      }));
      setMetrics(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const handleAck = async (id: string) => {
    const res = await api.post(`/monitoring/alerts/${id}/ack`);
    if (res.success) {
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Monitoring & System Logs
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time alerting thresholds, crash detection, and unified daemon logs
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RotateCw} onClick={fetchMonitoring} loading={loading}>
          Refresh Telemetry
        </Button>
      </div>

      {/* Network and Historical Telemetry Chart */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">Network Bandwidth & Load History</h3>
            <p className="text-xs text-gray-400">Ingested via outbound socket heartbeat</p>
          </div>
          <Badge variant="cyan" pulse>Live Ingestion</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.length ? metrics : [{ time: '12:00', cpu: 15, ram: 40, netRx: 450 }]}>
              <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} dot={false} name="CPU %" />
              <Line type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} dot={false} name="RAM %" />
              <Line type="monotone" dataKey="netRx" stroke="#10b981" strokeWidth={2} dot={false} name="Network RX (KB/s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active System Alerts */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            System Alerts & Thresholds
          </h3>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No active alerts. All servers operational.</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    alert.severity === 'critical' ? 'bg-rose-950/20 border-rose-500/30' : 'bg-blue-950/20 border-blue-500/30'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{alert.title}</h4>
                    <p className="text-[11px] text-gray-300 mt-0.5">{alert.message}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">Server: {alert.serverName}</span>
                  </div>
                  {!alert.acknowledged ? (
                    <Button variant="secondary" size="sm" onClick={() => handleAck(alert._id)}>
                      Ack
                    </Button>
                  ) : (
                    <Badge variant="online">Resolved</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Unified System Logs */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Journalctl & Daemon Stream
            </h3>
            <div className="bg-black/90 p-4 rounded-xl font-mono text-xs text-gray-300 h-64 overflow-y-auto space-y-1.5 custom-scrollbar border border-white/10">
              {logs.map((line, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-white/[0.04] px-1 rounded text-[11px]">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
