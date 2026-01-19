/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import type { NightcapPlugin, NightcapRuntimeEnvironment } from '@nightcap/core';
import type { MidnightJsConfig, MidnightProvider, MidnightNamespace } from './types.js';
import { createMidnightProvider, listAvailableContracts } from './provider.js';

/**
 * Global provider instance (singleton per network)
 */
const providerCache = new Map<string, MidnightProvider>();

/**
 * Network config for provider creation (subset of NetworkConfig)
 */
interface ProviderNetworkConfig {
  name?: string;
  nodeUrl?: string;
  indexerUrl?: string;
  proofServerUrl?: string;
  isLocal?: boolean;
}

/**
 * Get or create a Midnight provider for the given network
 */
export async function getMidnightProvider(
  networkName: string,
  network: ProviderNetworkConfig,
  config: { paths?: { artifacts?: string } },
  cwd: string = process.cwd()
): Promise<MidnightProvider> {
  // Check cache
  const cached = providerCache.get(networkName);
  if (cached) {
    return cached;
  }

  // Create new provider
  const artifactsDir = path.resolve(cwd, config.paths?.artifacts ?? 'artifacts');

  // Ensure name is set
  const networkConfig = {
    name: network.name ?? networkName,
    nodeUrl: network.nodeUrl,
    indexerUrl: network.indexerUrl,
    proofServerUrl: network.proofServerUrl,
    isLocal: network.isLocal,
  };

  const provider = await createMidnightProvider({
    network: networkConfig,
    networkName,
    config,
    artifactsDir,
  });

  providerCache.set(networkName, provider);
  return provider;
}

/**
 * Clear provider cache (useful for testing)
 */
export function clearProviderCache(): void {
  providerCache.clear();
}

/**
 * Midnight.js plugin for Nightcap
 *
 * Provides:
 * - Contract factories for deployment and interaction
 * - Blockchain query access via indexer
 * - ZK proof generation via proof server
 * - Encrypted private state storage
 */
export const midnightJsPlugin: NightcapPlugin = {
  id: 'midnight-js',
  npmPackage: '@nightcap/plugin-midnight-js',

  hookHandlers: {
    config: {
      /**
       * Extend config with midnight-js defaults
       */
      extendUserConfig(config) {
        const extended = { ...config };

        // Add default midnight-js config if not present
        const midnightJs = (config as { midnightJs?: MidnightJsConfig }).midnightJs ?? {};

        (extended as { midnightJs: MidnightJsConfig }).midnightJs = {
          indexerUrl: midnightJs.indexerUrl,
          proofServerUrl: midnightJs.proofServerUrl,
          privateStatePath: midnightJs.privateStatePath,
          zkConfigUrl: midnightJs.zkConfigUrl,
        };

        return extended;
      },

      /**
       * Validate midnight-js config
       */
      validateUserConfig(config) {
        const errors: string[] = [];
        const midnightJs = (config as { midnightJs?: MidnightJsConfig }).midnightJs;

        if (midnightJs) {
          // Validate URLs if provided
          if (midnightJs.indexerUrl && !isValidUrl(midnightJs.indexerUrl)) {
            errors.push(`midnightJs.indexerUrl must be a valid URL: ${midnightJs.indexerUrl}`);
          }
          if (midnightJs.proofServerUrl && !isValidUrl(midnightJs.proofServerUrl)) {
            errors.push(`midnightJs.proofServerUrl must be a valid URL: ${midnightJs.proofServerUrl}`);
          }
          if (midnightJs.zkConfigUrl && !isValidUrl(midnightJs.zkConfigUrl)) {
            errors.push(`midnightJs.zkConfigUrl must be a valid URL: ${midnightJs.zkConfigUrl}`);
          }
        }

        return errors;
      },
    },

    runtime: {
      /**
       * Extend the runtime environment with the midnight namespace.
       * This adds `env.midnight` for tasks to access.
       */
      extendEnvironment(env: NightcapRuntimeEnvironment) {
        // Get config and create namespace
        const config = env.config;
        const defaultNetworkName = config.defaultNetwork ?? 'localnet';
        const network = config.networks?.[defaultNetworkName];
        const artifactsDir = path.resolve(
          process.cwd(),
          config.paths?.artifacts ?? 'artifacts'
        );

        // Create the midnight namespace
        const midnight: MidnightNamespace = {
          async getProvider() {
            if (!network) {
              throw new Error(`Network '${defaultNetworkName}' not found in config`);
            }
            return getMidnightProvider(defaultNetworkName, network, config, process.cwd());
          },

          async getContractFactory(name: string) {
            const provider = await midnight.getProvider();
            return provider.getContractFactory(name);
          },

          async getContractAt(name: string, address: string) {
            const provider = await midnight.getProvider();
            return provider.getContractAt(name, address);
          },

          async listContracts() {
            return listAvailableContracts(artifactsDir);
          },

          clearCache() {
            clearProviderCache();
          },
        };

        // Add to environment
        (env as NightcapRuntimeEnvironment & { midnight: MidnightNamespace }).midnight =
          midnight;
      },

      /**
       * Initialize midnight-js provider when runtime is created
       */
      async created(_ctx) {
        // Provider is created lazily when needed
        // This hook can be used for initialization if needed
      },
    },
  },
};

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
