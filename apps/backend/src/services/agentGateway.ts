import { Server as SocketIOServer, Socket } from 'socket.io';
import { store } from './store.service';
import { IServerMetrics, IService } from '@nexus/types';

interface AgentSocketData {
  serverId: string;
  agentVersion: string;
  hostname: string;
}

export class AgentGateway {
  private io: SocketIOServer | null = null;
  private connectedAgents: Map<string, Socket> = new Map(); // serverId -> socket

  public initialize(io: SocketIOServer) {
    this.io = io;
    const agentNamespace = io.of('/agent');

    // Agent Authentication Middleware
    agentNamespace.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers['x-agent-token'];
      const serverId = socket.handshake.auth?.serverId || socket.handshake.headers['x-server-id'];

      if (!serverId) {
        return next(new Error('Authentication failed: Missing serverId'));
      }

      const server = store.servers.get(serverId as string);
      if (!server) {
        return next(new Error('Authentication failed: Server not registered'));
      }

      // Check agent token if configured
      if (server.agentToken && token !== server.agentToken) {
        return next(new Error('Authentication failed: Invalid agent token'));
      }

      socket.data = {
        serverId,
        agentVersion: socket.handshake.auth?.version || '1.0.0',
        hostname: socket.handshake.auth?.hostname || server.name,
      } as AgentSocketData;

      next();
    });

    agentNamespace.on('connection', (socket: Socket) => {
      const { serverId, agentVersion } = socket.data as AgentSocketData;
      console.log(`[AgentGateway] Agent connected for server: ${serverId} (v${agentVersion})`);

      this.connectedAgents.set(serverId, socket);

      // Update server status
      const server = store.servers.get(serverId);
      if (server) {
        server.status = 'online';
        server.agentConnected = true;
        server.agentVersion = agentVersion;
        server.lastHeartbeat = new Date().toISOString();
        store.servers.set(serverId, server);

        // Notify frontend dashboard
        this.broadcastToFrontend('server:status', { serverId, status: 'online', agentConnected: true });
      }

      // 1. Receive Telemetry Heartbeat from Agent
      socket.on('agent:heartbeat', (data: { metrics: IServerMetrics; services?: IService[] }) => {
        this.handleAgentHeartbeat(serverId, data);
      });

      // 2. Receive Service Discovered Updates
      socket.on('agent:services_discovered', (services: IService[]) => {
        this.handleServicesDiscovered(serverId, services);
      });

      // 3. Receive Terminal / Command Output Stream
      socket.on('agent:cmd_output', (data: { sessionId: string; output: string; isError?: boolean }) => {
        this.broadcastToFrontend(`terminal:stream:${data.sessionId}`, data);
      });

      // 4. Receive Deployment Step Output Stream
      socket.on('agent:deploy_log', (data: { deploymentId: string; stage: string; message: string; level: string }) => {
        this.handleDeploymentLog(data);
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        console.log(`[AgentGateway] Agent disconnected for server: ${serverId}. Reason: ${reason}`);
        this.connectedAgents.delete(serverId);

        const srv = store.servers.get(serverId);
        if (srv) {
          srv.status = 'offline';
          srv.agentConnected = false;
          store.servers.set(serverId, srv);
          this.broadcastToFrontend('server:status', { serverId, status: 'offline', agentConnected: false });
        }
      });
    });
  }

  private handleAgentHeartbeat(serverId: string, data: { metrics: IServerMetrics; services?: IService[] }) {
    const { metrics, services } = data;
    if (!metrics) return;

    // Update in-memory metrics window
    let history = store.metrics.get(serverId) || [];
    history.push(metrics);
    if (history.length > 60) {
      history = history.slice(-60); // keep last 60 data points (e.g. 3-5 mins of live graphs)
    }
    store.metrics.set(serverId, history);

    // Update server heartbeat timestamp
    const server = store.servers.get(serverId);
    if (server) {
      server.lastHeartbeat = metrics.timestamp || new Date().toISOString();
      server.status = 'online';
    }

    // Update services if reported
    if (services && Array.isArray(services)) {
      services.forEach((s) => {
        s.serverId = serverId;
        store.services.set(s._id, s);
      });
    }

    // Check system alert conditions
    if (metrics.cpuUsagePercent >= 92) {
      this.triggerAlert(serverId, 'warning', 'High CPU Utilization', `CPU usage peaked at ${metrics.cpuUsagePercent}%`);
    }
    if (metrics.memoryPercent >= 95) {
      this.triggerAlert(serverId, 'critical', 'Critical Memory Pressure', `RAM usage exceeded ${metrics.memoryPercent}%`);
    }
    if (metrics.diskPercent >= 90) {
      this.triggerAlert(serverId, 'critical', 'Disk Space Low', `Root disk is at ${metrics.diskPercent}% capacity`);
    }

    // Forward metrics in real-time to connected frontend dashboard clients
    this.broadcastToFrontend(`metrics:${serverId}`, metrics);
    this.broadcastToFrontend('metrics:summary', {
      serverId,
      cpu: metrics.cpuUsagePercent,
      ram: metrics.memoryPercent,
      disk: metrics.diskPercent,
    });
  }

  private handleServicesDiscovered(serverId: string, services: IService[]) {
    services.forEach((srv) => {
      srv.serverId = serverId;
      store.services.set(srv._id, srv);
    });
    this.broadcastToFrontend(`services:${serverId}`, services);
  }

  private handleDeploymentLog(data: { deploymentId: string; stage: any; message: string; level: any }) {
    const deployment = store.deployments.get(data.deploymentId);
    if (deployment) {
      deployment.logs.push({
        timestamp: new Date().toISOString(),
        stage: data.stage,
        message: data.message,
        level: data.level || 'info',
      });
      deployment.stage = data.stage;
      store.deployments.set(data.deploymentId, deployment);
    }
    this.broadcastToFrontend(`deployment:log:${data.deploymentId}`, data);
  }

  private triggerAlert(serverId: string, severity: 'info' | 'warning' | 'critical', title: string, message: string) {
    const server = store.servers.get(serverId);
    const alertId = `alt_${Date.now()}`;
    const alert = {
      _id: alertId,
      serverId,
      serverName: server?.name || 'VPS Server',
      severity,
      title,
      message,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };
    store.alerts.set(alertId, alert);
    this.broadcastToFrontend('alert:new', alert);
  }

  /**
   * Sends an allowlisted command execution request to the connected Agent.
   */
  public async executeOnAgent(serverId: string, command: string, params: Record<string, any> = {}): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    const socket = this.connectedAgents.get(serverId);
    if (!socket || !socket.connected) {
      return {
        success: false,
        error: `NEXUS Agent for server ${serverId} is currently offline. Ensure daemon is running.`,
      };
    }

    return new Promise((resolve) => {
      const reqId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Agent command execution timed out' });
      }, 15000);

      socket.emit('agent:execute', { reqId, command, params }, (res: any) => {
        clearTimeout(timeout);
        resolve(res);
      });
    });
  }

  public broadcastToFrontend(event: string, payload: any) {
    if (this.io) {
      this.io.emit(event, payload);
    }
  }

  public isAgentConnected(serverId: string): boolean {
    const socket = this.connectedAgents.get(serverId);
    return !!socket && socket.connected;
  }
}

export const agentGateway = new AgentGateway();
