'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  className?: string;
  glow?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  className,
  glow = false,
  children,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-xl border border-white/[0.08] bg-[#111827]/70 backdrop-blur-md p-6 text-gray-100 shadow-glass transition-all duration-200',
        glow && 'hover:border-cyan-500/40 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
