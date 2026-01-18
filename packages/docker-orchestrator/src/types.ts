/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration for the Midnight Docker stack
 */
export interface MidnightStackConfig {
  /** Network name for the stack */
  networkName?: string;
  /** Project name prefix for containers */
  projectName?: string;
  /** Port mappings */
  ports?: {
    nodeRpc?: number;
    nodeWs?: number;
    indexer?: number;
    proofServer?: number;
  };
  /** Docker images to use */
  images?: {
    node?: string;
    indexer?: string;
    proofServer?: string;
  };
  /** Volume paths */
  volumes?: {
    nodeData?: string;
    indexerData?: string;
  };
}

/**
 * A compatible version set for the Midnight stack.
 * All components in a version set share the same ledger version
 * and are tested to work together.
 */
export interface VersionSet {
  /** Human-readable name for this version set */
  name: string;
  /** The ledger version that all components use */
  ledgerVersion: string;
  /** Component versions */
  images: {
    node: string;
    indexer: string;
    proofServer: string;
    toolkit: string;
  };
}

/**
 * Known compatible version sets.
 * IMPORTANT: All components in a set must use the same ledger version.
 * Using mismatched versions will cause failures.
 */
export const VERSION_SETS = {
  /**
   * Version set based on midnight-js/testkit-js
   * @see https://github.com/midnightntwrk/midnight-js/tree/main/testkit-js
   */
  'testkit-0.20.0': {
    name: 'Testkit 0.20.0',
    ledgerVersion: '7.0.0-rc.1',
    images: {
      node: 'ghcr.io/midnight-ntwrk/midnight-node:0.20.0-alpha.1',
      indexer: 'ghcr.io/midnight-ntwrk/indexer-standalone:3.0.0-alpha.22',
      proofServer: 'ghcr.io/midnight-ntwrk/proof-server:7.0.0-alpha.1',
      toolkit: 'ghcr.io/midnight-ntwrk/midnight-node-toolkit:0.20.0-alpha.1',
    },
  },
} as const satisfies Record<string, VersionSet>;

/**
 * The default version set to use
 */
export const DEFAULT_VERSION_SET = 'testkit-0.20.0' as const;

// Get the default version set config (guaranteed to exist since we use a literal type)
const defaultVersionSet = VERSION_SETS[DEFAULT_VERSION_SET];

/**
 * Default Midnight Docker images for the local stack (excluding toolkit).
 * These are the services that run continuously as part of `nightcap node`.
 *
 * IMPORTANT: These images are coupled by ledger version.
 * All components must use the same ledger version to be compatible.
 * Do not mix images from different version sets.
 */
export const DEFAULT_IMAGES = {
  node: defaultVersionSet.images.node,
  indexer: defaultVersionSet.images.indexer,
  proofServer: defaultVersionSet.images.proofServer,
} as const;

/**
 * Default toolkit image (run on-demand for commands, not part of the stack).
 *
 * IMPORTANT: Must match the ledger version of the stack components.
 */
export const DEFAULT_TOOLKIT_IMAGE = defaultVersionSet.images.toolkit;

/**
 * Default port mappings
 */
export const DEFAULT_PORTS = {
  nodeRpc: 9944,
  nodeWs: 9933,
  indexer: 8080,
  proofServer: 6300,
} as const;

/**
 * Container status information
 */
export interface ContainerStatus {
  /** Container name */
  name: string;
  /** Container ID */
  id: string;
  /** Current state (running, stopped, etc.) */
  state: 'running' | 'stopped' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead' | 'created';
  /** Image name */
  image: string;
  /** Health status if available */
  health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
  /** Port bindings */
  ports: Array<{
    container: number;
    host: number;
    protocol: 'tcp' | 'udp';
  }>;
  /** Container creation time */
  created: Date;
}

/**
 * Image pull progress event
 */
export interface ImagePullProgress {
  /** Image being pulled */
  image: string;
  /** Current status message */
  status: string;
  /** Progress details if available */
  progress?: {
    current: number;
    total: number;
  };
  /** Layer ID if applicable */
  layerId?: string;
}

/**
 * Result of a Docker operation
 */
export interface DockerOperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Docker compose service definition
 */
export interface ComposeService {
  image: string;
  container_name?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
  networks?: string[];
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  healthcheck?: {
    test: string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
}

/**
 * Docker compose file structure
 */
export interface ComposeFile {
  version?: string;
  services: Record<string, ComposeService>;
  networks?: Record<string, { driver?: string }>;
  volumes?: Record<string, { driver?: string }>;
}
