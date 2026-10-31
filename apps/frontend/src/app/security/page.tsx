'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Key,
  Users,
  AlertCircle,
  Lock,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { IAuditLog } from '@/types';

export default function SecurityCenterPage() {
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurity = async () => {
    setLoading(true);
    const [resA, resO] = await Promise.all([
      api.get<IAuditLog[]>('/security/audit-logs'),
      api.get<any>('/security/overview'),
    ]);

    if (resA.success && resA.data) setAuditLogs(resA.data);
    if (resO.success && resO.data) setOverview(resO.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Security & Compliance Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Zero-trust authentication history, permission scopes, and real-time audit ledger
          </p>
        </div>
      </div>

      {/* Security Score & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex flex-col justify-between" glow>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Health</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-emerald-400">{overview?.securityScore || 92}</span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Infrastructure hardening policies and sandboxed execution guards are fully active.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Optimal Defense State</span>
          </div>
        </GlassCard>

        <GlassCard className="md:col-span-2 p-6">
          <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Security Guard Recommendations
          </h3>
          <div className="space-y-2.5">
            {overview?.recommendations?.map((rec: any) => (
              <div key={rec.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{rec.title}</p>
                  <p className="text-[11px] text-gray-400">Impact: {rec.impact.toUpperCase()}</p>
                </div>
                <Badge variant={rec.status === 'configured' || rec.status === 'good' ? 'online' : 'warning'}>
                  {rec.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Audit Trail Table */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-400" />
          Audit Trail Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Action</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Resource</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-mono font-semibold text-cyan-400">{log.action}</td>
                  <td className="py-3 text-gray-100">{log.userName}</td>
                  <td className="py-3 font-mono text-gray-400">{log.resourceType}</td>
                  <td className="py-3 font-mono text-gray-400">{log.ipAddress}</td>
                  <td className="py-3">
                    <Badge variant={log.status === 'success' ? 'online' : 'offline'}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-right text-gray-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
