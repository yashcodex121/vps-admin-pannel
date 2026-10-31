'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  Github,
  GitBranch,
  Star,
  ExternalLink,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import { IGitHubRepo } from '@/types';

export default function GitHubIntegrationPage() {
  const [repos, setRepos] = useState<IGitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<IGitHubRepo[]>('/github/repos').then(res => {
      if (res.success && res.data) setRepos(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Github className="w-6 h-6 text-white" />
            GitHub OAuth & Repository Sync
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Connected repositories for automatic webhook triggers and zero-downtime VPS deployments
          </p>
        </div>

        <Badge variant="online">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          OAuth Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo) => (
          <GlassCard key={repo.id} className="p-6 flex flex-col justify-between" glow>
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-white text-base hover:text-cyan-400 transition-colors">
                  <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                    {repo.name}
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                </h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {repo.language || 'Code'}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-4 min-h-[2.5rem] leading-relaxed">
                {repo.description || 'Repository registered in NEXUS deployment pipeline.'}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-400 font-mono mb-4">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                  {repo.defaultBranch}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  {repo.starsCount}
                </span>
              </div>
            </div>

            <Link href="/deployments">
              <Button variant="secondary" size="sm" icon={Rocket} className="w-full justify-center">
                Deploy to VPS
              </Button>
            </Link>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
