export const SYSTEM_CONSTANTS = {
  DEFAULT_SSH_PORT: 22,
  MAX_TERMINAL_HISTORY: 500,
  DEFAULT_HEARTBEAT_INTERVAL_MS: 3000,
  MAX_FILE_READ_BYTES: 1024 * 1024 * 5, // 5MB limit
  ALLOWED_AGENT_COMMANDS: [
    'systemctl',
    'pm2',
    'docker',
    'uptime',
    'uname',
    'df',
    'free',
    'ps',
    'netstat',
    'ss',
    'git',
    'npm',
    'pnpm',
    'node',
    'python3',
    'cat',
    'tail',
    'head',
    'ls'
  ],
  BLOCKED_COMMANDS: [
    'rm -rf /',
    'rm -rf /*',
    ':(){ :|:& };:',
    'mkfs',
    'dd if=/dev/zero',
    'chmod -R 777 /',
    '> /dev/sda'
  ]
};

export const API_ROUTES = {
  AUTH: '/api/auth',
  SERVERS: '/api/servers',
  AGENT: '/api/agent',
  DASHBOARD: '/api/dashboard',
  SERVICES: '/api/services',
  BOTS: '/api/bots',
  AI: '/api/ai',
  DEPLOYMENTS: '/api/deployments',
  GITHUB: '/api/github',
  VERCEL: '/api/vercel',
  HEROKU: '/api/heroku',
  DOCKER: '/api/docker',
  FILES: '/api/files',
  TERMINAL: '/api/terminal',
  MONITORING: '/api/monitoring',
  LOGS: '/api/logs',
  BACKUPS: '/api/backups',
  SECURITY: '/api/security',
  SETTINGS: '/api/settings',
};
