/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import type {
  ToolkitConfig,
  ToolkitCommandOptions,
  ToolkitResult,
  ToolkitEndpoint,
  ToolkitError,
  ToolkitErrorCode,
} from './types.js';
import { DEFAULT_TOOLKIT_IMAGE, TOOLKIT_ERROR_CODES } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Default timeout for toolkit commands (5 minutes)
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Docker network name for local stack
 */
const DOCKER_NETWORK = 'nightcap_default';

/**
 * Directories that should never be mounted into containers.
 * These are sensitive system directories that could lead to
 * privilege escalation or data exposure if a container is compromised.
 */
const FORBIDDEN_MOUNT_PATHS = [
  '/',
  '/etc',
  '/var',
  '/usr',
  '/bin',
  '/sbin',
  '/lib',
  '/root',
  '/boot',
  '/dev',
  '/proc',
  '/sys',
];

/**
 * Validate that a working directory is safe to mount into a container.
 * Prevents mounting sensitive system directories.
 */
function validateWorkDir(workDir: string): void {
  const resolved = resolve(workDir);

  // Check against forbidden paths
  for (const forbidden of FORBIDDEN_MOUNT_PATHS) {
    if (resolved === forbidden || resolved === resolve(forbidden)) {
      throw new Error(
        `Security: Cannot mount '${workDir}' into container. ` +
          `Mounting system directories is not allowed.`
      );
    }
  }

  // Warn if mounting home directory directly (not a subdirectory)
  const home = homedir();
  if (resolved === home) {
    logger.warn(
      `Warning: Mounting home directory directly. Consider using a project subdirectory instead.`
    );
  }
}

/**
 * Bridge for executing toolkit commands via Docker
 */
export class ToolkitDockerBridge {
  private config: ToolkitConfig;
  private image: string;

  constructor(config: ToolkitConfig = {}) {
    this.config = config;
    this.image = config.image ?? DEFAULT_TOOLKIT_IMAGE;
  }

  /**
   * Check if Docker is available
   */
  async isDockerAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('docker', ['info'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Check if the toolkit image is available
   */
  async isImageAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('docker', ['image', 'inspect', this.image], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Pull the toolkit image
   */
  async pullImage(): Promise<boolean> {
    logger.info(`Pulling toolkit image: ${this.image}`);

    return new Promise((resolve) => {
      const proc = spawn('docker', ['pull', this.image], {
        stdio: 'inherit',
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Execute a toolkit command via Docker
   */
  async execute<T = unknown>(
    command: string[],
    options: ToolkitCommandOptions & { volumeMounts?: string[] } = {}
  ): Promise<ToolkitResult<T>> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    // Build docker run command
    const dockerArgs = this.buildDockerArgs(command, options);

    logger.debug(`Executing toolkit: docker ${dockerArgs.join(' ')}`);

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...options.env,
        },
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGTERM');
      }, timeout);

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);

        const exitCode = code ?? 1;

        if (timedOut) {
          resolve({
            success: false,
            stdout,
            stderr,
            exitCode: -1,
            error: `Command timed out after ${timeout}ms`,
          });
          return;
        }

        if (exitCode !== 0) {
          const error = this.parseError(stderr || stdout, exitCode);
          resolve({
            success: false,
            stdout,
            stderr,
            exitCode,
            error: error.message,
          });
          return;
        }

        // Try to parse JSON output
        let data: T | undefined;
        if (options.outputFormat === 'json' || stdout.trim().startsWith('{')) {
          try {
            data = JSON.parse(stdout.trim()) as T;
          } catch {
            // Not JSON, that's OK
          }
        }

        resolve({
          success: true,
          data,
          stdout,
          stderr,
          exitCode,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          stdout,
          stderr,
          exitCode: -1,
          error: err.message,
        });
      });
    });
  }

  /**
   * Build Docker run arguments
   */
  private buildDockerArgs(
    command: string[],
    options: ToolkitCommandOptions & { volumeMounts?: string[] }
  ): string[] {
    const args = ['run', '--rm'];

    // Add network for local stack connectivity
    args.push('--network', DOCKER_NETWORK);

    // Add volume mounts
    if (options.volumeMounts) {
      for (const mount of options.volumeMounts) {
        args.push('-v', mount);
      }
    }

    // Add working directory mount (current directory)
    const workDir = this.config.workDir ?? process.cwd();

    // Security: Validate workDir before mounting
    validateWorkDir(workDir);

    args.push('-v', `${workDir}:/workspace`);
    args.push('-w', '/workspace');

    // Add environment variables
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push('-e', `${key}=${value}`);
      }
    }

    // Add source endpoint
    if (options.source) {
      args.push('-e', `MIDNIGHT_NODE_URL=${options.source.nodeUrl}`);
      args.push('-e', `MIDNIGHT_INDEXER_URL=${options.source.indexerUrl}`);
      args.push('-e', `MIDNIGHT_PROOF_SERVER_URL=${options.source.proofServerUrl}`);
    }

    // Image and command
    args.push(this.image);
    args.push(...command);

    return args;
  }

  /**
   * Build source/destination arguments for toolkit commands
   */
  buildEndpointArgs(
    endpoint: ToolkitEndpoint,
    prefix: 'source' | 'destination'
  ): string[] {
    const args: string[] = [];

    // The toolkit uses --source and --destination flags with chain: prefix
    if (prefix === 'source') {
      args.push('--source', `chain:${endpoint.nodeUrl}`);
    } else {
      args.push('--destination', `chain:${endpoint.nodeUrl}`);
    }

    args.push('--prover', endpoint.proofServerUrl);
    args.push('--indexer', endpoint.indexerUrl);

    return args;
  }

  /**
   * Parse toolkit error output
   */
  private parseError(output: string, exitCode: number): ToolkitError {
    const lowerOutput = output.toLowerCase();

    // Connection errors
    if (lowerOutput.includes('connection refused') || lowerOutput.includes('econnrefused')) {
      return {
        code: TOOLKIT_ERROR_CODES.CONNECTION_FAILED,
        message: 'Failed to connect to Midnight network',
        details: output,
        suggestion: 'Ensure the network is running with "nightcap node"',
      };
    }

    // Artifact errors
    if (lowerOutput.includes('artifact') && (lowerOutput.includes('not found') || lowerOutput.includes('invalid'))) {
      return {
        code: TOOLKIT_ERROR_CODES.INVALID_ARTIFACT,
        message: 'Invalid or missing contract artifact',
        details: output,
        suggestion: 'Run "nightcap compile" to generate artifacts',
      };
    }

    // Insufficient funds
    if (lowerOutput.includes('insufficient') || lowerOutput.includes('balance')) {
      return {
        code: TOOLKIT_ERROR_CODES.INSUFFICIENT_FUNDS,
        message: 'Insufficient funds for transaction',
        details: output,
        suggestion: 'Ensure your wallet has sufficient balance',
      };
    }

    // Contract not found
    if (lowerOutput.includes('contract') && lowerOutput.includes('not found')) {
      return {
        code: TOOLKIT_ERROR_CODES.CONTRACT_NOT_FOUND,
        message: 'Contract not found at the specified address',
        details: output,
        suggestion: 'Verify the contract address is correct',
      };
    }

    // Proof generation failed
    if (lowerOutput.includes('proof') && lowerOutput.includes('fail')) {
      return {
        code: TOOLKIT_ERROR_CODES.PROOF_GENERATION_FAILED,
        message: 'Failed to generate zero-knowledge proof',
        details: output,
        suggestion: 'Ensure the proof server is running and accessible',
      };
    }

    // Transaction failed
    if (lowerOutput.includes('transaction') && lowerOutput.includes('fail')) {
      return {
        code: TOOLKIT_ERROR_CODES.TRANSACTION_FAILED,
        message: 'Transaction failed',
        details: output,
      };
    }

    // Unknown error
    return {
      code: TOOLKIT_ERROR_CODES.UNKNOWN,
      message: output.trim() || `Command failed with exit code ${exitCode}`,
      details: output,
    };
  }

  /**
   * Get the toolkit image being used
   */
  getImage(): string {
    return this.image;
  }
}
