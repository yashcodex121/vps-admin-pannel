'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Terminal,
  RotateCw,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Rocket,
} from 'lucide-react';
import { IDeployment, IDeploymentLog } from '@nexus/types';

export default function DeploymentTerminalPage() {
  const [activeDeployment, setActiveDeployment] = useState<IDeployment | null>(null);
  const [logs, setLogs] = useState<IDeploymentLog[]>([]);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchActive = async () => {
    const res = await api.get<IDeployment[]>('/deployments');
    if (res.success && res.data && res.data.length > 0) {
      const dep = res.data[0];
      setActiveDeployment(dep);
      setLogs(dep.logs || []);
    }
  };

  useEffect(() => {
    fetchActive();

    const socket = getSocket();
    if (socket) {
      socket.on('deployment:started', (dep: IDeployment) => {
        setActiveDeployment(dep);
        setLogs(dep.logs || []);
      });

      socket.on('deployment:log', (logEntry: any) => {
        setLogs((prev) => [...prev, logEntry]);
      });

      socket.on('deployment:updated', (updatedDep: IDeployment) => {
        setActiveDeployment(updatedDep);
      });
    }

    return () => {
      if (socket) {
        socket.off('deployment:started');
        socket.off('deployment:log');
        socket.off('deployment:updated');
      }
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleAiDiagnose = async () => {
    if (!activeDeployment) return;
    setDiagnosing(true);
    const res = await api.get<any>(`/deployments/${activeDeployment._id}/ai-diagnose`);
    if (res.success && res.data) {
      setDiagnostics(res.data.analysis);
    }
    setDiagnosing(false);
  };

  const handleDownloadLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.stage.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${activeDeployment?._id || 'build'}-logs.txt`;
    a.click();
  };

  const currentStage = activeDeployment?.stage || 'live';
  const isComplete = currentStage === 'live' || currentStage === 'failed';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-cyan-400" />
            Live Deployment Terminal
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time stdout, dependency resolution, compiler outputs, and AI build analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Sparkles} onClick={handleAiDiagnose} loading={diagnosing}>
            AI Error Diagnosis
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadLogs}>
            Download Logs
          </Button>
        </div>
      </div>

      {/* Deployment Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#111827] p-4 rounded-xl border border-white/[0.08]">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Deployment ID</span>
          <span className="text-xs font-mono text-cyan-400 font-semibold">{activeDeployment?._id || 'dep_c8f901'}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Project</span>
          <span className="text-xs font-semibold text-white">{activeDeployment?.projectName || 'Quiz Telegram Bot'}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Target</span>
          <span className="text-xs font-semibold text-purple-400 uppercase">{activeDeployment?.target || 'Ubuntu VPS'}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Stage</span>
          <div className="mt-0.5">
            <Badge variant={currentStage === 'live' ? 'online' : 'purple'} pulse={!isComplete}>
              {currentStage.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Terminal Output Window */}
      <GlassCard className="p-0 overflow-hidden border-white/10 bg-[#070b12]">
        {/* Terminal Title Bar */}
        <div className="px-4 py-3 bg-[#0e1422] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs text-gray-400">
              nexus-deploy-runner &bull; {activeDeployment?.branch || 'main'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Duration: {activeDeployment?.durationSeconds || 13}s</span>
          </div>
        </div>

        {/* Live Terminal Log Stream */}
        <div className="p-4 sm:p-6 font-mono text-xs text-gray-300 h-[28rem] overflow-y-auto space-y-2 custom-scrollbar">
          {logs.map((log, index) => {
            const isWarn = log.level === 'warn';
            const isErr = log.level === 'error';
            return (
              <div key={index} className="flex items-start gap-3 leading-relaxed hover:bg-white/[0.03] px-2 py-0.5 rounded">
                <span className="text-gray-600 select-none text-[11px] font-mono w-6 text-right">
                  {index + 1}
                </span>
                <span className="text-gray-500 text-[10px] select-none uppercase tracking-wider font-semibold w-16">
                  [{log.stage}]
                </span>
                <span
                  className={
                    isErr
                      ? 'text-rose-400 font-semibold'
                      : isWarn
                      ? 'text-amber-400'
                      : log.message.includes('LIVE')
                      ? 'text-emerald-400 font-bold'
                      : log.message.includes('npm') || log.message.includes('Building')
                      ? 'text-cyan-300'
                      : 'text-gray-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            );
          })}

          <div ref={logsEndRef} />
        </div>
      </GlassCard>

      {/* AI Error Diagnosis Modal */}
      <Modal
        isOpen={!!diagnostics}
        onClose={() => setDiagnostics(null)}
        title="AI Build & Architecture Diagnosis"
        description="Analyzed by NEXUS AI co-pilot using current deployment logs and system specs"
        maxWidth="max-w-2xl"
      >
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
          {diagnostics}
        </div>
      </Modal>
    </div>
  );
}
