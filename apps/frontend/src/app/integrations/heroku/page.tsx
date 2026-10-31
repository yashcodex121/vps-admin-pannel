'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  Layers,
  RotateCw,
  ExternalLink,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { IHerokuApp } from '@/types';

export default function HerokuIntegrationPage() {
  const [apps, setApps] = useState<IHerokuApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState<string | null>(null);

  useEffect(() => {
    api.get<IHerokuApp[]>('/heroku/apps').then(res => {
      if (res.success && res.data) setApps(res.data);
      setLoading(false);
    });
  }, []);

  const handleRestart = async (appId: string) => {
    setRestarting(appId);
    const res = await api.post('/heroku/restart', { appId });
    if (res.success) {
      alert(res.data?.message || 'Dynos restarted.');
    }
    setRestarting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-purple-400" />
            Heroku Platform Integration
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Supervise background worker dynos and web application releases
          </p>
        </div>

        <Badge variant="online">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Heroku API Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <GlassCard key={app.id} className="p-6 flex flex-col justify-between" glow>
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">{app.name}</h3>
                  <a
                    href={app.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {app.webUrl}
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </div>
                <Badge variant="online">Dynos: {app.dynosRunning}</Badge>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] text-xs font-mono space-y-1 mb-4">
                <div className="flex justify-between text-gray-400">
                  <span>Stack:</span>
                  <span className="text-gray-200">{app.stack}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Region:</span>
                  <span className="text-gray-200 uppercase">{app.region}</span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RotateCw}
              loading={restarting === app.id}
              onClick={() => handleRestart(app.id)}
            >
              Restart All Dynos
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
