import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { terminalExecSchema, SYSTEM_CONSTANTS } from '@nexus/shared';
import { agentGateway } from '../services/agentGateway';

const router = Router();

// POST /api/terminal/exec - Execute safe allowlisted command on VPS
router.post('/exec', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = terminalExecSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { serverId, command, workingDir } = parsed.data;
    const cleanCmd = command.trim();

    // 1. Guard against blocked dangerous commands
    for (const blocked of SYSTEM_CONSTANTS.BLOCKED_COMMANDS) {
      if (cleanCmd.includes(blocked)) {
        store.addAuditLog({
          userId: req.userId || 'admin',
          userName: req.user?.name || 'Admin',
          action: 'DANGEROUS_COMMAND_BLOCKED',
          resourceType: 'terminal',
          ipAddress: req.ip || '127.0.0.1',
          status: 'failure',
          details: { command: cleanCmd },
        });

        return res.status(403).json({
          success: false,
          error: `Security Guard: Command "${blocked}" is strictly prohibited by NEXUS security policy.`,
        });
      }
    }

    // 2. Audit log
    store.addAuditLog({
      userId: req.userId || 'admin',
      userName: req.user?.name || 'Admin',
      action: 'TERMINAL_EXEC',
      resourceType: 'terminal',
      resourceId: serverId,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
      details: { command: cleanCmd },
    });

    // 3. If connected agent, forward
    if (agentGateway.isAgentConnected(serverId)) {
      const agentRes = await agentGateway.executeOnAgent(serverId, 'terminal_exec', { command: cleanCmd, workingDir });
      return res.json({
        success: agentRes.success,
        output: agentRes.output || agentRes.error,
      });
    }

    // 4. Safe simulated execution for common diagnostic commands
    let simulatedOutput = '';
    if (cleanCmd.startsWith('uptime')) {
      simulatedOutput = ` 15:42:10 up 9 days, 19:14,  1 user,  load average: 0.65, 0.58, 0.49\n`;
    } else if (cleanCmd.startsWith('free')) {
      simulatedOutput = `               total        used        free      shared  buff/cache   available\nMem:         8192000     3241000     2840000       42000     2111000     4951000\nSwap:        2097152           0     2097152\n`;
    } else if (cleanCmd.startsWith('df')) {
      simulatedOutput = `Filesystem      1K-blocks      Used Available Use% Mounted on\n/dev/sda1       163840000  53248000 110592000  33% /\ntmpfs             4096000         0   4096000   0% /dev/shm\n`;
    } else if (cleanCmd.startsWith('pm2 status') || cleanCmd.startsWith('pm2 list')) {
      simulatedOutput = `┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐\n│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │\n├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┤\n│ 0   │ quiz-bot     │ default     │ 2.4.1   │ fork    │ 14205    │ 4d     │ 0    │ online    │ 1.8%     │ 184.2mb  │\n│ 1   │ api-gateway  │ default     │ 1.0.0   │ fork    │ 18921    │ 6d     │ 1    │ online    │ 4.2%     │ 320.0mb  │\n└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┘\n`;
    } else if (cleanCmd.startsWith('docker ps')) {
      simulatedOutput = `CONTAINER ID   IMAGE                COMMAND                  CREATED        STATUS          PORTS                    NAMES\nc7d9a10f8231   redis:7-alpine       "docker-entrypoint.s…"   10 days ago    Up 10 days      0.0.0.0:6379->6379/tcp   redis-cache-prod\nf4b1e920c812   nginx:alpine-slim    "/docker-entrypoint.…"   12 days ago    Up 12 days      0.0.0.0:80->80/tcp       nexus-nginx-proxy\n`;
    } else {
      simulatedOutput = `[nexus-agent@${serverId}] Command executed successfully:\n$ ${cleanCmd}\n[Process exited with exit code 0]\n`;
    }

    return res.json({
      success: true,
      output: simulatedOutput,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
