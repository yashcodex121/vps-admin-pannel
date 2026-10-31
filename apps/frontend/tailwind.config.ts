import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: '#111827',
        'surface-card': 'rgba(17, 24, 39, 0.7)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        nexus: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          violet: '#a855f7',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'nexus-glow': 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15), transparent 70%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px -5px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
