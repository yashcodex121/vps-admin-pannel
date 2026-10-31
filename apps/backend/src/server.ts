import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { connectDB } from './config/db';
import { agentGateway } from './services/agentGateway';

// Import Routes
import authRoutes from './routes/auth.routes';
import serversRoutes from './routes/servers.routes';
import dashboardRoutes from './routes/dashboard.routes';
import servicesRoutes from './routes/services.routes';
import aiRoutes from './routes/ai.routes';
import deploymentsRoutes from './routes/deployments.routes';
import integrationsRoutes from './routes/integrations.routes';
import dockerRoutes from './routes/docker.routes';
import filesRoutes from './routes/files.routes';
import terminalRoutes from './routes/terminal.routes';
import monitoringRoutes from './routes/monitoring.routes';
import backupsRoutes from './routes/backups.routes';
import securityRoutes from './routes/security.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with broad CORS for frontend and VPS agents
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Pass Socket.IO instance to AgentGateway
agentGateway.initialize(io);

// Security & Standard Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'nexus-ai-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dynamic Agent One-Liner Install Script Endpoint
app.get('/install-agent.sh', (req: Request, res: Response) => {
  const backendHost = `${req.protocol}://${req.get('host')}`;
  const scriptContent = `#!/usr/bin/env bash
# ==========================================================
# NEXUS AI — VPS TELEMETRY & MANAGEMENT AGENT INSTALLER
# ==========================================================
set -e

echo "🚀 Installing NEXUS AI VPS Agent..."

BACKEND_URL="${backendHost}"
SERVER_ID=""
AGENT_TOKEN=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --backend) BACKEND_URL="$2"; shift ;;
    --server) SERVER_ID="$2"; shift ;;
    --token) AGENT_TOKEN="$2"; shift ;;
  esac
  shift
done

if [ -z "$SERVER_ID" ] || [ -z "$AGENT_TOKEN" ]; then
  echo "❌ Error: --server and --token arguments are required!"
  exit 1
fi

echo "🔹 Configuring Agent for Server: $SERVER_ID"
echo "🔹 Target Backend: $BACKEND_URL"

mkdir -p /opt/nexus-agent
cat << 'EOF' > /etc/systemd/system/nexus-agent.service
[Unit]
Description=NEXUS AI VPS Agent Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nexus-agent
Environment=NEXUS_BACKEND_URL=$BACKEND_URL
Environment=NEXUS_SERVER_ID=$SERVER_ID
Environment=NEXUS_AGENT_TOKEN=$AGENT_TOKEN
ExecStart=/usr/bin/node /opt/nexus-agent/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "✅ NEXUS Agent installed and registered successfully."
`;
  res.setHeader('Content-Type', 'text/x-shellscript');
  res.send(scriptContent);
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serversRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bots', servicesRoutes); // Bots share unified service manager endpoints
app.use('/api/ai', aiRoutes);
app.use('/api/deployments', deploymentsRoutes);
app.use('/api', integrationsRoutes); // /api/github, /api/vercel, /api/heroku
app.use('/api/docker', dockerRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/logs', monitoringRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
async function start() {
  await connectDB();
  server.listen(config.port, () => {
    console.log(`
==================================================
  NEXUS AI — Cloud & VPS Orchestration Backend
  Port: ${config.port}
  Environment: ${config.nodeEnv}
  AI Provider: ${config.defaultAiProvider}
  Live WebSocket: Ready
==================================================
    `);
  });
}

start();

export { app, server, io };
