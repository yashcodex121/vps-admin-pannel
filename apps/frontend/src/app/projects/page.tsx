'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FolderGit2,
  Bot,
  Globe,
  Database,
  Rocket,
  Plus,
  ExternalLink,
  Github,
  Clock,
} from 'lucide-react';

const PROJECTS = [
  {
    id: 'prj_1',
    name: 'Quiz Telegram Bot',
    category: 'Telegram Bot',
    tech: 'Python · Telethon · PM2',
    status: 'Running',
    server: 'Ubuntu 24.04 VPS',
    lastDeploy: '2 hours ago',
    icon: Bot,
    color: 'text-blue-400',
  },
  {
    id: 'prj_2',
    name: 'Core API Gateway',
    category: 'REST Microservice',
    tech: 'Node.js · Express · TypeScript',
    status: 'Running',
    server: 'Ubuntu 24.04 VPS',
    lastDeploy: '1 day ago',
    icon: Globe,
    color: 'text-cyan-400',
  },
  {
    id: 'prj_3',
    name: 'Redis Cache Instance',
    category: 'Database & Broker',
    tech: 'Docker · Redis 7-Alpine',
    status: 'Running',
    server: 'Ubuntu 24.04 VPS',
    lastDeploy: '10 days ago',
    icon: Database,
    color: 'text-purple-400',
  },
  {
    id: 'prj_4',
    name: 'Nexus Web SaaS Frontend',
    category: 'Cloud Web App',
    tech: 'Next.js 14 · Tailwind · Vercel',
    status: 'Running',
    server: 'Vercel Edge',
    lastDeploy: '30 mins ago',
    icon: Rocket,
    color: 'text-emerald-400',
  },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
            All Infrastructure Projects
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Unified view of active Telegram bots, APIs, databases, and web services
          </p>
        </div>

        <Link href="/deployments">
          <Button variant="gradient" size="sm" icon={Plus}>
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <GlassCard key={project.id} className="p-6 flex flex-col justify-between" glow>
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${project.color}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-gray-400">{project.category}</p>
                    </div>
                  </div>
                  <Badge variant="online" pulse>{project.status}</Badge>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Stack:</span>
                    <span className="text-gray-200 font-mono">{project.tech}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Target Server:</span>
                    <span className="text-cyan-400">{project.server}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Last Deployed:</span>
                    <span className="text-gray-300 font-mono">{project.lastDeploy}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
                <Link href="/bots" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  <span>Process Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link href="/deployments">
                  <Button variant="secondary" size="sm">Deploy</Button>
                </Link>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
