/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DockerClient } from './docker-client.js';
import { ComposeGenerator } from './compose-generator.js';
import { ImageManager } from './image-manager.js';
import type { MidnightStackConfig, ContainerStatus, ImagePullProgress } from './types.js';

/**
 * Service names in the Midnight stack
 */
export type ServiceName = 'node' | 'indexer' | 'proof-server';

/**
 * Stack status information
 */
export interface StackStatus {
  running: boolean;
  services: Record<ServiceName, ContainerStatus | null>;
}

/**
 * Options for starting the stack
 */
export interface StartOptions {
  /** Pull latest images before starting */
  pull?: boolean;
  /** Callback for pull progress */
  onPullProgress?: (progress: ImagePullProgress) => void;
  /** Reset data volumes before starting */
  reset?: boolean;
}

/**
 * Manages the Midnight Docker stack lifecycle
 */
export class StackManager {
  private client: DockerClient;
  private generator: ComposeGenerator;
  private imageManager: ImageManager;
  private config: MidnightStackConfig;
  private composeFilePath: string;
  private projectDir: string;

  constructor(config: MidnightStackConfig = {}, projectDir: string = process.cwd()) {
    this.config = config;
    this.projectDir = projectDir;
    this.client = new DockerClient();
    this.generator = new ComposeGenerator(config);
    this.imageManager = new ImageManager(this.client);
    this.composeFilePath = join(projectDir, '.nightcap', 'docker-compose.yml');
  }

  /**
   * Get the project name for container naming
   */
  getProjectName(): string {
    return this.generator.getProjectName();
  }

  /**
   * Get service URLs
   */
  getServiceUrls(): Record<string, string> {
    return this.generator.getServiceUrls();
  }

  /**
   * Check if Docker is available
   */
  async isDockerAvailable(): Promise<boolean> {
    return this.client.isAvailable();
  }

  /**
   * Get Docker version
   */
  async getDockerVersion(): Promise<{ version: string; apiVersion: string } | null> {
    return this.client.getVersion();
  }

  /**
   * Check which images are missing
   */
  async getMissingImages(): Promise<string[]> {
    return this.imageManager.getMissingImages(this.config.images);
  }

  /**
   * Pull missing images
   */
  async pullImages(onProgress?: (progress: ImagePullProgress) => void): Promise<boolean> {
    const result = await this.imageManager.pullMissingImages(onProgress, this.config.images);
    return result.success;
  }

  /**
   * Write the docker-compose.yml file
   */
  async writeComposeFile(): Promise<string> {
    const dir = join(this.projectDir, '.nightcap');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const yaml = this.generator.toYaml();
    await writeFile(this.composeFilePath, yaml, 'utf8');
    return this.composeFilePath;
  }

  /**
   * Start the Midnight stack
   */
  async start(options: StartOptions = {}): Promise<{ success: boolean; error?: string }> {
    // Check Docker availability
    if (!await this.isDockerAvailable()) {
      return {
        success: false,
        error: 'Docker is not available. Please install Docker and ensure it is running.',
      };
    }

    // Pull images if requested or if any are missing
    if (options.pull) {
      const pullSuccess = await this.pullImages(options.onPullProgress);
      if (!pullSuccess) {
        return {
          success: false,
          error: 'Failed to pull required Docker images.',
        };
      }
    } else {
      const missing = await this.getMissingImages();
      if (missing.length > 0) {
        const pullSuccess = await this.pullImages(options.onPullProgress);
        if (!pullSuccess) {
          return {
            success: false,
            error: `Failed to pull required Docker images: ${missing.join(', ')}`,
          };
        }
      }
    }

    // Reset data if requested
    if (options.reset) {
      await this.resetData();
    }

    // Write docker-compose.yml
    await this.writeComposeFile();

    // Start with docker compose
    return this.runDockerCompose(['up', '-d']);
  }

  /**
   * Stop the Midnight stack
   */
  async stop(): Promise<{ success: boolean; error?: string }> {
    if (!existsSync(this.composeFilePath)) {
      return { success: true }; // Nothing to stop
    }

    return this.runDockerCompose(['down']);
  }

  /**
   * Get status of all services
   */
  async getStatus(): Promise<StackStatus> {
    const projectName = this.getProjectName();
    const containers = await this.client.listContainers({
      name: [`${projectName}_`],
    });

    const findContainer = (service: ServiceName): ContainerStatus | null => {
      const name = service === 'proof-server' ? 'proof_server' : service;
      return containers.find(c => c.name === `${projectName}_${name}`) ?? null;
    };

    const services: Record<ServiceName, ContainerStatus | null> = {
      node: findContainer('node'),
      indexer: findContainer('indexer'),
      'proof-server': findContainer('proof-server'),
    };

    const running = Object.values(services).some(s => s?.state === 'running');

    return { running, services };
  }

  /**
   * Get logs from a service
   */
  async getLogs(service?: ServiceName, tail = 100): Promise<string> {
    const projectName = this.getProjectName();

    if (service) {
      const containerName = service === 'proof-server'
        ? `${projectName}_proof_server`
        : `${projectName}_${service}`;
      return this.client.getContainerLogs(containerName, { tail });
    }

    // Get logs from all services
    const services: ServiceName[] = ['node', 'indexer', 'proof-server'];
    const logs: string[] = [];

    for (const svc of services) {
      const containerName = svc === 'proof-server'
        ? `${projectName}_proof_server`
        : `${projectName}_${svc}`;
      const serviceLogs = await this.client.getContainerLogs(containerName, { tail: Math.floor(tail / 3) });
      if (serviceLogs) {
        logs.push(`=== ${svc} ===\n${serviceLogs}`);
      }
    }

    return logs.join('\n\n');
  }

  /**
   * Follow logs from services (returns child process)
   */
  followLogs(service?: ServiceName): ChildProcess {
    const args = ['compose', '-f', this.composeFilePath, 'logs', '-f'];
    if (service) {
      args.push(service);
    }
    return spawn('docker', args, { stdio: 'inherit' });
  }

  /**
   * Reset data volumes
   */
  async resetData(): Promise<{ success: boolean; error?: string }> {
    // Stop stack first
    await this.stop();

    // Remove volumes
    const result = await this.runDockerCompose(['down', '-v']);

    if (!result.success) {
      return result;
    }

    // Also clean up the .nightcap directory data if it exists
    const dataDir = join(this.projectDir, '.nightcap', 'data');
    if (existsSync(dataDir)) {
      await rm(dataDir, { recursive: true, force: true });
    }

    return { success: true };
  }

  /**
   * Get the snapshots directory path
   */
  private getSnapshotsDir(): string {
    return join(this.projectDir, '.nightcap', 'snapshots');
  }

  /**
   * Get the data directory path
   */
  private getDataDir(): string {
    return join(this.projectDir, '.nightcap', 'data');
  }

  /**
   * Create a snapshot of the current state
   */
  async createSnapshot(name: string): Promise<{ success: boolean; error?: string; path?: string }> {
    // Validate snapshot name (alphanumeric, dashes, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return {
        success: false,
        error: 'Snapshot name must contain only alphanumeric characters, dashes, and underscores',
      };
    }

    const dataDir = this.getDataDir();
    const snapshotsDir = this.getSnapshotsDir();
    const snapshotPath = join(snapshotsDir, name);

    // Check if data directory exists
    if (!existsSync(dataDir)) {
      return {
        success: false,
        error: 'No data directory found. Start the node first to create some state.',
      };
    }

    // Check if snapshot already exists
    if (existsSync(snapshotPath)) {
      return {
        success: false,
        error: `Snapshot '${name}' already exists. Delete it first or choose a different name.`,
      };
    }

    // Stop stack to ensure clean snapshot
    const wasRunning = (await this.getStatus()).running;
    if (wasRunning) {
      await this.stop();
    }

    try {
      // Create snapshots directory if needed
      await mkdir(snapshotsDir, { recursive: true });

      // Copy data directory to snapshot
      await cp(dataDir, snapshotPath, { recursive: true });

      // Write metadata
      const metadata = {
        name,
        createdAt: new Date().toISOString(),
        projectName: this.getProjectName(),
      };
      await writeFile(join(snapshotPath, 'snapshot.json'), JSON.stringify(metadata, null, 2));

      // Restart stack if it was running
      if (wasRunning) {
        await this.start();
      }

      return { success: true, path: snapshotPath };
    } catch (error) {
      // Try to restart if it was running
      if (wasRunning) {
        await this.start();
      }

      return {
        success: false,
        error: `Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Restore from a snapshot
   */
  async restoreSnapshot(name: string): Promise<{ success: boolean; error?: string }> {
    const dataDir = this.getDataDir();
    const snapshotsDir = this.getSnapshotsDir();
    const snapshotPath = join(snapshotsDir, name);

    // Check if snapshot exists
    if (!existsSync(snapshotPath)) {
      return {
        success: false,
        error: `Snapshot '${name}' not found`,
      };
    }

    // Stop stack first
    const wasRunning = (await this.getStatus()).running;
    if (wasRunning) {
      await this.stop();
    }

    // Remove docker volumes
    await this.runDockerCompose(['down', '-v']);

    try {
      // Remove existing data
      if (existsSync(dataDir)) {
        await rm(dataDir, { recursive: true, force: true });
      }

      // Copy snapshot to data directory
      await cp(snapshotPath, dataDir, { recursive: true });

      // Remove snapshot metadata from restored data
      const metadataPath = join(dataDir, 'snapshot.json');
      if (existsSync(metadataPath)) {
        await rm(metadataPath);
      }

      // Restart stack if it was running
      if (wasRunning) {
        await this.start();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to restore snapshot: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<Array<{ name: string; createdAt: string; path: string }>> {
    const snapshotsDir = this.getSnapshotsDir();

    if (!existsSync(snapshotsDir)) {
      return [];
    }

    const entries = await readdir(snapshotsDir, { withFileTypes: true });
    const snapshots: Array<{ name: string; createdAt: string; path: string }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const snapshotPath = join(snapshotsDir, entry.name);
      const metadataPath = join(snapshotPath, 'snapshot.json');

      let createdAt = 'unknown';
      if (existsSync(metadataPath)) {
        try {
          const { readFile } = await import('node:fs/promises');
          const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
          createdAt = metadata.createdAt ?? 'unknown';
        } catch {
          // Ignore metadata parsing errors
        }
      }

      snapshots.push({
        name: entry.name,
        createdAt,
        path: snapshotPath,
      });
    }

    // Sort by creation date (newest first)
    snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return snapshots;
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(name: string): Promise<{ success: boolean; error?: string }> {
    const snapshotsDir = this.getSnapshotsDir();
    const snapshotPath = join(snapshotsDir, name);

    if (!existsSync(snapshotPath)) {
      return {
        success: false,
        error: `Snapshot '${name}' not found`,
      };
    }

    try {
      await rm(snapshotPath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete snapshot: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Execute a command in a service container
   */
  async exec(service: ServiceName, command: string[]): Promise<{ success: boolean; output?: string; error?: string }> {
    const projectName = this.getProjectName();
    const containerName = service === 'proof-server'
      ? `${projectName}_proof_server`
      : `${projectName}_${service}`;

    return new Promise((resolve) => {
      const proc = spawn('docker', ['exec', containerName, ...command]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: stdout });
        } else {
          resolve({ success: false, error: stderr || stdout });
        }
      });

      proc.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  }

  /**
   * Run a docker compose command
   */
  private runDockerCompose(args: string[]): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const proc = spawn('docker', ['compose', '-f', this.composeFilePath, ...args], {
        stdio: 'inherit',
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `docker compose exited with code ${code}` });
        }
      });

      proc.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  }
}
