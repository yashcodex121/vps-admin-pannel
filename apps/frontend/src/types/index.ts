// ========================================================
// NEXUS AI — FRONTEND TYPES & INTERFACES (STANDALONE VERCEL READY)
// ========================================================

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ServerStatus = 'online' | 'offline' | 'connecting' | 'warning' | 'error';
export type AuthMethod = 'ssh_key' | 'ssh_password' | 'agent_token';

export interface IServerSpecs {
  os: string;
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalRamBytes: number;
  totalDiskBytes: number;
  uptimeSeconds: number;
  hostname: string;
}

export interface IServer {
  _id: string;
  userId: string;
  name: string;
  ip: string;
  port: number;
  sshUser: string;
  authMethod: AuthMethod;
  status: ServerStatus;
  specs?: IServerSpecs;
  agentToken?: string;
  agentConnected: boolean;
  agentVersion?: string;
  lastHeartbeat?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IServerMetrics {
  serverId: string;
  timestamp: string;
  cpuUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  memoryPercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  diskPercent: number;
  networkRxBytesSec: number;
  networkTxBytesSec: number;
  loadAverage: [number, number, number];
  uptimeSeconds: number;
  processCount: number;
}

export interface ISystemAlert {
  _id: string;
  serverId?: string;
  serverName?: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

export type ServiceType = 'pm2' | 'systemd' | 'docker' | 'bot' | 'api' | 'web' | 'custom';
export type ServiceStatus = 'running' | 'stopped' | 'failed' | 'restarting' | 'unknown';

export interface IService {
  _id: string;
  serverId: string;
  serverName?: string;
  name: string;
  displayName: string;
  category: 'telegram_bot' | 'api_service' | 'web_app' | 'database' | 'background_worker';
  type: ServiceType;
  status: ServiceStatus;
  pid?: number;
  cpuPercent?: number;
  memoryBytes?: number;
  uptimeSeconds?: number;
  command?: string;
  workingDir?: string;
  restartsCount?: number;
  port?: number;
  isBot?: boolean;
  botPlatform?: 'telegram' | 'discord' | 'custom';
  lastLogSnippet?: string;
  updatedAt: string;
}

export interface IDockerContainer {
  id: string;
  serverId: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting';
  created: string;
  ports: string[];
  cpuPercent?: number;
  memoryUsage?: string;
  uptime?: string;
}

export interface IDockerImage {
  id: string;
  serverId: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export type DeploymentTarget = 'vps' | 'vercel' | 'heroku';
export type DeploymentStage =
  | 'queued'
  | 'cloning'
  | 'installing'
  | 'building'
  | 'deploying'
  | 'verifying'
  | 'live'
  | 'failed'
  | 'cancelled'
  | 'rolled_back';

export interface IDeploymentLog {
  timestamp: string;
  stage: DeploymentStage;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface IDeployment {
  _id: string;
  userId: string;
  projectId?: string;
  projectName: string;
  target: DeploymentTarget;
  serverId?: string;
  serverName?: string;
  repositoryUrl?: string;
  branch: string;
  commitHash?: string;
  commitMessage?: string;
  stage: DeploymentStage;
  logs: IDeploymentLog[];
  envVars?: Record<string, string>;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  error?: string;
}

export interface IGitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  isPrivate: boolean;
  defaultBranch: string;
  starsCount: number;
  htmlUrl: string;
  language?: string;
  updatedAt: string;
}

export interface IVercelProject {
  id: string;
  name: string;
  framework?: string;
  latestDeploymentStatus?: string;
  domainUrl?: string;
  updatedAt: string;
}

export interface IHerokuApp {
  id: string;
  name: string;
  region: string;
  stack: string;
  webUrl: string;
  dynosRunning: number;
  updatedAt: string;
}

export type AiProvider = 'groq' | 'gemini' | 'openai';

export interface IAiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: any[];
  actionConfirmationRequired?: IAiActionRequest;
  actionResult?: IAiActionResult;
}

export interface IAiActionRequest {
  id: string;
  actionType: 'restart_service' | 'stop_service' | 'start_service' | 'deploy_project' | 'reboot_server' | 'purge_cache';
  targetServerId: string;
  targetServerName: string;
  targetServiceName?: string;
  reason: string;
  destructive: boolean;
}

export interface IAiActionResult {
  actionId: string;
  success: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface IFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
  permissions?: string;
  extension?: string;
}

export interface IBackup {
  _id: string;
  serverId: string;
  serverName: string;
  name: string;
  targetPath: string;
  backupFilePath: string;
  sizeBytes: number;
  status: 'completed' | 'in_progress' | 'failed';
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  createdAt: string;
}
