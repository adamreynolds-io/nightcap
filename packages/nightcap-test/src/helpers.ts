/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TestSigner,
  TestContract,
  TimeHelpers,
  DeployOptions,
  TransactionReceipt,
  TransactionEvent,
} from './types.js';

/**
 * Provider interface for test helpers
 */
interface TestProvider {
  send(method: string, params: unknown[]): Promise<unknown>;
  getBlockNumber(): Promise<number>;
  getBlock(blockNumber: number): Promise<{ timestamp: number }>;
}

/**
 * Internal state for test helpers
 */
let currentProvider: TestProvider | undefined;
let signers: TestSigner[] = [];

/**
 * Set the provider for test helpers
 */
export function setProvider(provider: TestProvider): void {
  currentProvider = provider;
}

/**
 * Set available signers for tests
 */
export function setSigners(testSigners: TestSigner[]): void {
  signers = testSigners;
}

/**
 * Get the current provider
 */
export function getProvider(): TestProvider {
  if (!currentProvider) {
    throw new Error(
      'No provider configured. Make sure tests are running with Nightcap test context.'
    );
  }
  return currentProvider;
}

/**
 * Get funded test signers/accounts.
 *
 * @example
 * ```typescript
 * const [owner, user1, user2] = await getSigners();
 * ```
 */
export async function getSigners(): Promise<TestSigner[]> {
  if (signers.length === 0) {
    throw new Error(
      'No signers configured. Make sure tests are running with Nightcap test context.'
    );
  }
  return signers;
}

/**
 * Deploy a contract by name.
 *
 * @param name - Contract name (from compilation artifacts)
 * @param args - Constructor arguments
 * @param options - Deployment options
 *
 * @example
 * ```typescript
 * const counter = await deployContract('Counter', [0]);
 * const token = await deployContract('Token', ['Test', 'TST'], { from: owner });
 * ```
 */
export async function deployContract<T = unknown>(
  name: string,
  args: unknown[] = [],
  options: DeployOptions = {}
): Promise<TestContract<T>> {
  // This will be implemented by the test context using midnight-js
  // For now, throw an error indicating it needs to be set up
  throw new Error(
    `deployContract not yet implemented. Contract: ${name}, args: ${JSON.stringify(args)}, options: ${JSON.stringify(options)}`
  );
}

/**
 * Get a contract instance at a specific address.
 *
 * @param name - Contract name (for ABI lookup)
 * @param address - Contract address
 *
 * @example
 * ```typescript
 * const token = await getContractAt('Token', '0x...');
 * ```
 */
export async function getContractAt<T = unknown>(
  name: string,
  address: string
): Promise<TestContract<T>> {
  // This will be implemented by the test context using midnight-js
  throw new Error(
    `getContractAt not yet implemented. Contract: ${name}, address: ${address}`
  );
}

/**
 * Mine a specified number of blocks.
 *
 * @param blocks - Number of blocks to mine (default: 1)
 *
 * @example
 * ```typescript
 * await mine(); // Mine 1 block
 * await mine(10); // Mine 10 blocks
 * ```
 */
export async function mine(blocks = 1): Promise<void> {
  const provider = getProvider();
  for (let i = 0; i < blocks; i++) {
    await provider.send('evm_mine', []);
  }
}

/**
 * Time manipulation helpers for testing time-dependent contracts.
 */
export const time: TimeHelpers = {
  /**
   * Increase the blockchain time by a number of seconds.
   *
   * @example
   * ```typescript
   * await time.increase(3600); // Advance 1 hour
   * ```
   */
  async increase(seconds: number): Promise<void> {
    const provider = getProvider();
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
  },

  /**
   * Set the timestamp for the next block.
   *
   * @example
   * ```typescript
   * await time.setNextBlockTimestamp(Date.now() / 1000 + 86400);
   * ```
   */
  async setNextBlockTimestamp(timestamp: number): Promise<void> {
    const provider = getProvider();
    await provider.send('evm_setNextBlockTimestamp', [timestamp]);
  },

  /**
   * Get the timestamp of the latest block.
   *
   * @example
   * ```typescript
   * const now = await time.latest();
   * ```
   */
  async latest(): Promise<number> {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
  },
};

/**
 * Take a snapshot of the current blockchain state.
 *
 * @returns Snapshot ID
 *
 * @example
 * ```typescript
 * const snapshotId = await snapshot();
 * // ... make changes ...
 * await revert(snapshotId);
 * ```
 */
export async function snapshot(): Promise<string> {
  const provider = getProvider();
  const snapshotId = (await provider.send('evm_snapshot', [])) as string;
  return snapshotId;
}

/**
 * Revert to a previous snapshot.
 *
 * @param snapshotId - Snapshot ID to revert to
 *
 * @example
 * ```typescript
 * await revert(snapshotId);
 * ```
 */
export async function revert(snapshotId: string): Promise<void> {
  const provider = getProvider();
  await provider.send('evm_revert', [snapshotId]);
}

/**
 * Parse events from a transaction receipt.
 */
export function parseEvents(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _receipt: TransactionReceipt,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _contractInterface: unknown
): TransactionEvent[] {
  // This will parse raw logs into typed events
  // Implementation depends on midnight-js contract interface
  return [];
}

/**
 * Duration constants for time manipulation (in seconds).
 *
 * @example
 * ```typescript
 * await time.increase(duration.hours(2));
 * await time.increase(duration.days(7));
 * ```
 */
export const duration = {
  seconds: (n: number) => n,
  minutes: (n: number) => n * 60,
  hours: (n: number) => n * 60 * 60,
  days: (n: number) => n * 60 * 60 * 24,
  weeks: (n: number) => n * 60 * 60 * 24 * 7,
};
