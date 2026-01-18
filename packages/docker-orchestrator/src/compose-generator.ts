/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { stringify } from 'yaml';
import type {
  MidnightStackConfig,
  ComposeFile,
  ComposeService,
} from './types.js';
import { DEFAULT_IMAGES, DEFAULT_PORTS } from './types.js';

/**
 * Extended config with all port options
 */
interface StackPorts {
  nodeRpc?: number;
  nodeWs?: number;
  indexer?: number;
  proofServer?: number;
}

/**
 * Generate a docker-compose.yml file for the Midnight stack
 */
export class ComposeGenerator {
  private config: MidnightStackConfig;
  private ports: StackPorts;

  constructor(config: MidnightStackConfig = {}) {
    this.config = config;
    this.ports = {
      nodeRpc: DEFAULT_PORTS.nodeRpc,
      nodeWs: DEFAULT_PORTS.nodeWs,
      indexer: DEFAULT_PORTS.indexer,
      proofServer: DEFAULT_PORTS.proofServer,
      ...config.ports,
    };
  }

  /**
   * Get the project name
   */
  getProjectName(): string {
    return this.config.projectName ?? 'nightcap';
  }

  /**
   * Get the network name
   */
  getNetworkName(): string {
    return this.config.networkName ?? `${this.getProjectName()}_network`;
  }

  /**
   * Generate the complete compose file structure
   */
  generate(): ComposeFile {
    const projectName = this.getProjectName();
    const networkName = this.getNetworkName();

    return {
      services: {
        node: this.createNodeService(projectName, networkName),
        indexer: this.createIndexerService(projectName, networkName),
        'proof-server': this.createProofServerService(projectName, networkName),
      },
      networks: {
        [networkName]: {
          driver: 'bridge',
        },
      },
      volumes: {
        [`${projectName}_node_data`]: { driver: 'local' },
        [`${projectName}_indexer_data`]: { driver: 'local' },
      },
    };
  }

  /**
   * Generate compose file as YAML string
   */
  toYaml(): string {
    const compose = this.generate();
    return stringify(compose, {
      indent: 2,
      lineWidth: 120,
    });
  }

  /**
   * Get service URLs for display
   */
  getServiceUrls(): Record<string, string> {
    return {
      nodeRpc: `http://localhost:${this.ports.nodeRpc}`,
      nodeWs: `ws://localhost:${this.ports.nodeWs}`,
      indexer: `http://localhost:${this.ports.indexer}/api/v1/graphql`,
      proofServer: `http://localhost:${this.ports.proofServer}`,
    };
  }

  /**
   * Create the node service configuration
   */
  private createNodeService(projectName: string, networkName: string): ComposeService {
    const image = this.config.images?.node ?? DEFAULT_IMAGES.node;

    return {
      image,
      container_name: `${projectName}_node`,
      ports: [
        `${this.ports.nodeRpc}:9944`,
        `${this.ports.nodeWs}:9933`,
      ],
      volumes: [
        this.config.volumes?.nodeData ?? `${projectName}_node_data:/data`,
      ],
      environment: {
        RUST_LOG: 'info',
      },
      networks: [networkName],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'curl -sf http://localhost:9944/health || exit 1'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '40s',
      },
    };
  }

  /**
   * Create the indexer service configuration
   */
  private createIndexerService(projectName: string, networkName: string): ComposeService {
    const image = this.config.images?.indexer ?? DEFAULT_IMAGES.indexer;

    return {
      image,
      container_name: `${projectName}_indexer`,
      ports: [`${this.ports.indexer}:8080`],
      volumes: [
        this.config.volumes?.indexerData ?? `${projectName}_indexer_data:/data`,
      ],
      environment: {
        NODE_URL: `ws://${projectName}_node:9933`,
        RUST_LOG: 'info',
      },
      depends_on: ['node'],
      networks: [networkName],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'curl -sf http://localhost:8080/health || exit 1'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '30s',
      },
    };
  }

  /**
   * Create the proof server service configuration
   */
  private createProofServerService(projectName: string, networkName: string): ComposeService {
    const image = this.config.images?.proofServer ?? DEFAULT_IMAGES.proofServer;

    return {
      image,
      container_name: `${projectName}_proof_server`,
      ports: [`${this.ports.proofServer}:6300`],
      environment: {
        NODE_URL: `ws://${projectName}_node:9933`,
        RUST_LOG: 'info',
      },
      depends_on: ['node'],
      networks: [networkName],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'curl -sf http://localhost:6300/health || exit 1'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '60s',
      },
    };
  }
}
