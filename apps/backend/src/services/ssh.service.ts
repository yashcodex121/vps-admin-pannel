import { Client } from 'ssh2';
import { IServerSpecs } from '@nexus/types';
import { config } from '../config';

export interface SshConnectParams {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export class SshService {
  /**
   * Tests SSH connection and extracts server hardware specifications.
   */
  public async testAndProbeSpecs(params: SshConnectParams): Promise<{
    success: boolean;
    specs?: IServerSpecs;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const conn = new Client();
      let hasTimedOut = false;

      const timeout = setTimeout(() => {
        hasTimedOut = true;
        try { conn.end(); } catch (_) {}
        resolve({
          success: false,
          error: 'SSH connection timed out after 10000ms. Check IP, Port, and VPS firewall rules.',
        });
      }, 10000);

      conn.on('ready', () => {
        clearTimeout(timeout);
        if (hasTimedOut) return;

        // Run multi-command probe script
        const probeCmd = `
          echo "===HOSTNAME==="; hostname;
          echo "===UNAME==="; uname -a;
          echo "===OS==="; cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '"';
          echo "===CPU==="; lscpu | grep "Model name:" | sed 's/Model name:[ \t]*//';
          echo "===CORES==="; nproc;
          echo "===RAM==="; free -b | grep Mem: | awk '{print $2}';
          echo "===DISK==="; df -B1 / | tail -n1 | awk '{print $2}';
          echo "===UPTIME==="; cat /proc/uptime | awk '{print $1}';
        `;

        conn.exec(probeCmd, (err, stream) => {
          if (err) {
            conn.end();
            return resolve({
              success: true, // SSH succeeded but probe command had permission issue
              error: err.message,
            });
          }

          let output = '';
          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.on('close', () => {
            conn.end();
            const specs = this.parseProbeOutput(output);
            resolve({
              success: true,
              specs,
            });
          });
        });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!hasTimedOut) {
          resolve({
            success: false,
            error: `SSH Authentication failed: ${err.message}`,
          });
        }
      });

      try {
        const connectConfig: any = {
          host: params.host,
          port: params.port,
          username: params.username,
          readyTimeout: 8000,
        };

        if (params.privateKey) {
          connectConfig.privateKey = params.privateKey;
        } else if (params.password) {
          connectConfig.password = params.password;
        }

        conn.connect(connectConfig);
      } catch (err: any) {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `Invalid SSH parameters: ${err.message}`,
        });
      }
    });
  }

  private parseProbeOutput(output: string): IServerSpecs {
    const getSection = (marker: string): string => {
      const idx = output.indexOf(marker);
      if (idx === -1) return '';
      const start = idx + marker.length;
      const nextIdx = output.indexOf('===', start);
      const chunk = nextIdx === -1 ? output.substring(start) : output.substring(start, nextIdx);
      return chunk.trim();
    };

    const hostname = getSection('===HOSTNAME===') || 'vps-host';
    const os = getSection('===OS===') || 'Linux / Ubuntu';
    const cpuModel = getSection('===CPU===') || 'Standard Virtual CPU';
    const cores = parseInt(getSection('===CORES===') || '2', 10);
    const totalRam = parseInt(getSection('===RAM===') || '4294967296', 10);
    const totalDisk = parseInt(getSection('===DISK===') || '85899345920', 10);
    const uptime = parseFloat(getSection('===UPTIME===') || '3600');

    return {
      hostname,
      os,
      platform: 'linux',
      arch: 'x64',
      cpuModel,
      cpuCores: isNaN(cores) ? 2 : cores,
      totalRamBytes: isNaN(totalRam) ? 4 * 1024 * 1024 * 1024 : totalRam,
      totalDiskBytes: isNaN(totalDisk) ? 80 * 1024 * 1024 * 1024 : totalDisk,
      uptimeSeconds: isNaN(uptime) ? 3600 : Math.round(uptime),
    };
  }

  /**
   * Returns one-liner installation script for Ubuntu/Debian VPS.
   */
  public generateInstallScript(backendUrl: string, serverId: string, agentToken: string): string {
    return `curl -sSL ${backendUrl}/install-agent.sh | sudo bash -s -- --backend "${backendUrl}" --server "${serverId}" --token "${agentToken}"`;
  }
}

export const sshService = new SshService();
