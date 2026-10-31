import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus_ai',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'nexus_super_secret_jwt_access_token_key_change_in_production_32chars',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'nexus_super_secret_jwt_refresh_token_key_change_in_production_32chars',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  
  // AI Keys
  groqApiKey: process.env.GROQ_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER as 'groq' | 'gemini' | 'openai') || 'groq',

  // Cloud Integrations
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  vercelClientId: process.env.VERCEL_CLIENT_ID || '',
  vercelClientSecret: process.env.VERCEL_CLIENT_SECRET || '',
  herokuClientId: process.env.HEROKU_CLIENT_ID || '',
  herokuClientSecret: process.env.HEROKU_CLIENT_SECRET || '',
};
