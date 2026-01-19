/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapConfig, NetworkConfig } from '@nightcap/core';
import type {
  NightcapTestContext,
  TestSigner,
  TestContract,
  DeployOptions,
  TimeHelpers,
} from './types.js';
import { setSnapshotFunctions, clearFixtureCache } from './fixtures.js';
import { setProvider, setSigners, time, duration } from './helpers.js';

/**
 * Provider interface used by the test context
 */
interface Provider {
  send(method: string, params: unknown[]): Promise<unknown>;
  getBlockNumber(): Promise<number>;
  getBlock(blockNumber: number): Promise<{ timestamp: number }>;
}

/**
 * Options for creating a test context
 */
export interface TestContextOptions {
  /** Nightcap configuration */
  config: NightcapConfig;
  /** Network name to use */
  networkName?: string;
  /** Provider instance */
  provider?: Provider;
  /** Available test signers */
  signers?: TestSigner[];
}

/**
 * Create a Nightcap test context.
 *
 * This sets up the test environment with providers, signers, and helpers.
 *
 * @example
 * ```typescript
 * import { createTestContext } from '@nightcap/test';
 * import config from './nightcap.config';
 *
 * const nightcap = await createTestContext({ config });
 *
 * describe('Counter', () => {
 *   it('should increment', async () => {
 *     const counter = await nightcap.deployContract('Counter', [0]);
 *     await counter.send('increment');
 *     expect(await counter.call('value')).toBe(1n);
 *   });
 * });
 * ```
 */
export async function createTestContext(
  options: TestContextOptions
): Promise<NightcapTestContext> {
  const { config, networkName = 'localnet' } = options;

  // Get network config
  const network = config.networks?.[networkName];
  if (!network) {
    throw new Error(`Network "${networkName}" not found in config`);
  }

  // Set up provider if provided
  if (options.provider) {
    setProvider(options.provider);

    // Set up snapshot functions
    setSnapshotFunctions(
      async () => {
        return (await options.provider!.send('evm_snapshot', [])) as string;
      },
      async (id: string) => {
        await options.provider!.send('evm_revert', [id]);
      }
    );
  }

  // Set up signers if provided
  if (options.signers) {
    setSigners(options.signers);
  }

  // Create the test context
  const context: NightcapTestContext = {
    config,
    network,
    networkName,

    async getSigners(): Promise<TestSigner[]> {
      if (!options.signers || options.signers.length === 0) {
        throw new Error(
          'No signers configured. Make sure to provide signers in createTestContext options.'
        );
      }
      return options.signers;
    },

    async deployContract<T = unknown>(
      name: string,
      args: unknown[] = [],
      deployOptions: DeployOptions = {}
    ): Promise<TestContract<T>> {
      // This will be implemented using midnight-js plugin
      // For now, throw a helpful error
      throw new Error(
        `deployContract requires @nightcap/plugin-midnight-js. Contract: ${name}, args: ${JSON.stringify(args)}, options: ${JSON.stringify(deployOptions)}`
      );
    },

    async getContractAt<T = unknown>(
      name: string,
      address: string
    ): Promise<TestContract<T>> {
      // This will be implemented using midnight-js plugin
      throw new Error(
        `getContractAt requires @nightcap/plugin-midnight-js. Contract: ${name}, address: ${address}`
      );
    },

    time,

    async mine(blocks = 1): Promise<void> {
      if (!options.provider) {
        throw new Error('No provider configured for mining');
      }
      for (let i = 0; i < blocks; i++) {
        await options.provider.send('evm_mine', []);
      }
    },

    async snapshot(): Promise<string> {
      if (!options.provider) {
        throw new Error('No provider configured for snapshots');
      }
      return (await options.provider.send('evm_snapshot', [])) as string;
    },

    async revert(snapshotId: string): Promise<void> {
      if (!options.provider) {
        throw new Error('No provider configured for snapshots');
      }
      await options.provider.send('evm_revert', [snapshotId]);
    },
  };

  return context;
}

/**
 * Reset the test context between test files.
 *
 * Call this in a global teardown or beforeAll to ensure clean state.
 */
export function resetTestContext(): void {
  clearFixtureCache();
}

// Re-export duration constants
export { duration };

// Re-export time helpers type
export type { TimeHelpers };
