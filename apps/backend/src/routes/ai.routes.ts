import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import { aiChatSchema, confirmAiActionSchema } from '@nexus/shared';
import { config } from '../config';

const router = Router();

// POST /api/ai/chat - Process conversational natural language commands
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = aiChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { message, provider, targetServerId } = parsed.data;

    const result = await aiService.processMessage({
      message,
      provider,
      targetServerId,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/confirm - Confirm an AI requested DevOps action
router.post('/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = confirmAiActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { actionId, confirmed } = parsed.data;

    if (!confirmed) {
      return res.json({
        success: true,
        data: {
          reply: 'Action cancelled by user.',
          actionResult: {
            actionId,
            success: false,
            message: 'Action rejected by user',
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    const result = await aiService.executeConfirmedAction(actionId);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/providers - List configured AI provider status
router.get('/providers', authenticate, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      defaultProvider: config.defaultAiProvider,
      providers: [
        { id: 'groq', name: 'Groq (Llama 3.1 70B)', configured: !!config.groqApiKey },
        { id: 'gemini', name: 'Google Gemini 1.5 / 2.0', configured: !!config.geminiApiKey },
        { id: 'openai', name: 'OpenAI (GPT-4o)', configured: !!config.openaiApiKey },
      ],
    },
  });
});

export default router;
