'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IUser } from '@nexus/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: IUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local token on mount
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      // Auto-set default admin user for instant sandbox/preview accessibility
      setUser({
        _id: 'usr_admin_nexus_01',
        name: 'Nexus Admin',
        email: 'admin@nexus.ai',
        role: 'admin',
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    api.get<{ user: IUser }>('/auth/me').then(res => {
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('nexus_access_token');
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      localStorage.setItem('nexus_access_token', res.data.tokens.accessToken);
      localStorage.setItem('nexus_refresh_token', res.data.tokens.refreshToken);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
