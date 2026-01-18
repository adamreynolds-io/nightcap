/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Network configuration for connecting to Midnight blockchain
 */
export interface NetworkConfig {
  /** Network identifier */
  name: string;
  /** Indexer URL for the network */
  indexerUrl?: string;
  /** Proof server URL */
  proofServerUrl?: string;
  /** Node URL for the network */
  nodeUrl?: string;
  /** Whether this is a local development network */
  isLocal?: boolean;
}

/**
 * Docker configuration for local development
 */
export interface DockerConfig {
  /** Whether to use Docker for local services */
  enabled?: boolean;
  /** Path to docker-compose file */
  composePath?: string;
  /** Docker images to use */
  images?: {
    node?: string;
    indexer?: string;
    proofServer?: string;
    toolkit?: string;
  };
  /** Port mappings for Docker services */
  ports?: {
    nodeRpc?: number;
    nodeWs?: number;
    indexer?: number;
    proofServer?: number;
  };
}

/**
 * Compact compiler configuration
 */
export interface CompactConfig {
  /** Compiler version to use */
  version?: string;
  /** Source files or patterns to compile */
  sources?: string[];
  /** Files or patterns to exclude */
  exclude?: string[];
}

/**
 * Main Nightcap configuration
 */
export interface NightcapConfig {
  /** Default network to use when none specified */
  defaultNetwork?: string;
  /** Network configurations */
  networks?: Record<string, NetworkConfig>;
  /** Docker configuration */
  docker?: DockerConfig;
  /** Compact compiler configuration */
  compact?: CompactConfig;
  /** Task overrides from plugins */
  tasks?: Record<string, Partial<TaskDefinition>>;
  /** Custom paths */
  paths?: {
    /** Directory for compiled contracts */
    artifacts?: string;
    /** Directory for source contracts */
    sources?: string;
    /** Directory for deployment scripts */
    deploy?: string;
  };
}

/**
 * Parameter definition for a task
 */
export interface TaskParamDefinition {
  /** Parameter type */
  type: 'string' | 'number' | 'boolean';
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is required */
  required?: boolean;
  /** Default value if not provided */
  default?: string | number | boolean;
}

/**
 * Context passed to task actions
 */
export interface TaskContext {
  /** Full configuration */
  config: NightcapConfig;
  /** Current network configuration */
  network: NetworkConfig;
  /** Name of the current network */
  networkName: string;
  /** Parameters passed to the task */
  params: Record<string, unknown>;
  /** Whether verbose output is enabled */
  verbose: boolean;
  /**
   * Run the original task when overriding a built-in task.
   * Only available when the current task overrides another task.
   */
  runSuper?: () => Promise<void>;
}

/**
 * Definition of a task
 */
export interface TaskDefinition {
  /** Unique name of the task */
  name: string;
  /** Description shown in help */
  description: string;
  /** Names of tasks that must run before this one */
  dependencies?: string[];
  /** Parameter definitions */
  params?: Record<string, TaskParamDefinition>;
  /** The task implementation */
  action: (context: TaskContext) => Promise<void>;
}

/**
 * Result of running a task
 */
export interface TaskResult {
  /** Name of the task */
  name: string;
  /** Whether the task succeeded */
  success: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Error if task failed */
  error?: Error;
}
