/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export DEFAULT_TOOLKIT_IMAGE from docker-orchestrator for single source of truth
export { DEFAULT_TOOLKIT_IMAGE } from '@nightcap/docker-orchestrator';

/**
 * Toolkit execution mode
 */
export type ToolkitMode = 'docker' | 'native';

/**
 * Toolkit configuration
 */
export interface ToolkitConfig {
  /** Docker image to use for toolkit */
  image?: string;
  /** Path to native toolkit binary (fallback) */
  binaryPath?: string;
  /** Preferred execution mode */
  mode?: ToolkitMode;
  /** Working directory for toolkit operations */
  workDir?: string;
}

/**
 * Source/Destination configuration for toolkit commands
 */
export interface ToolkitEndpoint {
  /** Node RPC URL */
  nodeUrl: string;
  /** Indexer URL */
  indexerUrl: string;
  /** Proof server URL */
  proofServerUrl: string;
}

/**
 * Common options for toolkit commands
 */
export interface ToolkitCommandOptions {
  /** Source endpoint */
  source?: ToolkitEndpoint;
  /** Destination endpoint */
  destination?: ToolkitEndpoint;
  /** Output format */
  outputFormat?: 'json' | 'text';
  /** Additional environment variables */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of a toolkit command execution
 */
export interface ToolkitResult<T = unknown> {
  /** Whether the command succeeded */
  success: boolean;
  /** Parsed output data */
  data?: T;
  /** Raw stdout */
  stdout: string;
  /** Raw stderr */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Contract deployment input
 */
export interface DeployInput {
  /** Path to compiled contract artifact */
  artifactPath: string;
  /** Contract constructor arguments */
  constructorArgs?: unknown[];
  /** Initial state values */
  initialState?: Record<string, unknown>;
}

/**
 * Contract deployment result
 */
export interface DeployResult {
  /** Deployed contract address */
  contractAddress: string;
  /** Transaction hash */
  transactionHash: string;
  /** Block number where deployed */
  blockNumber: number;
  /** Gas used */
  gasUsed?: string;
  /** Deployment timestamp */
  timestamp?: number;
}

/**
 * Contract call input
 */
export interface CallInput {
  /** Contract address */
  contractAddress: string;
  /** Method/circuit name */
  method: string;
  /** Method arguments */
  args?: unknown[];
}

/**
 * Contract call result
 */
export interface CallResult {
  /** Return value */
  returnValue?: unknown;
  /** Transaction hash (for state-changing calls) */
  transactionHash?: string;
  /** Block number */
  blockNumber?: number;
  /** Gas used */
  gasUsed?: string;
}

/**
 * Wallet balance info
 */
export interface WalletBalance {
  /** Unshielded (public) balance */
  unshielded: string;
  /** Shielded (private) balance */
  shielded: string;
  /** Total balance */
  total: string;
}

/**
 * Wallet info
 */
export interface WalletInfo {
  /** Wallet address */
  address: string;
  /** Public key */
  publicKey: string;
  /** Balance information */
  balance?: WalletBalance;
}

/**
 * Transaction info
 */
export interface TransactionInfo {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: number;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Sender address */
  from: string;
  /** Receiver address (if applicable) */
  to?: string;
  /** Gas used */
  gasUsed?: string;
  /** Timestamp */
  timestamp?: number;
}

/**
 * Toolkit error with parsed details
 */
export interface ToolkitError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Detailed error info */
  details?: string;
  /** Suggestion for resolution */
  suggestion?: string;
}

/**
 * Known toolkit error codes
 */
export const TOOLKIT_ERROR_CODES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  INVALID_ARTIFACT: 'INVALID_ARTIFACT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  PROOF_GENERATION_FAILED: 'PROOF_GENERATION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ToolkitErrorCode = (typeof TOOLKIT_ERROR_CODES)[keyof typeof TOOLKIT_ERROR_CODES];
