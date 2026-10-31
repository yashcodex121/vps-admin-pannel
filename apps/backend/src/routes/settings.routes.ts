import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// GET /api/settings - User and system settings
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      theme: 'dark',
      aiProvider: config.defaultAiProvider,
      notifications: {
        emailAlerts: true,
        cpuThresholdPercent: 90,
        ramThresholdPercent: 90,
        diskThresholdPercent: 85,
        serviceCrashAlerts: true,
      },
      keysConfigured: {
        groq: !!config.groqApiKey,
        gemini: !!config.geminiApiKey,
        openai: !!config.openaiApiKey,
        github: !!config.githubClientId,
        vercel: !!config.vercelClientId,
        heroku: !!config.herokuClientId,
      },
    },
  });
});

// PATCH /api/settings - Update settings
router.patch('/', authenticate, (req: AuthRequest, res: Response) => {
  const { aiProvider, defaultAiProvider } = req.body;
  if (aiProvider || defaultAiProvider) {
    config.defaultAiProvider = aiProvider || defaultAiProvider;
  }

  return res.json({
    success: true,
    message: 'Settings updated successfully',
    data: req.body,
  });
});

export default router;
