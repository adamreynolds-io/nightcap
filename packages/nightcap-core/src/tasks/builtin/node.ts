/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { StackManager, DEFAULT_PORTS } from '@nightcap/docker-orchestrator';
import type { ImagePullProgress, ServiceName } from '@nightcap/docker-orchestrator';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Create a stack manager from the task context
 */
function createStackManager(context: TaskContext): StackManager {
  return new StackManager({
    projectName: 'nightcap',
    ports: {
      nodeRpc: context.config.docker?.ports?.nodeRpc ?? DEFAULT_PORTS.nodeRpc,
      nodeWs: context.config.docker?.ports?.nodeWs ?? DEFAULT_PORTS.nodeWs,
      indexer: context.config.docker?.ports?.indexer ?? DEFAULT_PORTS.indexer,
      proofServer: context.config.docker?.ports?.proofServer ?? DEFAULT_PORTS.proofServer,
    },
    images: context.config.docker?.images,
  });
}

/**
 * Format progress for display
 */
function formatPullProgress(progress: ImagePullProgress): string {
  let message = `${progress.image}: ${progress.status}`;
  if (progress.progress) {
    const percent = Math.round((progress.progress.current / progress.progress.total) * 100);
    message += ` (${percent}%)`;
  }
  return message;
}

/**
 * Set up graceful shutdown handlers for SIGINT and SIGTERM
 * Returns a cleanup function to remove the handlers
 */
function setupShutdownHandlers(stack: StackManager): () => void {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }
    isShuttingDown = true;

    logger.newline();
    logger.info(`Received ${signal}, stopping Midnight stack...`);

    try {
      const result = await stack.stop();
      if (result.success) {
        logger.success('Midnight stack stopped gracefully');
      } else {
        logger.error(`Failed to stop stack: ${result.error ?? 'Unknown error'}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    process.exit(0);
  };

  const sigintHandler = (): void => {
    void shutdown('SIGINT');
  };
  const sigtermHandler = (): void => {
    void shutdown('SIGTERM');
  };

  process.on('SIGINT', sigintHandler);
  process.on('SIGTERM', sigtermHandler);

  // Return cleanup function
  return () => {
    process.off('SIGINT', sigintHandler);
    process.off('SIGTERM', sigtermHandler);
  };
}

/**
 * Node start task - starts the local Midnight Docker stack
 */
export const nodeTask: TaskDefinition = {
  name: 'node',
  description: 'Start local Midnight development network',
  params: {
    pull: {
      type: 'boolean',
      description: 'Pull latest images before starting',
      default: false,
    },
    reset: {
      type: 'boolean',
      description: 'Reset data volumes before starting',
      default: false,
    },
    detach: {
      type: 'boolean',
      description: 'Run in background (detached mode)',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);

    // Check Docker availability
    if (!(await stack.isDockerAvailable())) {
      logger.error('Docker is not available.');
      logger.info('Please install Docker: https://docs.docker.com/get-docker/');
      throw new Error('Docker not available');
    }

    // Check if already running
    const status = await stack.getStatus();
    if (status.running) {
      logger.info('Midnight stack is already running.');
      displayStatus(status, stack.getServiceUrls());
      return;
    }

    logger.info('Starting Midnight local development network...');

    // Pull images if needed
    const missing = await stack.getMissingImages();
    if (missing.length > 0 || context.params['pull']) {
      logger.info('Pulling Docker images...');
      let lastImage = '';
      const success = await stack.pullImages((progress) => {
        if (progress.image !== lastImage) {
          if (lastImage) logger.log('');
          lastImage = progress.image;
        }
        if (context.verbose) {
          logger.debug(formatPullProgress(progress));
        }
      });

      if (!success) {
        throw new Error('Failed to pull Docker images');
      }
      logger.success('Images pulled successfully');
    }

    // Start the stack
    const reset = context.params['reset'] === true;
    const result = await stack.start({ reset });

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to start stack');
    }

    logger.success('Midnight stack started successfully!');
    logger.newline();

    // Display service URLs
    const urls = stack.getServiceUrls();
    logger.info('Service URLs:');
    logger.log(`  Node RPC:     ${urls['nodeRpc']}`);
    logger.log(`  Node WS:      ${urls['nodeWs']}`);
    logger.log(`  Indexer:      ${urls['indexer']}`);
    logger.log(`  Proof Server: ${urls['proofServer']}`);
    logger.newline();

    const detach = context.params['detach'] === true;

    if (detach) {
      // Detached mode - exit after starting
      logger.info('Running in detached mode');
      logger.info('Run "nightcap node:stop" to stop the network');
      logger.info('Run "nightcap node:logs" to view logs');
    } else {
      // Foreground mode - keep running and handle signals
      logger.info('Press Ctrl+C to stop the network');
      logger.newline();

      // Set up graceful shutdown handlers
      setupShutdownHandlers(stack);

      // Keep the process alive
      await new Promise<void>(() => {
        // This promise never resolves - we exit via signal handlers
      });
    }
  },
};

/**
 * Node stop task
 */
export const nodeStopTask: TaskDefinition = {
  name: 'node:stop',
  description: 'Stop local Midnight development network',

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);

    logger.info('Stopping Midnight stack...');
    const result = await stack.stop();

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to stop stack');
    }

    logger.success('Midnight stack stopped');
  },
};

/**
 * Node status task
 */
export const nodeStatusTask: TaskDefinition = {
  name: 'node:status',
  description: 'Show status of local Midnight network',

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);
    const status = await stack.getStatus();

    displayStatus(status, stack.getServiceUrls());
  },
};

/**
 * Node logs task
 */
export const nodeLogsTask: TaskDefinition = {
  name: 'node:logs',
  description: 'View logs from local Midnight network',
  params: {
    service: {
      type: 'string',
      description: 'Service to show logs for (node, indexer, proof-server)',
    },
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
    const stack = createStackManager(context);
    const service = context.params['service'] as ServiceName | undefined;
    const follow = context.params['follow'] === true;
    const tail = (context.params['tail'] as number) ?? 100;

    if (follow) {
      logger.info(`Following logs${service ? ` for ${service}` : ''}... (Ctrl+C to stop)`);
      const proc = stack.followLogs(service);

      // Handle graceful shutdown
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
      const logs = await stack.getLogs(service, tail);
      if (logs) {
        logger.log(logs);
      } else {
        logger.warn('No logs available. Is the stack running?');
      }
    }
  },
};

/**
 * Node reset task
 */
export const nodeResetTask: TaskDefinition = {
  name: 'node:reset',
  description: 'Reset local Midnight network data',

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);

    logger.info('Resetting Midnight stack data...');
    const result = await stack.resetData();

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to reset stack');
    }

    logger.success('Midnight stack data reset');
    logger.info('Run "nightcap node" to start fresh');
  },
};

/**
 * Node exec task - execute command in a service container
 */
export const nodeExecTask: TaskDefinition = {
  name: 'node:exec',
  description: 'Execute a command in a service container',
  params: {
    service: {
      type: 'string',
      description: 'Service to run command in (node, indexer, proof-server)',
      required: true,
    },
    command: {
      type: 'string',
      description: 'Command to execute',
      required: true,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);
    const service = context.params['service'] as ServiceName;
    const command = context.params['command'] as string;

    // Validate service name
    const validServices: ServiceName[] = ['node', 'indexer', 'proof-server'];
    if (!validServices.includes(service)) {
      logger.error(`Invalid service: ${service}`);
      logger.info(`Valid services: ${validServices.join(', ')}`);
      throw new Error('Invalid service');
    }

    // Check if stack is running
    const status = await stack.getStatus();
    if (!status.running) {
      logger.error('Midnight stack is not running');
      logger.info('Start it with: nightcap node');
      throw new Error('Stack not running');
    }

    // Check if specific service is running
    const serviceStatus = status.services[service];
    if (!serviceStatus || serviceStatus.state !== 'running') {
      logger.error(`Service '${service}' is not running`);
      throw new Error('Service not running');
    }

    // Parse command into array (split by spaces, respecting quotes)
    const commandParts = parseCommand(command);

    logger.debug(`Executing in ${service}: ${commandParts.join(' ')}`);
    const result = await stack.exec(service, commandParts);

    if (result.success) {
      if (result.output) {
        logger.log(result.output);
      }
    } else {
      logger.error(`Command failed: ${result.error}`);
      throw new Error('Command execution failed');
    }
  },
};

/**
 * Shell metacharacters that indicate shell features not supported in container exec
 */
const SHELL_METACHARACTERS = ['|', '>', '<', '&', ';', '$', '`', '(', ')', '{', '}'];

/**
 * Parse a command string into parts, respecting quoted strings.
 *
 * SECURITY NOTE: This is a simple parser that does NOT support:
 * - Backslash escaping within quoted strings
 * - Shell features (pipes, redirects, command substitution, etc.)
 * - Environment variable expansion
 *
 * Commands are executed directly via Docker exec without a shell,
 * which prevents shell injection but also means shell features won't work.
 *
 * @throws Error if shell metacharacters are detected (to prevent user confusion)
 */
function parseCommand(command: string): string[] {
  // Warn users if they're trying to use shell features that won't work
  for (const char of SHELL_METACHARACTERS) {
    if (command.includes(char)) {
      throw new Error(
        `Shell metacharacter '${char}' detected in command. ` +
          `Shell features (pipes, redirects, etc.) are not supported. ` +
          `Commands are executed directly in the container without a shell.`
      );
    }
  }

  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (const char of command) {
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Display stack status
 */
function displayStatus(status: { running: boolean; services: Record<ServiceName, { state: string } | null> }, urls: Record<string, string>): void {
  if (status.running) {
    logger.success('Midnight stack is running');
  } else {
    logger.warn('Midnight stack is not running');
  }

  logger.newline();
  logger.info('Services:');

  const services: Array<{ name: string; key: ServiceName; urlKey: string }> = [
    { name: 'Node', key: 'node', urlKey: 'nodeRpc' },
    { name: 'Indexer', key: 'indexer', urlKey: 'indexer' },
    { name: 'Proof Server', key: 'proof-server', urlKey: 'proofServer' },
  ];

  for (const svc of services) {
    const container = status.services[svc.key];
    const state = container?.state ?? 'stopped';
    const stateIcon = state === 'running' ? '[OK]' : '[--]';
    const url = state === 'running' ? urls[svc.urlKey] : '';
    logger.log(`  ${stateIcon} ${svc.name.padEnd(12)} ${state.padEnd(10)} ${url}`);
  }
}

/**
 * Node snapshot task - create a snapshot of the current state
 */
export const nodeSnapshotTask: TaskDefinition = {
  name: 'node:snapshot',
  description: 'Create a snapshot of the local network state',
  params: {
    name: {
      type: 'string',
      description: 'Name for the snapshot',
      required: true,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);
    const name = context.params['name'] as string;

    if (!name) {
      logger.error('Snapshot name is required');
      logger.info('Usage: nightcap node:snapshot --name <snapshot-name>');
      throw new Error('Snapshot name required');
    }

    logger.info(`Creating snapshot '${name}'...`);

    const result = await stack.createSnapshot(name);

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to create snapshot');
    }

    logger.success(`Snapshot '${name}' created successfully`);
    if (result.path) {
      logger.info(`Location: ${result.path}`);
    }
  },
};

/**
 * Node restore task - restore from a snapshot
 */
export const nodeRestoreTask: TaskDefinition = {
  name: 'node:restore',
  description: 'Restore local network state from a snapshot',
  params: {
    name: {
      type: 'string',
      description: 'Name of the snapshot to restore',
      required: true,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);
    const name = context.params['name'] as string;

    if (!name) {
      logger.error('Snapshot name is required');
      logger.info('Usage: nightcap node:restore --name <snapshot-name>');
      throw new Error('Snapshot name required');
    }

    logger.info(`Restoring snapshot '${name}'...`);

    const result = await stack.restoreSnapshot(name);

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to restore snapshot');
    }

    logger.success(`Snapshot '${name}' restored successfully`);
    logger.info('Run "nightcap node" to start the network with restored state');
  },
};

/**
 * Node snapshots task - list available snapshots
 */
export const nodeSnapshotsTask: TaskDefinition = {
  name: 'node:snapshots',
  description: 'List available state snapshots',

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);

    const snapshots = await stack.listSnapshots();

    if (snapshots.length === 0) {
      logger.info('No snapshots found');
      logger.info('Create one with: nightcap node:snapshot --name <name>');
      return;
    }

    logger.info(`Found ${snapshots.length} snapshot(s):`);
    logger.newline();

    for (const snapshot of snapshots) {
      const date = snapshot.createdAt !== 'unknown'
        ? new Date(snapshot.createdAt).toLocaleString()
        : 'unknown';
      logger.log(`  ${snapshot.name.padEnd(20)} ${date}`);
    }
  },
};

/**
 * Node snapshot delete task - delete a snapshot
 */
export const nodeSnapshotDeleteTask: TaskDefinition = {
  name: 'node:snapshot:delete',
  description: 'Delete a state snapshot',
  params: {
    name: {
      type: 'string',
      description: 'Name of the snapshot to delete',
      required: true,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const stack = createStackManager(context);
    const name = context.params['name'] as string;

    if (!name) {
      logger.error('Snapshot name is required');
      logger.info('Usage: nightcap node:snapshot:delete --name <snapshot-name>');
      throw new Error('Snapshot name required');
    }

    logger.info(`Deleting snapshot '${name}'...`);

    const result = await stack.deleteSnapshot(name);

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to delete snapshot');
    }

    logger.success(`Snapshot '${name}' deleted`);
  },
};
