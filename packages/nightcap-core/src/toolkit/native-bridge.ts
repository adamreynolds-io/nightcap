/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform, arch } from 'node:os';
import type {
  ToolkitConfig,
  ToolkitCommandOptions,
  ToolkitResult,
  ToolkitEndpoint,
  ToolkitError,
} from './types.js';
import { TOOLKIT_ERROR_CODES } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Default timeout for toolkit commands (5 minutes)
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Get the default toolkit binary path
 */
function getDefaultBinaryPath(): string | null {
  // Check common installation locations
  const possiblePaths = [
    // Nightcap managed installation
    join(homedir(), '.nightcap', 'toolkit', 'midnight-node-toolkit'),
    // User bin
    join(homedir(), '.local', 'bin', 'midnight-node-toolkit'),
    // System paths (will be found via PATH)
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Check if a binary exists in PATH
 */
async function findInPath(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    const cmd = platform() === 'win32' ? 'where' : 'which';
    const proc = spawn(cmd, [name], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim().split('\n')[0] ?? null);
      } else {
        resolve(null);
      }
    });

    proc.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Bridge for executing toolkit commands via native binary
 */
export class ToolkitNativeBridge {
  private config: ToolkitConfig;
  private binaryPath: string | null = null;

  constructor(config: ToolkitConfig = {}) {
    this.config = config;
    this.binaryPath = config.binaryPath ?? null;
  }

  /**
   * Check if the native toolkit binary is available
   */
  async isAvailable(): Promise<boolean> {
    const path = await this.getBinaryPath();
    return path !== null;
  }

  /**
   * Get the path to the toolkit binary
   */
  async getBinaryPath(): Promise<string | null> {
    if (this.binaryPath) {
      return existsSync(this.binaryPath) ? this.binaryPath : null;
    }

    // Check configured path
    if (this.config.binaryPath && existsSync(this.config.binaryPath)) {
      this.binaryPath = this.config.binaryPath;
      return this.binaryPath;
    }

    // Check default paths
    const defaultPath = getDefaultBinaryPath();
    if (defaultPath) {
      this.binaryPath = defaultPath;
      return this.binaryPath;
    }

    // Check PATH
    const pathBinary = await findInPath('midnight-node-toolkit');
    if (pathBinary) {
      this.binaryPath = pathBinary;
      return this.binaryPath;
    }

    return null;
  }

  /**
   * Execute a toolkit command via native binary
   */
  async execute<T = unknown>(
    command: string[],
    options: ToolkitCommandOptions = {}
  ): Promise<ToolkitResult<T>> {
    const binaryPath = await this.getBinaryPath();
    if (!binaryPath) {
      return {
        success: false,
        stdout: '',
        stderr: '',
        exitCode: -1,
        error: 'Toolkit binary not found. Install the midnight-node-toolkit or use Docker.',
      };
    }

    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    // Build environment variables
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      ...options.env,
    };

    // Add endpoint configuration
    if (options.source) {
      env['MIDNIGHT_NODE_URL'] = options.source.nodeUrl;
      env['MIDNIGHT_INDEXER_URL'] = options.source.indexerUrl;
      env['MIDNIGHT_PROOF_SERVER_URL'] = options.source.proofServerUrl;
    }

    logger.debug(`Executing toolkit: ${binaryPath} ${command.join(' ')}`);

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn(binaryPath, command, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env,
        cwd: this.config.workDir ?? process.cwd(),
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
   * Build source/destination arguments for toolkit commands
   */
  buildEndpointArgs(
    endpoint: ToolkitEndpoint,
    prefix: 'source' | 'destination'
  ): string[] {
    const args: string[] = [];

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
}
