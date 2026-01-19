/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NetworkConfig, NightcapConfig } from '../tasks/types.js';

/**
 * Default local proof server URL.
 *
 * Proof servers MUST always run locally because they process private transaction
 * inputs. Sending private data to a remote proof server would compromise privacy.
 * Users must run `nightcap proof-server` when working with remote networks.
 */
export const DEFAULT_PROOF_SERVER_URL = 'http://localhost:6300';

/**
 * Default network configurations for Midnight blockchain
 */
export const DEFAULT_NETWORKS: Record<string, NetworkConfig> = {
  localnet: {
    name: 'localnet',
    indexerUrl: 'http://localhost:8088/api/v1/graphql',
    proofServerUrl: DEFAULT_PROOF_SERVER_URL,
    nodeUrl: 'http://localhost:9944',
    isLocal: true,
  },
  devnet: {
    name: 'devnet',
    indexerUrl: 'https://indexer.devnet.midnight.network/api/v1/graphql',
    proofServerUrl: DEFAULT_PROOF_SERVER_URL,
    nodeUrl: 'https://rpc.devnet.midnight.network',
    isLocal: false,
  },
  preview: {
    name: 'preview',
    indexerUrl: 'https://indexer.preview.midnight.network/api/v1/graphql',
    proofServerUrl: DEFAULT_PROOF_SERVER_URL,
    nodeUrl: 'https://rpc.preview.midnight.network',
    isLocal: false,
  },
  preprod: {
    name: 'preprod',
    indexerUrl: 'https://indexer.preprod.midnight.network/api/v1/graphql',
    proofServerUrl: DEFAULT_PROOF_SERVER_URL,
    nodeUrl: 'https://rpc.preprod.midnight.network',
    isLocal: false,
  },
  mainnet: {
    name: 'mainnet',
    indexerUrl: 'https://indexer.midnight.network/api/v1/graphql',
    proofServerUrl: DEFAULT_PROOF_SERVER_URL,
    nodeUrl: 'https://rpc.midnight.network',
    isLocal: false,
  },
};

/**
 * Default paths for project structure
 */
export const DEFAULT_PATHS = {
  artifacts: './artifacts',
  sources: './contracts',
  deploy: './deploy',
};

/**
 * Create a default configuration
 */
export function createDefaultConfig(): NightcapConfig {
  return {
    defaultNetwork: 'localnet',
    networks: { ...DEFAULT_NETWORKS },
    docker: {
      enabled: true,
    },
    paths: { ...DEFAULT_PATHS },
  };
}
