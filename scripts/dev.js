const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting NEXUS AI Platform (Backend + Frontend)...');

// 1. Start Backend on port 5000
const backend = spawn('node', ['apps/backend/dist/server.js'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, PORT: '5000' }
});

backend.on('error', (err) => {
  console.error('[Backend Process Error]:', err);
});

// 2. Start Frontend on port 3000
const frontend = spawn('npx', ['next', 'start', '-p', '3000'], {
  cwd: path.join(rootDir, 'apps/frontend'),
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, PORT: '3000' }
});

frontend.on('error', (err) => {
  console.error('[Frontend Process Error]:', err);
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
