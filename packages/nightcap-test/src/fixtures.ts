/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FixtureFunction } from './types.js';

/**
 * Cache for fixture results and snapshots
 */
interface FixtureCache<T> {
  result: T;
  snapshotId: string;
}

/**
 * Global fixture cache keyed by fixture function reference
 */
const fixtureCache = new Map<FixtureFunction<unknown>, FixtureCache<unknown>>();

/**
 * Snapshot function - will be set by the test context
 */
let snapshotFn: (() => Promise<string>) | undefined;
let revertFn: ((id: string) => Promise<void>) | undefined;

/**
 * Set the snapshot/revert functions from the test context
 */
export function setSnapshotFunctions(
  snapshot: () => Promise<string>,
  revert: (id: string) => Promise<void>
): void {
  snapshotFn = snapshot;
  revertFn = revert;
}

/**
 * Clear the fixture cache - call between test files
 */
export function clearFixtureCache(): void {
  fixtureCache.clear();
}

/**
 * Load a fixture, caching the result and using snapshots for isolation.
 *
 * On first call:
 * 1. Execute the fixture function
 * 2. Take a snapshot of the resulting state
 * 3. Cache the result and snapshot ID
 *
 * On subsequent calls:
 * 1. Revert to the cached snapshot
 * 2. Return the cached result
 *
 * This provides test isolation while avoiding re-running expensive setup.
 *
 * @example
 * ```typescript
 * async function deployFixture() {
 *   const counter = await nightcap.deployContract('Counter', [0]);
 *   return { counter };
 * }
 *
 * it('test 1', async () => {
 *   const { counter } = await loadFixture(deployFixture);
 *   // counter is freshly deployed
 * });
 *
 * it('test 2', async () => {
 *   const { counter } = await loadFixture(deployFixture);
 *   // counter is restored to post-deployment state (not re-deployed)
 * });
 * ```
 */
export async function loadFixture<T>(fixture: FixtureFunction<T>): Promise<T> {
  // Check if we have this fixture cached
  const cached = fixtureCache.get(fixture as FixtureFunction<unknown>);

  if (cached) {
    // Revert to the cached snapshot to restore state
    if (revertFn && cached.snapshotId) {
      await revertFn(cached.snapshotId);
      // Take a new snapshot after revert (snapshot is consumed on revert)
      if (snapshotFn) {
        cached.snapshotId = await snapshotFn();
      }
    }
    return cached.result as T;
  }

  // First time - execute the fixture
  const result = await fixture();

  // Take a snapshot of the resulting state
  let snapshotId = '';
  if (snapshotFn) {
    snapshotId = await snapshotFn();
  }

  // Cache the result and snapshot
  fixtureCache.set(fixture as FixtureFunction<unknown>, {
    result,
    snapshotId,
  });

  return result;
}

/**
 * Create a fixture that depends on another fixture.
 *
 * @example
 * ```typescript
 * const deployToken = async () => {
 *   return await nightcap.deployContract('Token', ['Test', 'TST']);
 * };
 *
 * const deployExchange = createFixture(async () => {
 *   const token = await loadFixture(deployToken);
 *   const exchange = await nightcap.deployContract('Exchange', [token.address]);
 *   return { token, exchange };
 * });
 * ```
 */
export function createFixture<T>(fn: FixtureFunction<T>): FixtureFunction<T> {
  return fn;
}
