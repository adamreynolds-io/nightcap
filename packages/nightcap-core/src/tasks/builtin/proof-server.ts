/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, execSync } from 'node:child_process';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import { DEFAULT_PROOF_SERVER_URL } from '../../config/defaults.js';

/**
 * Default proof server image
 */
const DEFAULT_PROOF_SERVER_IMAGE = 'ghcr.io/midnight-ntwrk/proof-server:7.0.0-alpha.1';

/**
 * Container name for standalone proof server
 */
const CONTAINER_NAME = 'nightcap_proof_server_standalone';

/**
 * Check if Docker is available
 */
function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a container is running
 */
function isContainerRunning(name: string): boolean {
  try {
    const result = execSync(`docker ps -q -f name=${name}`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Stop and remove a container if it exists
 */
function removeContainer(name: string): void {
  try {
    execSync(`docker rm -f ${name}`, { stdio: 'ignore' });
  } catch {
    // Container may not exist, that's fine
  }
}

/**
 * Get the WebSocket URL for a network's node
 * Converts HTTP URLs to WebSocket URLs
 */
function getNodeWsUrl(nodeUrl: string | undefined): string {
  if (!nodeUrl) {
    throw new Error('Node URL is required. Configure it in nightcap.config.ts or use --node-url');
  }

  // Convert http(s):// to ws(s)://
  let wsUrl = nodeUrl;
  if (wsUrl.startsWith('https://')) {
    wsUrl = 'wss://' + wsUrl.slice(8);
  } else if (wsUrl.startsWith('http://')) {
    wsUrl = 'ws://' + wsUrl.slice(7);
  }

  return wsUrl;
}

/**
 * Wait for the proof server to be ready
 */
async function waitForReady(
  url: string,
  timeoutMs: number = 60000,
  intervalMs: number = 2000
): Promise<boolean> {
  const healthUrl = `${url}/health`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Proof server start task
 *
 * Starts a local proof server that connects to the specified network's node.
 * The proof server MUST run locally because it processes private transaction
 * inputs - sending private data to a remote server would compromise privacy.
 */
export const proofServerTask: TaskDefinition = {
  name: 'proof-server',
  description: 'Start local proof server for remote networks',
  params: {
    'node-url': {
      type: 'string',
      description: 'WebSocket URL of the node to connect to (overrides network config)',
    },
    detach: {
      type: 'boolean',
      description: 'Run in background (detached mode)',
      default: false,
    },
    image: {
      type: 'string',
      description: 'Docker image to use for proof server',
    },
    port: {
      type: 'number',
      description: 'Local port to expose (default: 6300)',
      default: 6300,
    },
  },

  async action(context: TaskContext): Promise<void> {
    // Check Docker availability
    if (!isDockerAvailable()) {
      logger.error('Docker is not available.');
      logger.info('Please install Docker: https://docs.docker.com/get-docker/');
      throw new Error('Docker not available');
    }

    // Get node URL from params or network config
    const nodeUrlParam = context.params['node-url'] as string | undefined;
    const nodeUrl = nodeUrlParam ?? context.network.nodeUrl;
    const wsUrl = getNodeWsUrl(nodeUrl);

    const image = (context.params['image'] as string) ?? DEFAULT_PROOF_SERVER_IMAGE;
    const port = (context.params['port'] as number) ?? 6300;
    const detach = context.params['detach'] === true;

    // Check if already running
    if (isContainerRunning(CONTAINER_NAME)) {
      logger.info('Proof server is already running.');
      logger.info(`URL: ${DEFAULT_PROOF_SERVER_URL}`);
      logger.info('Stop it with: nightcap proof-server:stop');
      return;
    }

    logger.info(`Starting proof server for network: ${context.networkName}`);
    logger.info(`Connecting to node: ${wsUrl}`);

    // Remove any existing stopped container
    removeContainer(CONTAINER_NAME);

    // Build docker run command
    const dockerArgs = [
      'run',
      '--name', CONTAINER_NAME,
      '-p', `${port}:6300`,
      '-e', `NODE_URL=${wsUrl}`,
      '-e', 'RUST_LOG=info',
      '--rm',
    ];

    if (detach) {
      dockerArgs.push('-d');
    }

    dockerArgs.push(image);

    if (detach) {
      // Run in background
      try {
        execSync(`docker ${dockerArgs.join(' ')}`, { stdio: 'inherit' });
      } catch (error) {
        throw new Error(`Failed to start proof server: ${error instanceof Error ? error.message : String(error)}`);
      }

      logger.info('Waiting for proof server to be ready...');
      const ready = await waitForReady(`http://localhost:${port}`);

      if (ready) {
        logger.success('Proof server started successfully!');
        logger.newline();
        logger.info(`URL: http://localhost:${port}`);
        logger.info(`Connected to: ${wsUrl}`);
        logger.newline();
        logger.info('Stop with: nightcap proof-server:stop');
      } else {
        logger.warn('Proof server started but health check timed out.');
        logger.info('Check logs with: docker logs ' + CONTAINER_NAME);
      }
    } else {
      // Run in foreground
      logger.info('Starting in foreground mode... (Ctrl+C to stop)');
      logger.newline();

      const proc = spawn('docker', dockerArgs, {
        stdio: 'inherit',
      });

      // Handle graceful shutdown
      const cleanup = () => {
        logger.newline();
        logger.info('Stopping proof server...');
        proc.kill('SIGTERM');
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      await new Promise<void>((resolve, reject) => {
        proc.on('close', (code) => {
          if (code === 0 || code === null) {
            resolve();
          } else {
            reject(new Error(`Proof server exited with code ${code}`));
          }
        });
        proc.on('error', reject);
      });

      logger.success('Proof server stopped');
    }
  },
};

/**
 * Proof server stop task
 */
export const proofServerStopTask: TaskDefinition = {
  name: 'proof-server:stop',
  description: 'Stop the local proof server',

  async action(_context: TaskContext): Promise<void> {
    if (!isContainerRunning(CONTAINER_NAME)) {
      logger.info('Proof server is not running.');
      return;
    }

    logger.info('Stopping proof server...');
    removeContainer(CONTAINER_NAME);
    logger.success('Proof server stopped');
  },
};

/**
 * Proof server status task
 */
export const proofServerStatusTask: TaskDefinition = {
  name: 'proof-server:status',
  description: 'Show status of the local proof server',

  async action(_context: TaskContext): Promise<void> {
    const running = isContainerRunning(CONTAINER_NAME);

    if (running) {
      logger.success('Proof server is running');
      logger.info(`URL: ${DEFAULT_PROOF_SERVER_URL}`);

      // Check health
      try {
        const response = await fetch(`${DEFAULT_PROOF_SERVER_URL}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          logger.info('Health: OK');
        } else {
          logger.warn('Health: Not responding');
        }
      } catch {
        logger.warn('Health: Not responding');
      }
    } else {
      logger.info('Proof server is not running');
      logger.info('Start with: nightcap proof-server --network <network-name>');
    }
  },
};

/**
 * Proof server logs task
 */
export const proofServerLogsTask: TaskDefinition = {
  name: 'proof-server:logs',
  description: 'View logs from the local proof server',
  params: {
    follow: {
      type: 'boolean',
      description: 'Follow log output',
      default: false,
    },
    tail: {
      type: 'number',
      description: 'Number of lines to show',
      default: 100,
    },
  },

  async action(context: TaskContext): Promise<void> {
    if (!isContainerRunning(CONTAINER_NAME)) {
      logger.error('Proof server is not running');
      return;
    }

    const follow = context.params['follow'] === true;
    const tail = (context.params['tail'] as number) ?? 100;

    const args = ['logs', `--tail=${tail}`];
    if (follow) {
      args.push('-f');
    }
    args.push(CONTAINER_NAME);

    if (follow) {
      logger.info('Following logs... (Ctrl+C to stop)');
      const proc = spawn('docker', args, { stdio: 'inherit' });

      const cleanup = () => {
        proc.kill('SIGTERM');
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      await new Promise<void>((resolve) => {
        proc.on('close', () => resolve());
      });
    } else {
      try {
        execSync(`docker ${args.join(' ')}`, { stdio: 'inherit' });
      } catch {
        logger.error('Failed to get logs');
      }
    }
  },
};
