'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nexus.ai');
  const [password, setPassword] = useState('Admin@Nexus2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleUseDemo = () => {
    setEmail('admin@nexus.ai');
    setPassword('Admin@Nexus2026');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to NEXUS AI</h2>
          <p className="text-xs text-gray-400">Enterprise Cloud & VPS Infrastructure Control Center</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <Button type="submit" variant="gradient" size="md" className="w-full justify-center" loading={loading} icon={ArrowRight}>
            Authenticate Session
          </Button>
        </form>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-cyan-400 hover:underline text-[11px]"
          >
            Auto-fill Demo Credentials
          </button>
          <Link href="/register" className="text-gray-400 hover:text-white text-[11px]">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
