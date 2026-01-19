/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 *
 * @nightcap/test - Testing utilities for Nightcap smart contracts
 *
 * This package provides testing utilities, fixtures, and custom Vitest matchers
 * for testing Midnight smart contracts.
 *
 * @example
 * ```typescript
 * import { createTestContext, loadFixture } from '@nightcap/test';
 * import { setupNightcapMatchers } from '@nightcap/test/matchers';
 * import { describe, it, expect, beforeAll } from 'vitest';
 *
 * // Set up custom matchers
 * setupNightcapMatchers();
 *
 * describe('Token', () => {
 *   async function deployFixture() {
 *     const nightcap = await createTestContext({ config });
 *     const [owner, user] = await nightcap.getSigners();
 *     const token = await nightcap.deployContract('Token', ['Test', 'TST']);
 *     return { nightcap, token, owner, user };
 *   }
 *
 *   it('should transfer tokens', async () => {
 *     const { token, owner, user } = await loadFixture(deployFixture);
 *
 *     await expect(token.send('transfer', [user.address, 100n]))
 *       .toEmitEvent('Transfer')
 *       .toChangeBalances([owner, user], [-100n, 100n]);
 *   });
 *
 *   it('should fail on insufficient balance', async () => {
 *     const { token, user } = await loadFixture(deployFixture);
 *
 *     await expect(token.connect(user).send('transfer', [owner.address, 1000n]))
 *       .toBeRevertedWith('Insufficient balance');
 *   });
 * });
 * ```
 */

// Types
export type {
  TestSigner,
  TestContract,
  Balance,
  TransactionReceipt,
  TransactionEvent,
  NightcapTestContext,
  DeployOptions,
  TimeHelpers,
  TestConfig,
  TestResult,
  IndividualTestResult,
  FixtureFunction,
} from './types.js';

// Context
export {
  createTestContext,
  resetTestContext,
  duration,
  type TestContextOptions,
} from './context.js';

// Fixtures
export {
  loadFixture,
  createFixture,
  setSnapshotFunctions,
  clearFixtureCache,
} from './fixtures.js';

// Helpers
export {
  getSigners,
  deployContract,
  getContractAt,
  mine,
  time,
  snapshot,
  revert,
  setProvider,
  setSigners,
} from './helpers.js';
