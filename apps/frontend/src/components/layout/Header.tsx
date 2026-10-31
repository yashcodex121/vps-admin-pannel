'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import {
  Bell,
  Sparkles,
  Server,
  Radio,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [alertsCount, setAlertsCount] = useState(1);

  useEffect(() => {
    const s = getSocket();
    if (s) {
      setWsConnected(s.connected);
      s.on('connect', () => setWsConnected(true));
      s.on('disconnect', () => setWsConnected(false));
      s.on('alert:new', () => setAlertsCount(prev => prev + 1));
    }
  }, []);

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0d121f]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Server and Telemetry status */}
      <div className="flex items-center gap-4">
        <Link
          href="/servers"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 transition-all text-xs"
        >
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-gray-300 font-medium">Ubuntu 24.04 Production</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </Link>

        {/* Real-time WebSocket Status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
          <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
          <span className="text-[11px] font-mono">
            {wsConnected ? 'Live Telemetry Stream' : 'Connecting Stream...'}
          </span>
        </div>
      </div>

      {/* Right: AI Quick Action + Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Quick AI Summon */}
        <Link
          href="/ai-assistant"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-indigo-500/40 hover:border-indigo-500/70 text-cyan-300 text-xs font-medium transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ask NEXUS AI</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-black/40 rounded border border-white/10 text-gray-400">
            Ctrl+K
          </kbd>
        </Link>

        {/* Notifications */}
        <Link
          href="/monitoring"
          className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </Link>

        {/* User Pill / Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-gray-200 leading-tight">{user?.name || 'Nexus Admin'}</p>
            <p className="text-[10px] text-gray-400 leading-tight capitalize">{user?.role || 'Admin'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
