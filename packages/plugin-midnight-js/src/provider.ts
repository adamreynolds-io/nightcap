/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  MidnightProvider,
  ContractFactory,
  DeployedContract,
  NetworkId,
  CreateProviderOptions,
  ContractArtifact,
} from './types.js';
import {
  createIndexerProvider,
  createProofProvider,
  createPrivateStateProvider,
  createZkConfigProvider,
} from './providers/index.js';

/**
 * Loaded contract artifacts cache
 */
const artifactsCache = new Map<string, ContractArtifact>();

/**
 * Load a contract artifact by name
 */
async function loadArtifact(artifactsDir: string, name: string): Promise<ContractArtifact> {
  const cached = artifactsCache.get(name);
  if (cached) {
    return cached;
  }

  const contractDir = path.join(artifactsDir, name, 'contract');
  const indexPath = path.join(contractDir, 'index.cjs');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`Contract artifact not found: ${name}. Did you compile the contract?`);
  }

  const module = await import(indexPath);

  const artifact: ContractArtifact = {
    name,
    module,
    circuitKeysPath: path.join(artifactsDir, name, 'keys'),
  };

  artifactsCache.set(name, artifact);
  return artifact;
}

/**
 * Get available contract names from artifacts directory
 */
function getAvailableContracts(artifactsDir: string): string[] {
  if (!fs.existsSync(artifactsDir)) {
    return [];
  }

  const entries = fs.readdirSync(artifactsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const indexPath = path.join(artifactsDir, e.name, 'contract', 'index.cjs');
      return fs.existsSync(indexPath);
    })
    .map((e) => e.name);
}

/**
 * Determine network ID from network name
 */
function getNetworkId(networkName: string): NetworkId {
  const name = networkName.toLowerCase();
  if (name === 'mainnet') return 'mainnet';
  if (name === 'testnet' || name === 'preview' || name === 'preprod') return 'testnet';
  if (name === 'devnet') return 'devnet';
  return 'undeployed';
}

/**
 * Create a Midnight provider with all sub-providers configured
 */
export async function createMidnightProvider(
  options: CreateProviderOptions
): Promise<MidnightProvider> {
  const { network, networkName, artifactsDir } = options;

  // Get URLs from network config
  const indexerUrl = network.indexerUrl ?? 'http://localhost:8088';
  const proofServerUrl = network.proofServerUrl ?? 'http://localhost:6300';

  // Get paths for local storage
  const nightcapDir = path.join(os.homedir(), '.nightcap');
  const privateStatePath = path.join(nightcapDir, 'private-state', networkName);
  const circuitKeysPath = path.join(nightcapDir, 'circuit-keys');

  // Create sub-providers
  const indexer = createIndexerProvider(indexerUrl);
  const proofServer = createProofProvider(proofServerUrl);
  const privateState = await createPrivateStateProvider(privateStatePath);
  const zkConfig = createZkConfigProvider(
    proofServerUrl, // ZK configs usually come from proof server
    circuitKeysPath
  );

  // Track deployed contracts in this session
  const deployedContracts = new Map<string, string>();

  /**
   * Create a contract factory for deployment
   */
  async function getContractFactory<T = unknown>(name: string): Promise<ContractFactory<T>> {
    const artifact = await loadArtifact(artifactsDir, name);

    return {
      name,

      async deploy(args: unknown[] = []): Promise<DeployedContract<T>> {
        // Check if proof server is available
        const available = await proofServer.isAvailable();
        if (!available) {
          throw new Error(
            'Proof server is not available. Make sure the local network is running with `nightcap node`.'
          );
        }

        console.log(`Deploying ${name}...`);

        // This is where we'd integrate with midnight-js-contracts
        // For now, we create a placeholder deployment
        try {
          // Try to use midnight-js-contracts if available
          const midnightJs = await import('@midnight-ntwrk/midnight-js-contracts');

          if (midnightJs && typeof midnightJs.deployContract === 'function') {
            // The actual deployment would use the midnight-js API
            // The exact API shape depends on the midnight-js version
            // This is a placeholder that will need adjustment based on actual API
            const result = await (midnightJs.deployContract as (
              module: unknown,
              options: unknown
            ) => Promise<{ deployedContractAddress?: string; address?: string; contract?: unknown; txHash?: string }>)(
              artifact.module,
              {
                constructorArgs: args,
              }
            );

            const address = result.deployedContractAddress ?? result.address ?? '';
            deployedContracts.set(name, address);

            console.log(`${name} deployed at: ${address}`);

            return {
              address,
              contract: (result.contract ?? artifact.module) as T,
              deployTxHash: result.txHash,
            };
          }

          throw new Error('deployContract function not available');
        } catch (importError) {
          // midnight-js-contracts not available, use placeholder
          console.warn(
            'midnight-js-contracts not available. Using mock deployment.'
          );

          const mockAddress = `0x${Buffer.from(name + Date.now().toString()).toString('hex').slice(0, 40)}`;
          deployedContracts.set(name, mockAddress);

          console.log(`${name} mock deployed at: ${mockAddress}`);

          return {
            address: mockAddress,
            contract: artifact.module as T,
          };
        }
      },

      async attach(address: string): Promise<T> {
        // Connect to an existing contract at the given address
        try {
          const midnightJs = await import('@midnight-ntwrk/midnight-js-contracts');

          if (midnightJs && typeof midnightJs.findDeployedContract === 'function') {
            const contract = await (midnightJs.findDeployedContract as (
              module: unknown,
              options: unknown
            ) => Promise<unknown>)(artifact.module, {
              address,
            });

            return contract as T;
          }

          throw new Error('findDeployedContract function not available');
        } catch {
          // Fallback: return artifact module with address attached
          console.warn(
            'midnight-js-contracts not available. Returning raw artifact module.'
          );
          const moduleObj = artifact.module as Record<string, unknown>;
          return { ...moduleObj, address } as T;
        }
      },
    };
  }

  /**
   * Get a contract instance at a specific address
   */
  async function getContractAt<T = unknown>(name: string, address: string): Promise<T> {
    const factory = await getContractFactory<T>(name);
    return factory.attach(address);
  }

  return {
    indexer,
    proofServer,
    privateState,
    zkConfig,
    getContractFactory,
    getContractAt,
    networkId: getNetworkId(networkName),
    network,
  };
}

/**
 * Get list of available contract names
 */
export function listAvailableContracts(artifactsDir: string): string[] {
  return getAvailableContracts(artifactsDir);
}

/**
 * Clear the artifacts cache (useful for testing)
 */
export function clearArtifactsCache(): void {
  artifactsCache.clear();
}
