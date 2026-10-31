'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatBytes, formatUptime } from '@/lib/utils';
import {
  Server,
  Activity,
  Bot,
  Rocket,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  HardDrive,
  Cpu,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveCpu, setLiveCpu] = useState<number>(18);
  const [liveRam, setLiveRam] = useState<number>(41);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await api.get('/dashboard');
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.latestMetrics) {
        setLiveCpu(res.data.latestMetrics.cpuUsagePercent);
        setLiveRam(res.data.latestMetrics.memoryPercent);
      }
      if (res.data.primaryMetricsHistory) {
        const formatted = res.data.primaryMetricsHistory.map((m: any, i: number) => ({
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: m.cpuUsagePercent,
          ram: m.memoryPercent,
        }));
        setChartData(formatted);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();

    const socket = getSocket();
    if (socket) {
      socket.on('metrics:summary', (summary: any) => {
        setLiveCpu(summary.cpu);
        setLiveRam(summary.ram);
        setChartData((prev) => {
          const next = [...prev.slice(-14), {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: summary.cpu,
            ram: summary.ram,
          }];
          return next;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('metrics:summary');
      }
    };
  }, []);

  const stats = data?.stats || {
    totalServers: 1,
    onlineServers: 1,
    runningServices: 3,
    failedServices: 0,
    activeDeployments: 0,
  };

  const breakdown = data?.breakdown || {
    telegramBots: 1,
    apis: 1,
    webApps: 1,
    dockerServices: 1,
    pm2Services: 2,
    systemdServices: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Cloud Infrastructure Control
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time telemetry, service processes, and automated cloud deployments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchDashboard}
            loading={loading}
          >
            Refresh
          </Button>
          <Link href="/servers">
            <Button variant="gradient" size="sm" icon={Plus}>
              Connect VPS
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <GlassCard className="p-4" glow>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Total VPS</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalServers}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{stats.onlineServers} Online</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4" glow>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Running Services</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.runningServices}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <span>{breakdown.pm2Services} PM2 · {breakdown.dockerServices} Docker</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4" glow>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Telegram Bots</span>
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{breakdown.telegramBots}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-400">
            <span>Quiz Bot (Active)</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4" glow>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Failed Services</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.failedServices}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <span>All systems healthy</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 col-span-2 sm:col-span-1" glow>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Deployments</span>
            <Rocket className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.activeDeployments}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-400">
            <span>Live pipeline ready</span>
          </div>
        </GlassCard>
      </div>

      {/* Primary Server Live Telemetry & Resource Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main CPU & Memory Live Area Chart */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">Resource Telemetry Stream</h3>
                <Badge variant="cyan" pulse>Live 3s</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Streaming CPU and RAM load from NEXUS Agent on Ubuntu VPS
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-gray-300">CPU: {liveCpu}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-gray-300">RAM: {liveRam}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length ? chartData : [{ time: '12:00', cpu: 18, ram: 41 }]}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" name="CPU %" />
                <Area type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#ramGradient)" name="RAM %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Server Hardware Spec & Load gauges */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-base">Server Health & Specs</h3>
              <Badge variant="online">Online</Badge>
            </div>

            <div className="space-y-4">
              {/* CPU Core info */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    CPU Cores (4 Cores)
                  </span>
                  <span className="text-gray-200 font-mono font-medium">{liveCpu}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${liveCpu}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Memory Allocation (8 GB)
                  </span>
                  <span className="text-gray-200 font-mono font-medium">{liveRam}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${liveRam}%` }}
                  />
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    Storage (NVMe SSD 160 GB)
                  </span>
                  <span className="text-gray-200 font-mono font-medium">32.5%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `32.5%` }}
                  />
                </div>
              </div>

              {/* Network and Uptime metrics */}
              <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 text-[11px]">System Uptime</p>
                  <p className="font-mono text-gray-200 font-medium mt-0.5">9d 19h (99.98%)</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Network Bandwidth</p>
                  <p className="font-mono text-cyan-400 font-medium mt-0.5">RX 480 KB/s</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Active Processes</p>
                  <p className="font-mono text-gray-200 font-medium mt-0.5">124 PIDs</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Operating System</p>
                  <p className="text-gray-200 font-medium mt-0.5 truncate">Ubuntu 24.04</p>
                </div>
              </div>
            </div>
          </div>

          <Link href="/monitoring" className="mt-4">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              View Detailed Telemetry & Logs
            </Button>
          </Link>
        </GlassCard>
      </div>

      {/* Discovered Services & Bots Quick Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">Discovered Services & Telegram Bots</h3>
            <p className="text-xs text-gray-400 mt-0.5">Managed by PM2, Docker, and NEXUS Agent supervisor</p>
          </div>
          <Link href="/bots">
            <Button variant="outline" size="sm" icon={ExternalLink}>
              Bot Manager
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Service Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">PID</th>
                <th className="pb-3">Memory</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-gray-100 font-semibold">Quiz Telegram Bot</p>
                    <p className="text-[10px] text-gray-400 font-mono">python3 -m bot.main</p>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Telegram Bot
                  </span>
                </td>
                <td className="py-3 font-mono text-gray-400">PM2</td>
                <td className="py-3">
                  <Badge variant="online" pulse>Running</Badge>
                </td>
                <td className="py-3 font-mono text-gray-400">14205</td>
                <td className="py-3 font-mono text-gray-400">184.2 MB</td>
                <td className="py-3 text-right">
                  <Link href="/bots">
                    <Button variant="secondary" size="sm">Manage</Button>
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-gray-100 font-semibold">Core API Gateway</p>
                    <p className="text-[10px] text-gray-400 font-mono">node dist/index.js</p>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    REST API
                  </span>
                </td>
                <td className="py-3 font-mono text-gray-400">PM2</td>
                <td className="py-3">
                  <Badge variant="online">Running</Badge>
                </td>
                <td className="py-3 font-mono text-gray-400">18921</td>
                <td className="py-3 font-mono text-gray-400">320.0 MB</td>
                <td className="py-3 text-right">
                  <Link href="/bots">
                    <Button variant="secondary" size="sm">Manage</Button>
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 font-medium flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-gray-100 font-semibold">Redis Cache</p>
                    <p className="text-[10px] text-gray-400 font-mono">redis:7-alpine</p>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Database
                  </span>
                </td>
                <td className="py-3 font-mono text-gray-400">Docker</td>
                <td className="py-3">
                  <Badge variant="online">Running</Badge>
                </td>
                <td className="py-3 font-mono text-gray-400">c7d9a1</td>
                <td className="py-3 font-mono text-gray-400">34.2 MB</td>
                <td className="py-3 text-right">
                  <Link href="/docker">
                    <Button variant="secondary" size="sm">Inspect</Button>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
