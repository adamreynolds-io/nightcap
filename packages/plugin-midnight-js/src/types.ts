/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapConfig, NetworkConfig } from '@nightcap/core';

/**
 * Configuration for the midnight-js plugin
 */
export interface MidnightJsConfig {
  /** Indexer URL (for blockchain queries) */
  indexerUrl?: string;
  /** Proof server URL (for ZK proof generation) */
  proofServerUrl?: string;
  /** Private state storage path */
  privateStatePath?: string;
  /** ZK config URL (for circuit artifacts) */
  zkConfigUrl?: string;
}

/**
 * Extended Nightcap config with midnight-js settings
 */
export interface NightcapConfigWithMidnightJs extends NightcapConfig {
  midnightJs?: MidnightJsConfig;
}

/**
 * Network ID type
 */
export type NetworkId = 'undeployed' | 'devnet' | 'testnet' | 'mainnet';

/**
 * Contract artifact loaded from compiled output
 */
export interface ContractArtifact {
  /** Contract name */
  name: string;
  /** Contract module (compiled output) */
  module: unknown;
  /** Circuit keys path */
  circuitKeysPath?: string;
}

/**
 * Contract deployment result
 */
export interface DeployedContract<T = unknown> {
  /** Contract address */
  address: string;
  /** Contract instance */
  contract: T;
  /** Transaction hash */
  deployTxHash?: string;
}

/**
 * Contract factory for deploying contracts
 */
export interface ContractFactory<T = unknown> {
  /** Contract name */
  name: string;
  /** Deploy the contract */
  deploy(args?: unknown[]): Promise<DeployedContract<T>>;
  /** Connect to an existing contract at address */
  attach(address: string): Promise<T>;
}

/**
 * Balance information
 */
export interface Balance {
  /** Unshielded (public) balance */
  unshielded: bigint;
  /** Shielded (private) balance */
  shielded: bigint;
}

/**
 * Block information
 */
export interface BlockInfo {
  /** Block number */
  number: number;
  /** Block hash */
  hash: string;
  /** Block timestamp */
  timestamp: number;
  /** Parent block hash */
  parentHash: string;
}

/**
 * Transaction information
 */
export interface TransactionInfo {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: number;
  /** From address */
  from: string;
  /** To address (if applicable) */
  to?: string;
  /** Transaction status */
  status: 'pending' | 'success' | 'failed';
}

/**
 * Provider interface for blockchain queries
 */
export interface IndexerProvider {
  /** Get account balance */
  getBalance(address: string): Promise<Balance>;
  /** Get block by number */
  getBlock(number?: number): Promise<BlockInfo>;
  /** Get transaction by hash */
  getTransaction(hash: string): Promise<TransactionInfo>;
  /** Query contract state */
  queryContractState(address: string, query: unknown): Promise<unknown>;
}

/**
 * Provider interface for proof generation
 */
export interface ProofProvider {
  /** Generate a proof for a transaction */
  generateProof(circuitId: string, inputs: unknown): Promise<unknown>;
  /** Check if proof server is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Provider interface for private state
 */
export interface PrivateStateProvider {
  /** Get private state for a contract */
  getState(contractAddress: string): Promise<unknown>;
  /** Set private state for a contract */
  setState(contractAddress: string, state: unknown): Promise<void>;
  /** Clear private state for a contract */
  clearState(contractAddress: string): Promise<void>;
}

/**
 * Provider interface for ZK configuration
 */
export interface ZkConfigProvider {
  /** Fetch ZK circuit configuration */
  fetchConfig(circuitId: string): Promise<unknown>;
  /** Get circuit keys path */
  getCircuitKeysPath(): string;
}

/**
 * Midnight provider combining all sub-providers
 */
export interface MidnightProvider {
  /** Indexer for blockchain queries */
  indexer: IndexerProvider;
  /** Proof server for ZK proof generation */
  proofServer: ProofProvider;
  /** Private state storage */
  privateState: PrivateStateProvider;
  /** ZK config provider */
  zkConfig: ZkConfigProvider;

  /** Get contract factory by name */
  getContractFactory<T = unknown>(name: string): Promise<ContractFactory<T>>;
  /** Get contract instance at address */
  getContractAt<T = unknown>(name: string, address: string): Promise<T>;

  /** Current network ID */
  networkId: NetworkId;
  /** Network configuration */
  network: NetworkConfig;
}

/**
 * Options for creating a Midnight provider
 */
export interface CreateProviderOptions {
  /** Network configuration */
  network: NetworkConfig;
  /** Network name */
  networkName: string;
  /** Nightcap configuration */
  config: NightcapConfig;
  /** Artifacts directory path */
  artifactsDir: string;
}

/**
 * Midnight namespace added to the runtime environment.
 * Access via context.env.midnight in tasks.
 *
 * @example
 * ```typescript
 * // In a task
 * const { midnight } = context.env;
 * const factory = await midnight.getContractFactory('MyContract');
 * const deployed = await factory.deploy();
 * ```
 */
export interface MidnightNamespace {
  /**
   * Get the Midnight provider for the current network.
   * Provider is created lazily and cached.
   */
  getProvider(): Promise<MidnightProvider>;

  /**
   * Get a contract factory by name.
   * Shorthand for `(await getProvider()).getContractFactory(name)`.
   */
  getContractFactory<T = unknown>(name: string): Promise<ContractFactory<T>>;

  /**
   * Get a contract instance at the given address.
   * Shorthand for `(await getProvider()).getContractAt(name, address)`.
   */
  getContractAt<T = unknown>(name: string, address: string): Promise<T>;

  /**
   * List all available compiled contracts.
   */
  listContracts(): Promise<string[]>;

  /**
   * Clear the provider cache (useful for testing).
   */
  clearCache(): void;
}
