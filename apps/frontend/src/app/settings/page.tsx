'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Sparkles,
  Bell,
  Shield,
  Save,
  Key,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [aiProvider, setAiProvider] = useState('groq');
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [ramThreshold, setRamThreshold] = useState(90);
  const [diskThreshold, setDiskThreshold] = useState(85);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.success && res.data) {
        setAiProvider(res.data.aiProvider || 'groq');
        if (res.data.notifications) {
          setCpuThreshold(res.data.notifications.cpuThresholdPercent || 90);
          setRamThreshold(res.data.notifications.ramThresholdPercent || 90);
          setDiskThreshold(res.data.notifications.diskThresholdPercent || 85);
        }
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.patch('/settings', {
      aiProvider,
      notifications: {
        cpuThresholdPercent: cpuThreshold,
        ramThresholdPercent: ramThreshold,
        diskThresholdPercent: diskThreshold,
        emailAlerts,
      },
    });
    if (res.success) {
      alert('Settings saved successfully.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            Platform & Engine Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure default AI inference models, alerting thresholds, and profile security
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Administrator Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || 'Nexus Admin'}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white opacity-80"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'admin@nexus.ai'}
                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-white opacity-80"
              />
            </div>
          </div>
        </GlassCard>

        {/* AI Provider Config */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Default AI Model Engine
          </h3>
          <div className="space-y-3 text-xs">
            <p className="text-gray-400">
              Select which multi-model provider powers the natural-language command interpreter:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'groq', name: 'Groq Cloud', model: 'Llama 3.1 70B Versatile' },
                { id: 'gemini', name: 'Google Gemini', model: 'Gemini 1.5 Flash / Pro' },
                { id: 'openai', name: 'OpenAI', model: 'GPT-4o Mini / Turbo' },
              ].map((prov) => (
                <div
                  key={prov.id}
                  onClick={() => setAiProvider(prov.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === prov.id
                      ? 'bg-purple-950/30 border-purple-500 shadow-glass text-white'
                      : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-sm">{prov.name}</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">{prov.model}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Alert Thresholds */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Live Telemetry Alert Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="text-gray-300 block mb-1">
                CPU Alert Trigger: <span className="font-mono text-cyan-400">{cpuThreshold}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="99"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">
                RAM Alert Trigger: <span className="font-mono text-purple-400">{ramThreshold}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="99"
                value={ramThreshold}
                onChange={(e) => setRamThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">
                Disk Alert Trigger: <span className="font-mono text-emerald-400">{diskThreshold}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="99"
                value={diskThreshold}
                onChange={(e) => setDiskThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <Button type="submit" variant="gradient" size="md" icon={Save} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
