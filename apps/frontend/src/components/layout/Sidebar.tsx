'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderGit2,
  Bot,
  Sparkles,
  Rocket,
  Terminal,
  Cpu,
  Github,
  Triangle,
  Layers,
  Container,
  FolderOpen,
  Activity,
  Archive,
  ShieldCheck,
  Settings,
  Server,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'All Projects', href: '/projects', icon: FolderGit2 },
  { name: 'Bot Manager', href: '/bots', icon: Bot, badge: 'Telegram' },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'Pro' },
  { name: 'Deployment Center', href: '/deployments', icon: Rocket },
  { name: 'Deployment Terminal', href: '/deployment-terminal', icon: Terminal },
  { name: 'VPS Terminal', href: '/terminal', icon: Cpu },
  { name: 'GitHub Integration', href: '/integrations/github', icon: Github },
  { name: 'Vercel Integration', href: '/integrations/vercel', icon: Triangle },
  { name: 'Heroku Integration', href: '/integrations/heroku', icon: Layers },
  { name: 'Docker Manager', href: '/docker', icon: Container },
  { name: 'File Manager', href: '/files', icon: FolderOpen },
  { name: 'Monitoring & Logs', href: '/monitoring', icon: Activity },
  { name: 'Backup & Restore', href: '/backups', icon: Archive },
  { name: 'Security Center', href: '/security', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#0d121f]/95 backdrop-blur-xl h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.08] gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            NEXUS <span className="text-cyan-400 font-extrabold">AI</span>
          </span>
          <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
            Cloud Platform
          </span>
        </div>
      </div>

      {/* Server Switcher / Quick Status */}
      <div className="p-3 border-b border-white/[0.06]">
        <Link
          href="/servers"
          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="truncate">
              <p className="text-xs font-semibold text-gray-200 truncate">Nexus-Ubuntu-VPS</p>
              <p className="text-[10px] text-gray-400">194.164.72.105 (Online)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase',
                    item.badge === 'Telegram'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Agent & System Version Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0a0e17]">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">NEXUS Agent</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            v1.2.0 Active
          </span>
        </div>
      </div>
    </aside>
  );
};
