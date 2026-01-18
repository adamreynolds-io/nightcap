/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ToolkitConfig,
  ToolkitMode,
  ToolkitCommandOptions,
  ToolkitResult,
  ToolkitEndpoint,
  DeployInput,
  DeployResult,
  CallInput,
  CallResult,
  WalletInfo,
  TransactionInfo,
} from './types.js';
import { ToolkitDockerBridge } from './docker-bridge.js';
import { ToolkitNativeBridge } from './native-bridge.js';
import { logger } from '../utils/logger.js';
import type { NightcapConfig, NetworkConfig } from '../tasks/types.js';

/**
 * Unified toolkit interface that handles Docker and native execution
 */
export class Toolkit {
  private config: ToolkitConfig;
  private dockerBridge: ToolkitDockerBridge;
  private nativeBridge: ToolkitNativeBridge;
  private mode: ToolkitMode | null = null;

  constructor(config: ToolkitConfig = {}) {
    this.config = config;
    this.dockerBridge = new ToolkitDockerBridge(config);
    this.nativeBridge = new ToolkitNativeBridge(config);
  }

  /**
   * Create a Toolkit instance from Nightcap config and network
   */
  static fromConfig(config: NightcapConfig, network: NetworkConfig): Toolkit {
    return new Toolkit({
      image: config.docker?.images?.toolkit,
      workDir: process.cwd(),
    });
  }

  /**
   * Get the endpoint configuration from a network config
   */
  static getEndpoint(network: NetworkConfig): ToolkitEndpoint {
    return {
      nodeUrl: network.nodeUrl ?? 'http://localhost:9933',
      indexerUrl: network.indexerUrl ?? 'http://localhost:8088',
      proofServerUrl: network.proofServerUrl ?? 'http://localhost:6300',
    };
  }

  /**
   * Detect and return the best available execution mode
   */
  async detectMode(): Promise<ToolkitMode | null> {
    // If mode already detected, return it
    if (this.mode) {
      return this.mode;
    }

    // If mode is explicitly configured, use it
    if (this.config.mode) {
      this.mode = this.config.mode;
      return this.mode;
    }

    // Prefer Docker
    if (await this.dockerBridge.isDockerAvailable()) {
      // Check if image is available or can be pulled
      if (await this.dockerBridge.isImageAvailable()) {
        this.mode = 'docker';
        return this.mode;
      }

      logger.debug('Toolkit Docker image not found, will pull on first use');
      this.mode = 'docker';
      return this.mode;
    }

    // Fall back to native
    if (await this.nativeBridge.isAvailable()) {
      this.mode = 'native';
      return this.mode;
    }

    return null;
  }

  /**
   * Check if the toolkit is available
   */
  async isAvailable(): Promise<boolean> {
    const mode = await this.detectMode();
    return mode !== null;
  }

  /**
   * Get the current execution mode
   */
  getMode(): ToolkitMode | null {
    return this.mode;
  }

  /**
   * Ensure the toolkit is ready to use
   */
  async ensureReady(): Promise<void> {
    const mode = await this.detectMode();

    if (!mode) {
      throw new Error(
        'Toolkit not available. Install Docker or the midnight-node-toolkit binary.'
      );
    }

    if (mode === 'docker') {
      // Ensure image is available
      if (!await this.dockerBridge.isImageAvailable()) {
        logger.info('Pulling toolkit Docker image...');
        const success = await this.dockerBridge.pullImage();
        if (!success) {
          throw new Error('Failed to pull toolkit Docker image');
        }
      }
    }
  }

  /**
   * Execute a raw toolkit command
   */
  async execute<T = unknown>(
    command: string[],
    options: ToolkitCommandOptions & { volumeMounts?: string[] } = {}
  ): Promise<ToolkitResult<T>> {
    await this.ensureReady();

    if (this.mode === 'docker') {
      return this.dockerBridge.execute<T>(command, options);
    } else {
      return this.nativeBridge.execute<T>(command, options);
    }
  }

  /**
   * Deploy a contract
   */
  async deploy(
    input: DeployInput,
    endpoint: ToolkitEndpoint,
    options: ToolkitCommandOptions = {}
  ): Promise<ToolkitResult<DeployResult>> {
    const command = ['contract-simple', 'deploy'];

    // Add endpoint args
    command.push(...this.buildEndpointArgs(endpoint, 'source'));
    command.push(...this.buildEndpointArgs(endpoint, 'destination'));

    // Add artifact path
    command.push('--artifact', input.artifactPath);

    // Add output format
    command.push('--output', 'json');

    // Add constructor args if provided
    if (input.constructorArgs && input.constructorArgs.length > 0) {
      command.push('--args', JSON.stringify(input.constructorArgs));
    }

    return this.execute<DeployResult>(command, {
      ...options,
      source: endpoint,
      outputFormat: 'json',
    });
  }

  /**
   * Call a contract method
   */
  async call(
    input: CallInput,
    endpoint: ToolkitEndpoint,
    options: ToolkitCommandOptions = {}
  ): Promise<ToolkitResult<CallResult>> {
    const command = ['contract-simple', 'call'];

    // Add endpoint args
    command.push(...this.buildEndpointArgs(endpoint, 'source'));
    command.push(...this.buildEndpointArgs(endpoint, 'destination'));

    // Add contract address and method
    command.push('--address', input.contractAddress);
    command.push('--method', input.method);

    // Add output format
    command.push('--output', 'json');

    // Add args if provided
    if (input.args && input.args.length > 0) {
      command.push('--args', JSON.stringify(input.args));
    }

    return this.execute<CallResult>(command, {
      ...options,
      source: endpoint,
      outputFormat: 'json',
    });
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(
    address: string,
    endpoint: ToolkitEndpoint,
    options: ToolkitCommandOptions = {}
  ): Promise<ToolkitResult<WalletInfo>> {
    const command = ['wallet', 'info'];

    command.push('--address', address);
    command.push(...this.buildEndpointArgs(endpoint, 'source'));
    command.push('--output', 'json');

    return this.execute<WalletInfo>(command, {
      ...options,
      source: endpoint,
      outputFormat: 'json',
    });
  }

  /**
   * Get transaction information
   */
  async getTransaction(
    hash: string,
    endpoint: ToolkitEndpoint,
    options: ToolkitCommandOptions = {}
  ): Promise<ToolkitResult<TransactionInfo>> {
    const command = ['tx', 'info'];

    command.push('--hash', hash);
    command.push(...this.buildEndpointArgs(endpoint, 'source'));
    command.push('--output', 'json');

    return this.execute<TransactionInfo>(command, {
      ...options,
      source: endpoint,
      outputFormat: 'json',
    });
  }

  /**
   * Build endpoint arguments for toolkit commands
   */
  private buildEndpointArgs(
    endpoint: ToolkitEndpoint,
    prefix: 'source' | 'destination'
  ): string[] {
    if (this.mode === 'docker') {
      return this.dockerBridge.buildEndpointArgs(endpoint, prefix);
    } else {
      return this.nativeBridge.buildEndpointArgs(endpoint, prefix);
    }
  }
}
