import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'online' | 'offline' | 'warning' | 'purple' | 'cyan' | 'neutral';
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  pulse = false,
  className,
}) => {
  const styles = {
    online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    offline: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    neutral: 'bg-gray-800 text-gray-300 border-gray-700',
  };

  const dotStyles = {
    online: 'bg-emerald-400',
    offline: 'bg-rose-400',
    warning: 'bg-amber-400',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    neutral: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        styles[variant],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotStyles[variant]
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotStyles[variant])} />
      </span>
      {children}
    </span>
  );
};
