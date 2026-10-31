import {
  IUser,
  IServer,
  IService,
  IDeployment,
  IServerMetrics,
  ISystemAlert,
  IAuditLog,
  IBackup,
  IDockerContainer,
  IDockerImage
} from '@nexus/types';
import crypto from 'crypto';

class NexusDataStore {
  public users: Map<string, IUser & { passwordHash: string; twoFactorSecret?: string }> = new Map();
  public sessions: Map<string, any> = new Map();
  public servers: Map<string, IServer & { encryptedPrivateKey?: string; encryptedPassword?: string }> = new Map();
  public services: Map<string, IService> = new Map();
  public deployments: Map<string, IDeployment> = new Map();
  public metrics: Map<string, IServerMetrics[]> = new Map(); // serverId -> history
  public alerts: Map<string, ISystemAlert> = new Map();
  public auditLogs: IAuditLog[] = [];
  public backups: Map<string, IBackup> = new Map();
  public integrations: Map<string, any> = new Map();
  public dockerContainers: Map<string, IDockerContainer[]> = new Map(); // serverId -> containers
  public dockerImages: Map<string, IDockerImage[]> = new Map(); // serverId -> images

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed default admin user (Password: Admin@Nexus2026)
    // bcrypt hash of 'Admin@Nexus2026'
    const adminId = 'usr_admin_nexus_01';
    this.users.set(adminId, {
      _id: adminId,
      name: 'Nexus Admin',
      email: 'admin@nexus.ai',
      role: 'admin',
      twoFactorEnabled: false,
      passwordHash: '$2a$10$wT5gWn8hY5LzQxKxYg0JleP20W1hV7.mH.9U0qV1gU2.v4T6j3.8u', // fallback or handled by auth service
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed a sample connected server for instant preview if desired
    const server1Id = 'srv_ubuntu_prod_01';
    this.servers.set(server1Id, {
      _id: server1Id,
      userId: adminId,
      name: 'Nexus-Primary-Ubuntu-VPS',
      ip: '194.164.72.105',
      port: 22,
      sshUser: 'root',
      authMethod: 'agent_token',
      status: 'online',
      agentConnected: true,
      agentVersion: '1.2.0',
      lastHeartbeat: new Date().toISOString(),
      specs: {
        os: 'Ubuntu 24.04 LTS',
        platform: 'linux',
        arch: 'x64',
        cpuModel: 'AMD EPYC 7702P 2.0GHz',
        cpuCores: 4,
        totalRamBytes: 8 * 1024 * 1024 * 1024, // 8 GB
        totalDiskBytes: 160 * 1024 * 1024 * 1024, // 160 GB
        uptimeSeconds: 846200,
        hostname: 'vps-srv-lon-01'
      },
      tags: ['production', 'telegram-bots', 'api'],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed services running on this server
    const srv1 = 'svc_quiz_bot_01';
    this.services.set(srv1, {
      _id: srv1,
      serverId: server1Id,
      serverName: 'Nexus-Primary-Ubuntu-VPS',
      name: 'quiz-bot',
      displayName: 'Quiz Telegram Bot',
      category: 'telegram_bot',
      type: 'pm2',
      status: 'running',
      pid: 14205,
      cpuPercent: 1.8,
      memoryBytes: 184 * 1024 * 1024,
      uptimeSeconds: 345600,
      command: 'python3 -m bot.main',
      workingDir: '/home/deploy/quiz-bot',
      restartsCount: 0,
      port: 8080,
      isBot: true,
      botPlatform: 'telegram',
      lastLogSnippet: '[INFO] Bot initialized. Listening for Telegram webhook updates on /webhook',
      updatedAt: new Date().toISOString(),
    });

    const srv2 = 'svc_fastapi_backend_02';
    this.services.set(srv2, {
      _id: srv2,
      serverId: server1Id,
      serverName: 'Nexus-Primary-Ubuntu-VPS',
      name: 'api-gateway',
      displayName: 'Core API Gateway',
      category: 'api_service',
      type: 'pm2',
      status: 'running',
      pid: 18921,
      cpuPercent: 4.2,
      memoryBytes: 320 * 1024 * 1024,
      uptimeSeconds: 520000,
      command: 'node dist/index.js',
      workingDir: '/home/deploy/api-gateway',
      restartsCount: 1,
      port: 3000,
      isBot: false,
      lastLogSnippet: '[Gateway] GET /api/v1/health 200 OK - 2.4ms',
      updatedAt: new Date().toISOString(),
    });

    const srv3 = 'svc_web_frontend_03';
    this.services.set(srv3, {
      _id: srv3,
      serverId: server1Id,
      serverName: 'Nexus-Primary-Ubuntu-VPS',
      name: 'landing-site',
      displayName: 'Nexus Web App',
      category: 'web_app',
      type: 'docker',
      status: 'running',
      pid: 24500,
      cpuPercent: 0.9,
      memoryBytes: 210 * 1024 * 1024,
      uptimeSeconds: 846200,
      port: 80,
      isBot: false,
      lastLogSnippet: 'nginx worker process started (pid 24501)',
      updatedAt: new Date().toISOString(),
    });

    // Seed Docker containers
    this.dockerContainers.set(server1Id, [
      {
        id: 'c7d9a10f8231',
        serverId: server1Id,
        name: 'redis-cache-prod',
        image: 'redis:7-alpine',
        status: 'Up 10 days',
        state: 'running',
        created: '2026-10-15T10:00:00Z',
        ports: ['6379:6379'],
        cpuPercent: 0.4,
        memoryUsage: '34.2 MB / 8 GB',
        uptime: '10d 4h'
      },
      {
        id: 'f4b1e920c812',
        serverId: server1Id,
        name: 'nexus-nginx-proxy',
        image: 'nginx:alpine-slim',
        status: 'Up 12 days',
        state: 'running',
        created: '2026-10-12T14:20:00Z',
        ports: ['80:80', '443:443'],
        cpuPercent: 0.6,
        memoryUsage: '18.5 MB / 8 GB',
        uptime: '12d 6h'
      }
    ]);

    // Seed initial monitoring metrics for server
    const initialMetrics: IServerMetrics[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 60000).toISOString();
      initialMetrics.push({
        serverId: server1Id,
        timestamp: t,
        cpuUsagePercent: Math.round(15 + Math.sin(i / 2) * 8 + Math.random() * 5),
        memoryUsedBytes: (3.2 + Math.random() * 0.2) * 1024 * 1024 * 1024,
        memoryTotalBytes: 8 * 1024 * 1024 * 1024,
        memoryPercent: Math.round(41 + Math.random() * 2),
        diskUsedBytes: 52 * 1024 * 1024 * 1024,
        diskTotalBytes: 160 * 1024 * 1024 * 1024,
        diskPercent: 32.5,
        networkRxBytesSec: Math.round(450000 + Math.random() * 120000),
        networkTxBytesSec: Math.round(680000 + Math.random() * 240000),
        loadAverage: [0.65, 0.58, 0.49],
        uptimeSeconds: 846200 - i * 60,
        processCount: 118
      });
    }
    this.metrics.set(server1Id, initialMetrics);

    // Seed sample alert
    const alertId = 'alt_high_cpu_01';
    this.alerts.set(alertId, {
      _id: alertId,
      serverId: server1Id,
      serverName: 'Nexus-Primary-Ubuntu-VPS',
      severity: 'info',
      title: 'Agent Synchronized',
      message: 'Nexus VPS Agent v1.2.0 successfully connected and streaming telemetry.',
      acknowledged: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // Seed audit log
    this.auditLogs.push({
      _id: 'aud_seed_01',
      userId: adminId,
      userName: 'Nexus Admin',
      action: 'SERVER_CONNECTED',
      resourceType: 'server',
      resourceId: server1Id,
      ipAddress: '127.0.0.1',
      status: 'success',
      details: { serverName: 'Nexus-Primary-Ubuntu-VPS' },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    });
  }

  public addAuditLog(entry: Omit<IAuditLog, '_id' | 'createdAt'>): IAuditLog {
    const log: IAuditLog = {
      _id: `aud_${crypto.randomBytes(6).toString('hex')}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }
}

export const store = new NexusDataStore();
