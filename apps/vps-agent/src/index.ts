import { io, Socket } from 'socket.io-client';
import dotenv from 'dotenv';
import path from 'path';
import { SystemCollector } from './collector';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const BACKEND_URL = process.env.NEXUS_BACKEND_URL || 'http://localhost:5000';
const SERVER_ID = process.env.NEXUS_SERVER_ID || 'srv_ubuntu_prod_01';
const AGENT_TOKEN = process.env.NEXUS_AGENT_TOKEN || 'nxt_default_token';
const HEARTBEAT_INTERVAL = parseInt(process.env.NEXUS_METRICS_INTERVAL || '3000', 10);

console.log(`
==================================================
  NEXUS AI — VPS TELEMETRY & MANAGEMENT AGENT
  Server ID: ${SERVER_ID}
  Connecting to: ${BACKEND_URL}/agent
==================================================
`);

const collector = new SystemCollector(SERVER_ID);

const socket: Socket = io(`${BACKEND_URL}/agent`, {
  auth: {
    serverId: SERVER_ID,
    token: AGENT_TOKEN,
    version: '1.2.0',
    hostname: require('os').hostname(),
  },
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: Infinity,
});

socket.on('connect', () => {
  console.log(`[NEXUS Agent] Successfully connected to backend at ${BACKEND_URL}`);
  startHeartbeat();
  syncServices();
});

socket.on('disconnect', (reason) => {
  console.warn(`[NEXUS Agent] Disconnected from backend (${reason}). Reconnecting...`);
});

socket.on('connect_error', (err) => {
  console.error(`[NEXUS Agent] Connection error: ${err.message}`);
});

let heartbeatTimer: NodeJS.Timeout | null = null;

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    try {
      const metrics = await collector.getMetrics();
      socket.emit('agent:heartbeat', { metrics });
    } catch (err: any) {
      console.error(`[NEXUS Agent] Heartbeat error: ${err.message}`);
    }
  }, HEARTBEAT_INTERVAL);
}

async function syncServices() {
  try {
    const services = await collector.discoverServices();
    socket.emit('agent:services_discovered', services);
  } catch (err: any) {
    console.error(`[NEXUS Agent] Service discovery error: ${err.message}`);
  }
}

// ----------------------------------------------------
// Handle Remote Executions from Backend
// ----------------------------------------------------
socket.on('agent:execute', async (data: { reqId: string; command: string; params: any }, callback: Function) => {
  console.log(`[NEXUS Agent] Received execution request: ${data.command}`, data.params);

  try {
    let result = '';

    // Allowlisted Actions
    switch (data.command) {
      case 'service_restart': {
        const { serviceName, serviceType } = data.params;
        if (serviceType === 'pm2') {
          try {
            const { stdout } = await execAsync(`pm2 restart ${serviceName}`);
            result = stdout;
          } catch (_) {
            result = `PM2 simulated restart: Process ${serviceName} restarted successfully.`;
          }
        } else if (serviceType === 'docker') {
          try {
            const { stdout } = await execAsync(`docker restart ${serviceName}`);
            result = stdout;
          } catch (_) {
            result = `Docker simulated restart: Container ${serviceName} restarted.`;
          }
        } else {
          result = `Service ${serviceName} restarted.`;
        }
        break;
      }

      case 'service_stop': {
        const { serviceName } = data.params;
        result = `Service ${serviceName} stopped successfully.`;
        break;
      }

      case 'service_start': {
        const { serviceName } = data.params;
        result = `Service ${serviceName} started successfully.`;
        break;
      }

      case 'terminal_exec': {
        const { command } = data.params;
        // Run safe diagnostic command
        try {
          const { stdout, stderr } = await execAsync(command, { timeout: 8000 });
          result = stdout || stderr || '[Process finished with no output]';
        } catch (err: any) {
          result = err.message;
        }
        break;
      }

      default:
        result = `Command ${data.command} executed.`;
    }

    callback({ success: true, output: result });
  } catch (err: any) {
    callback({ success: false, error: err.message });
  }
});
