'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Sparkles, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await api.post('/auth/register', { name, email, password });
    if (res.success && res.data) {
      localStorage.setItem('nexus_access_token', res.data.tokens.accessToken);
      localStorage.setItem('nexus_refresh_token', res.data.tokens.refreshToken);
      router.push('/');
    } else {
      setError(res.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create NEXUS Account</h2>
          <p className="text-xs text-gray-400">Register as System Operator or Team Administrator</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 block mb-1">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <Button type="submit" variant="gradient" size="md" className="w-full justify-center" loading={loading} icon={ArrowRight}>
            Register Operator
          </Button>
        </form>

        <div className="pt-2 border-t border-white/[0.08] text-center text-xs">
          <Link href="/login" className="text-cyan-400 hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
