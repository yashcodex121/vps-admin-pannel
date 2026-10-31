import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorToken: z.string().optional(),
});

export const connectServerSchema = z.object({
  name: z.string().min(2, 'Server name must be at least 2 characters').max(60),
  ip: z.string().min(3, 'IP or Hostname is required'),
  port: z.number().int().min(1).max(65535).default(22),
  sshUser: z.string().min(1, 'SSH user is required').default('root'),
  authMethod: z.enum(['ssh_key', 'ssh_password', 'agent_token']),
  privateKey: z.string().optional(),
  password: z.string().optional(),
  agentToken: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const serviceActionSchema = z.object({
  serviceId: z.string(),
  action: z.enum(['start', 'stop', 'restart', 'logs']),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional(),
  provider: z.enum(['groq', 'gemini', 'openai']).optional(),
  targetServerId: z.string().optional(),
});

export const confirmAiActionSchema = z.object({
  actionId: z.string(),
  confirmed: z.boolean(),
});

export const deployRepoSchema = z.object({
  projectName: z.string().min(2),
  target: z.enum(['vps', 'vercel', 'heroku']),
  serverId: z.string().optional(),
  repositoryUrl: z.string().url(),
  branch: z.string().default('main'),
  buildCommand: z.string().optional(),
  startCommand: z.string().optional(),
  port: z.number().optional(),
  envVars: z.record(z.string()).optional(),
});

export const terminalExecSchema = z.object({
  serverId: z.string(),
  command: z.string().min(1),
  workingDir: z.string().optional(),
});

export const fileOpSchema = z.object({
  serverId: z.string(),
  path: z.string().min(1),
  content: z.string().optional(),
  action: z.enum(['read', 'write', 'delete', 'list', 'create_dir']),
});
