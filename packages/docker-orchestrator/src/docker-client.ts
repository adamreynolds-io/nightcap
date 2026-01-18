/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import Docker from 'dockerode';
import type { ContainerStatus, DockerOperationResult } from './types.js';

/**
 * Docker client wrapper for Nightcap operations
 */
export class DockerClient {
  private docker: Docker;
  private _isAvailable: boolean | null = null;

  constructor(options?: Docker.DockerOptions) {
    this.docker = new Docker(options);
  }

  /**
   * Check if Docker is available and running
   */
  async isAvailable(): Promise<boolean> {
    if (this._isAvailable !== null) {
      return this._isAvailable;
    }

    try {
      await this.docker.ping();
      this._isAvailable = true;
      return true;
    } catch {
      this._isAvailable = false;
      return false;
    }
  }

  /**
   * Get Docker version information
   */
  async getVersion(): Promise<{ version: string; apiVersion: string } | null> {
    try {
      const info = await this.docker.version();
      return {
        version: info.Version,
        apiVersion: info.ApiVersion,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if an image exists locally
   */
  async imageExists(imageName: string): Promise<boolean> {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pull an image with progress callback
   */
  async pullImage(
    imageName: string,
    onProgress?: (status: string, progress?: { current: number; total: number }) => void
  ): Promise<DockerOperationResult> {
    try {
      const stream = await this.docker.pull(imageName);

      return new Promise((resolve) => {
        this.docker.modem.followProgress(
          stream,
          (err: Error | null) => {
            if (err) {
              resolve({ success: false, error: err.message });
            } else {
              resolve({ success: true });
            }
          },
          (event: { status?: string; progressDetail?: { current?: number; total?: number } }) => {
            if (onProgress && event.status) {
              const progress = event.progressDetail?.current && event.progressDetail?.total
                ? { current: event.progressDetail.current, total: event.progressDetail.total }
                : undefined;
              onProgress(event.status, progress);
            }
          }
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List containers matching a filter
   */
  async listContainers(
    filters?: { name?: string[]; label?: string[] }
  ): Promise<ContainerStatus[]> {
    try {
      // Build filters object only with defined values
      const filterObj: Record<string, string[]> = {};
      if (filters?.name) {
        filterObj['name'] = filters.name;
      }
      if (filters?.label) {
        filterObj['label'] = filters.label;
      }

      const containers = await this.docker.listContainers({
        all: true,
        filters: Object.keys(filterObj).length > 0 ? filterObj : undefined,
      });

      return containers.map((container: Docker.ContainerInfo) => ({
        name: container.Names[0]?.replace(/^\//, '') ?? 'unknown',
        id: container.Id,
        state: container.State as ContainerStatus['state'],
        image: container.Image,
        health: this.parseHealthStatus(container.Status),
        ports: container.Ports.map((port: Docker.Port) => ({
          container: port.PrivatePort,
          host: port.PublicPort ?? port.PrivatePort,
          protocol: (port.Type ?? 'tcp') as 'tcp' | 'udp',
        })),
        created: new Date(container.Created * 1000),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Start a container by name or ID
   */
  async startContainer(nameOrId: string): Promise<DockerOperationResult> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.start();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Stop a container by name or ID
   */
  async stopContainer(nameOrId: string, timeout = 10): Promise<DockerOperationResult> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.stop({ t: timeout });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove a container by name or ID
   */
  async removeContainer(
    nameOrId: string,
    options?: { force?: boolean; removeVolumes?: boolean }
  ): Promise<DockerOperationResult> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.remove({
        force: options?.force ?? false,
        v: options?.removeVolumes ?? false,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    nameOrId: string,
    options?: { tail?: number; since?: number }
  ): Promise<string> {
    try {
      const container = this.docker.getContainer(nameOrId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options?.tail ?? 100,
        since: options?.since ?? 0,
      });

      // The logs buffer contains multiplexed stdout/stderr
      // Strip the header bytes from each line
      return this.demuxLogs(logs);
    } catch {
      return '';
    }
  }

  /**
   * Parse health status from container status string
   */
  private parseHealthStatus(status: string): ContainerStatus['health'] {
    if (status.includes('(healthy)')) return 'healthy';
    if (status.includes('(unhealthy)')) return 'unhealthy';
    if (status.includes('(health: starting)')) return 'starting';
    return 'none';
  }

  /**
   * Demultiplex Docker logs (strip header bytes)
   */
  private demuxLogs(buffer: Buffer | string): string {
    if (typeof buffer === 'string') {
      return buffer;
    }

    const lines: string[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      // Each frame has an 8-byte header: [stream_type, 0, 0, 0, size_bytes...]
      if (offset + 8 > buffer.length) break;

      const size = buffer.readUInt32BE(offset + 4);
      offset += 8;

      if (offset + size > buffer.length) break;

      const line = buffer.subarray(offset, offset + size).toString('utf8');
      lines.push(line);
      offset += size;
    }

    return lines.join('');
  }
}
