'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Download,
  ShieldCheck,
  Server,
  CornerDownLeft,
} from 'lucide-react';

export default function VpsTerminalPage() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [outputLines, setOutputLines] = useState<string[]>([
    'Connected to Ubuntu 24.04 LTS (NEXUS Restricted Diagnostic Shell)',
    'Type commands such as "pm2 status", "uptime", "df -h", "free -m", "docker ps", etc.',
    'System security guard: All operations logged for audit compliance.',
    '--------------------------------------------------------------------------------',
  ]);
  const [executing, setExecuting] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    const currentCmd = command.trim();
    setHistory((prev) => [...prev, currentCmd]);
    setOutputLines((prev) => [...prev, `$ ${currentCmd}`]);
    setCommand('');
    setExecuting(true);

    const res = await api.post('/terminal/exec', {
      serverId: 'srv_ubuntu_prod_01',
      command: currentCmd,
    });

    if (res.success && res.data?.output) {
      setOutputLines((prev) => [...prev, res.data.output]);
    } else {
      setOutputLines((prev) => [...prev, `Error: ${res.error || 'Execution failed'}`]);
    }

    setExecuting(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputLines.join('\n'));
    alert('Terminal session copied to clipboard');
  };

  const handleClear = () => {
    setOutputLines([
      'Connected to Ubuntu 24.04 LTS (NEXUS Restricted Diagnostic Shell)',
      '--------------------------------------------------------------------------------',
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TerminalIcon className="w-6 h-6 text-cyan-400" />
            Restricted VPS Terminal
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Sandboxed interactive execution environment with zero-trust command authorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" pulse>
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Allowlist Active
          </Badge>
          <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopy}>
            Copy
          </Button>
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal View */}
      <GlassCard className="p-0 overflow-hidden border-white/10 bg-[#070b12]">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-[#0e1422] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="font-mono text-xs text-gray-300">
              root@nexus-ubuntu-vps:~ (Active Session)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span>SSH Port: 22</span>
            <span>&bull;</span>
            <span>Channel: Outbound WSS</span>
          </div>
        </div>

        {/* Output Screen */}
        <div className="p-4 sm:p-6 font-mono text-xs text-gray-200 h-[28rem] overflow-y-auto space-y-1.5 custom-scrollbar">
          {outputLines.map((line, index) => (
            <div
              key={index}
              className={`leading-relaxed whitespace-pre-wrap ${
                line.startsWith('$') ? 'text-cyan-400 font-semibold' : line.startsWith('Error:') ? 'text-rose-400' : 'text-gray-300'
              }`}
            >
              {line}
            </div>
          ))}
          {executing && (
            <div className="text-gray-500 animate-pulse">$ executing command...</div>
          )}
          <div ref={terminalBottomRef} />
        </div>

        {/* Command Input Prompt */}
        <form
          onSubmit={handleExecute}
          className="p-3 bg-[#0c111d] border-t border-white/[0.08] flex items-center gap-2"
        >
          <span className="text-cyan-400 font-mono text-xs pl-2 font-bold">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type safe command (e.g., pm2 status, df -h, free -m, uptime, ps aux)..."
            className="flex-1 bg-transparent text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            icon={CornerDownLeft}
            disabled={!command.trim() || executing}
          >
            Run
          </Button>
        </form>
      </GlassCard>

      {/* Quick Diagnostic Pill Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        <span className="text-gray-500 text-[11px] whitespace-nowrap">Quick Commands:</span>
        <button
          onClick={() => setCommand('pm2 status')}
          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono text-[11px] text-gray-300 transition-colors"
        >
          pm2 status
        </button>
        <button
          onClick={() => setCommand('docker ps')}
          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono text-[11px] text-gray-300 transition-colors"
        >
          docker ps
        </button>
        <button
          onClick={() => setCommand('uptime')}
          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono text-[11px] text-gray-300 transition-colors"
        >
          uptime
        </button>
        <button
          onClick={() => setCommand('free -m')}
          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono text-[11px] text-gray-300 transition-colors"
        >
          free -m
        </button>
        <button
          onClick={() => setCommand('df -h')}
          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-mono text-[11px] text-gray-300 transition-colors"
        >
          df -h
        </button>
      </div>
    </div>
  );
}
