/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'vitest';
import {
  toChangeBalance,
  toChangeBalances,
  type BalanceChangeExpectation,
} from './balance.js';
import {
  toEmitEvent,
  toEmitEventOrder,
  type EventMatcherOptions,
} from './events.js';
import {
  toBeReverted,
  toBeRevertedWith,
  toBeRevertedWithCustomError,
  toSucceed,
} from './reverts.js';
import {
  toBeValidProof,
  toVerifyWithInputs,
  toBeProofForCircuit,
  type ZkProof,
} from './proof.js';

// Re-export types
export type { BalanceChangeExpectation, EventMatcherOptions, ZkProof };

/**
 * Extend Vitest's expect with Nightcap matchers.
 *
 * Call this once in your test setup file:
 *
 * @example
 * ```typescript
 * // vitest.setup.ts
 * import { setupNightcapMatchers } from '@nightcap/test/matchers';
 *
 * setupNightcapMatchers();
 * ```
 */
export function setupNightcapMatchers(): void {
  expect.extend({
    // Balance matchers
    toChangeBalance,
    toChangeBalances,

    // Event matchers
    toEmitEvent,
    toEmitEventOrder,

    // Revert matchers
    toBeReverted,
    toBeRevertedWith,
    toBeRevertedWithCustomError,
    toSucceed,

    // Proof matchers
    toBeValidProof,
    toVerifyWithInputs,
    toBeProofForCircuit,
  });
}

// Also export individual matchers for direct use
export {
  // Balance
  toChangeBalance,
  toChangeBalances,
  // Events
  toEmitEvent,
  toEmitEventOrder,
  // Reverts
  toBeReverted,
  toBeRevertedWith,
  toBeRevertedWithCustomError,
  toSucceed,
  // Proofs
  toBeValidProof,
  toVerifyWithInputs,
  toBeProofForCircuit,
};

/**
 * TypeScript module augmentation for Vitest matchers.
 *
 * This adds type support for the custom matchers when using expect().
 */
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    /**
     * Check if a transaction changes the balance of an account.
     * @param account - The account to check
     * @param delta - Expected balance change (positive or negative)
     * @param balanceType - 'unshielded' (default) or 'shielded'
     */
    toChangeBalance(
      account: unknown,
      delta: bigint,
      balanceType?: 'unshielded' | 'shielded'
    ): Promise<void>;

    /**
     * Check if a transaction changes balances of multiple accounts.
     * @param accounts - The accounts to check
     * @param deltas - Expected balance changes for each account
     * @param balanceType - 'unshielded' (default) or 'shielded'
     */
    toChangeBalances(
      accounts: unknown[],
      deltas: bigint[],
      balanceType?: 'unshielded' | 'shielded'
    ): Promise<void>;

    /**
     * Check if a transaction emitted a specific event.
     * @param eventName - Name of the event
     * @param options - Optional contract and argument filters
     */
    toEmitEvent(eventName: string, options?: EventMatcherOptions): Promise<void>;

    /**
     * Check if events were emitted in a specific order.
     * @param eventNames - Expected event names in order
     */
    toEmitEventOrder(eventNames: string[]): Promise<void>;

    /**
     * Check if a transaction reverted.
     */
    toBeReverted(): Promise<void>;

    /**
     * Check if a transaction reverted with a specific reason.
     * @param reason - Expected revert reason (partial match)
     */
    toBeRevertedWith(reason: string): Promise<void>;

    /**
     * Check if a transaction reverted with a custom error.
     * @param errorName - Name of the custom error
     * @param args - Expected error arguments (optional)
     */
    toBeRevertedWithCustomError(
      errorName: string,
      args?: Record<string, unknown>
    ): Promise<void>;

    /**
     * Check that a transaction succeeded (did not revert).
     */
    toSucceed(): Promise<void>;

    /**
     * Check if a value is a valid ZK proof.
     */
    toBeValidProof(): void;

    /**
     * Check if a proof verifies with expected public inputs.
     * @param publicInputs - Expected public inputs
     */
    toVerifyWithInputs(publicInputs: unknown[]): Promise<void>;

    /**
     * Check if a proof was generated for a specific circuit.
     * @param circuitId - Expected circuit identifier
     */
    toBeProofForCircuit(circuitId: string): void;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface AsymmetricMatchersContaining<T = any> {
    toChangeBalance(
      account: unknown,
      delta: bigint,
      balanceType?: 'unshielded' | 'shielded'
    ): Promise<void>;
    toChangeBalances(
      accounts: unknown[],
      deltas: bigint[],
      balanceType?: 'unshielded' | 'shielded'
    ): Promise<void>;
    toEmitEvent(eventName: string, options?: EventMatcherOptions): Promise<void>;
    toEmitEventOrder(eventNames: string[]): Promise<void>;
    toBeReverted(): Promise<void>;
    toBeRevertedWith(reason: string): Promise<void>;
    toBeRevertedWithCustomError(
      errorName: string,
      args?: Record<string, unknown>
    ): Promise<void>;
    toSucceed(): Promise<void>;
    toBeValidProof(): void;
    toVerifyWithInputs(publicInputs: unknown[]): Promise<void>;
    toBeProofForCircuit(circuitId: string): void;
  }
}
