import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { store } from '../services/store.service';
import { deployRepoSchema } from '@nexus/shared';
import { agentGateway } from '../services/agentGateway';
import { IDeployment, IDeploymentLog } from '@nexus/types';
import crypto from 'crypto';

const router = Router();

// GET /api/deployments - List deployments
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const deployments = Array.from(store.deployments.values()).reverse();
  return res.json({ success: true, data: deployments });
});

// GET /api/deployments/:id - Deployment detail with logs
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const deployment = store.deployments.get(req.params.id);
  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' });
  }

  return res.json({ success: true, data: deployment });
});

// POST /api/deployments - Trigger new deployment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = deployRepoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { projectName, target, serverId, repositoryUrl, branch, buildCommand, startCommand, port, envVars } = parsed.data;
    const deploymentId = `dep_${crypto.randomBytes(6).toString('hex')}`;

    const server = serverId ? store.servers.get(serverId) : Array.from(store.servers.values())[0];
    const serverName = server?.name || 'Ubuntu VPS Production';

    const initialLogs: IDeploymentLog[] = [
      { timestamp: new Date().toISOString(), stage: 'queued', message: `Deployment pipeline initiated for [${projectName}]`, level: 'info' },
      { timestamp: new Date().toISOString(), stage: 'cloning', message: `Target environment: ${target.toUpperCase()} (${serverName})`, level: 'info' },
      { timestamp: new Date().toISOString(), stage: 'cloning', message: `Cloning branch "${branch}" from ${repositoryUrl}...`, level: 'info' },
    ];

    const newDeployment: IDeployment = {
      _id: deploymentId,
      userId: req.userId || 'admin',
      projectName,
      target,
      serverId: server?._id,
      serverName,
      repositoryUrl,
      branch,
      commitHash: crypto.randomBytes(4).toString('hex'),
      commitMessage: `Deploy updates to ${branch}`,
      stage: 'cloning',
      logs: initialLogs,
      envVars: envVars || {},
      startedAt: new Date().toISOString(),
    };

    store.deployments.set(deploymentId, newDeployment);

    // Broadcast new deployment started
    agentGateway.broadcastToFrontend('deployment:started', newDeployment);

    // Asynchronously run deployment pipeline steps and stream via Socket.IO
    runDeploymentSimulation(deploymentId, projectName, target, buildCommand || 'npm run build', startCommand || 'npm start');

    return res.status(201).json({
      success: true,
      data: newDeployment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deployments/:id/rollback - Rollback deployment
router.post('/:id/rollback', authenticate, (req: AuthRequest, res: Response) => {
  const deployment = store.deployments.get(req.params.id);
  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' });
  }

  deployment.stage = 'rolled_back';
  deployment.logs.push({
    timestamp: new Date().toISOString(),
    stage: 'rolled_back',
    message: `[ROLLBACK] Reverted server state to previous stable build snapshot.`,
    level: 'warn',
  });
  store.deployments.set(deployment._id, deployment);

  agentGateway.broadcastToFrontend('deployment:updated', deployment);

  return res.json({ success: true, message: 'Rollback initiated successfully', data: deployment });
});

// GET /api/deployments/:id/ai-diagnose - AI error analysis for failed deployments
router.get('/:id/ai-diagnose', authenticate, (req: AuthRequest, res: Response) => {
  const deployment = store.deployments.get(req.params.id);
  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' });
  }

  const diagnosis = {
    deploymentId: deployment._id,
    projectName: deployment.projectName,
    analysis: `### 🔍 NEXUS AI Build Diagnostics\n\n` +
      `- **Target**: \`${deployment.target}\`\n` +
      `- **Branch**: \`${deployment.branch}\`\n` +
      `- **Status**: \`${deployment.stage.toUpperCase()}\`\n\n` +
      `**Observation**:\n` +
      `Dependencies were resolved. Port bindings and environment variables match requirements. If your application relies on MongoDB Atlas or Redis, ensure the IP whitelist includes \`${deployment.serverName}\`.\n\n` +
      `**Suggested Action**: Keep automatic restart policy active in PM2 with \`--max-memory-restart 500M\`.`,
  };

  return res.json({ success: true, data: diagnosis });
});

/**
 * Executes a simulated pipeline with live log streaming.
 */
function runDeploymentSimulation(deploymentId: string, projectName: string, target: string, buildCmd: string, startCmd: string) {
  const stages: { stage: any; message: string; delay: number; level: 'info' | 'warn' | 'error' }[] = [
    { stage: 'cloning', message: 'Repository cloned successfully. 142 objects unpacked.', delay: 1200, level: 'info' },
    { stage: 'installing', message: 'Resolving dependencies (npm ci --prefer-offline)...', delay: 2000, level: 'info' },
    { stage: 'installing', message: 'Added 482 packages in 3.4s. Audit passed with 0 vulnerabilities.', delay: 3500, level: 'info' },
    { stage: 'building', message: `Executing build step: "${buildCmd}"...`, delay: 5000, level: 'info' },
    { stage: 'building', message: 'Compiling TypeScript and bundling optimized production artifacts...', delay: 7000, level: 'info' },
    { stage: 'building', message: 'Build completed successfully. Artifact size: 48.6 MB.', delay: 8500, level: 'info' },
    { stage: 'deploying', message: `Configuring process supervisor and reverse proxy for ${target.toUpperCase()}...`, delay: 10000, level: 'info' },
    { stage: 'verifying', message: 'Executing zero-downtime health check on http://127.0.0.1:3000/health...', delay: 11500, level: 'info' },
    { stage: 'live', message: `🚀 Application [${projectName}] is LIVE and healthy!`, delay: 13000, level: 'info' },
  ];

  stages.forEach(item => {
    setTimeout(() => {
      const dep = store.deployments.get(deploymentId);
      if (!dep || dep.stage === 'cancelled' || dep.stage === 'failed') return;

      dep.stage = item.stage;
      dep.logs.push({
        timestamp: new Date().toISOString(),
        stage: item.stage,
        message: item.message,
        level: item.level,
      });

      if (item.stage === 'live') {
        dep.completedAt = new Date().toISOString();
        dep.durationSeconds = 13;
      }

      store.deployments.set(deploymentId, dep);

      agentGateway.broadcastToFrontend(`deployment:log:${deploymentId}`, {
        deploymentId,
        stage: item.stage,
        message: item.message,
        level: item.level,
      });

      agentGateway.broadcastToFrontend('deployment:updated', dep);
    }, item.delay);
  });
}

export default router;
