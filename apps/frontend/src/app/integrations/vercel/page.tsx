'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  Triangle,
  RotateCw,
  ExternalLink,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { IVercelProject } from '@nexus/types';

export default function VercelIntegrationPage() {
  const [projects, setProjects] = useState<IVercelProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeploying, setRedeploying] = useState<string | null>(null);

  useEffect(() => {
    api.get<IVercelProject[]>('/vercel/projects').then(res => {
      if (res.success && res.data) setProjects(res.data);
      setLoading(false);
    });
  }, []);

  const handleRedeploy = async (projectId: string) => {
    setRedeploying(projectId);
    const res = await api.post('/vercel/redeploy', { projectId });
    if (res.success) {
      alert(res.data?.message || 'Vercel redeployment triggered.');
    }
    setRedeploying(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Triangle className="w-6 h-6 text-white" />
            Vercel Cloud Integration
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Edge deployments, custom domains, and automated Next.js preview branching
          </p>
        </div>

        <Badge variant="online">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Vercel Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <GlassCard key={proj.id} className="p-6 flex flex-col justify-between" glow>
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">{proj.name}</h3>
                  <a
                    href={proj.domainUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Globe className="w-3 h-3" />
                    {proj.domainUrl}
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </div>
                <Badge variant="online">{proj.latestDeploymentStatus}</Badge>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] text-xs font-mono space-y-1 mb-4">
                <div className="flex justify-between text-gray-400">
                  <span>Framework:</span>
                  <span className="text-gray-200 uppercase">{proj.framework}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Status:</span>
                  <span className="text-emerald-400">Active / Optimized</span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RotateCw}
              loading={redeploying === proj.id}
              onClick={() => handleRedeploy(proj.id)}
            >
              Trigger Redeployment
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
