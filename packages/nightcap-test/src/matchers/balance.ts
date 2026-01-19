/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Balance, TestSigner, TestContract } from '../types.js';

/**
 * Get balance for an account or contract
 */
async function getBalance(
  target: TestSigner | TestContract | string
): Promise<Balance> {
  // This will be implemented using midnight-js provider
  // For now, return placeholder
  const address =
    typeof target === 'string' ? target : (target as TestSigner).address;
  console.log(`Getting balance for ${address}`);
  return { unshielded: 0n, shielded: 0n };
}

/**
 * Balance change expectation
 */
export interface BalanceChangeExpectation {
  account: TestSigner | TestContract | string;
  delta: bigint;
  type?: 'unshielded' | 'shielded' | 'both';
}

/**
 * Check if a transaction changes balances as expected.
 *
 * @example
 * ```typescript
 * await expect(token.send('transfer', [recipient, 100n]))
 *   .toChangeBalance(sender, -100n)
 *   .toChangeBalance(recipient, 100n);
 *
 * // Or with explicit balance type
 * await expect(tx).toChangeBalance(account, 50n, 'shielded');
 * ```
 */
export async function toChangeBalance(
  this: { isNot: boolean; utils: { printReceived: (v: unknown) => string } },
  received: Promise<unknown> | (() => Promise<unknown>),
  account: TestSigner | TestContract | string,
  expectedDelta: bigint,
  balanceType: 'unshielded' | 'shielded' = 'unshielded'
): Promise<{ pass: boolean; message: () => string }> {
  // Get balance before
  const balanceBefore = await getBalance(account);

  // Execute the transaction
  if (typeof received === 'function') {
    await received();
  } else {
    await received;
  }

  // Get balance after
  const balanceAfter = await getBalance(account);

  // Calculate actual delta
  const actualDelta =
    balanceType === 'shielded'
      ? balanceAfter.shielded - balanceBefore.shielded
      : balanceAfter.unshielded - balanceBefore.unshielded;

  const pass = this.isNot
    ? actualDelta !== expectedDelta
    : actualDelta === expectedDelta;

  const accountAddress =
    typeof account === 'string' ? account : (account as TestSigner).address;

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${balanceType} balance of ${accountAddress} not to change by ${expectedDelta}, but it did`
        : `Expected ${balanceType} balance of ${accountAddress} to change by ${expectedDelta}, but it changed by ${actualDelta}`,
  };
}

/**
 * Check if balances changed for multiple accounts.
 *
 * @example
 * ```typescript
 * await expect(token.send('transfer', [recipient, 100n]))
 *   .toChangeBalances(
 *     [sender, recipient],
 *     [-100n, 100n]
 *   );
 * ```
 */
export async function toChangeBalances(
  this: { isNot: boolean; utils: { printReceived: (v: unknown) => string } },
  received: Promise<unknown> | (() => Promise<unknown>),
  accounts: (TestSigner | TestContract | string)[],
  expectedDeltas: bigint[],
  balanceType: 'unshielded' | 'shielded' = 'unshielded'
): Promise<{ pass: boolean; message: () => string }> {
  if (accounts.length !== expectedDeltas.length) {
    throw new Error('accounts and expectedDeltas must have the same length');
  }

  // Get balances before
  const balancesBefore = await Promise.all(accounts.map(getBalance));

  // Execute the transaction
  if (typeof received === 'function') {
    await received();
  } else {
    await received;
  }

  // Get balances after
  const balancesAfter = await Promise.all(accounts.map(getBalance));

  // Check all deltas
  const results = accounts.map((account, i) => {
    const actualDelta =
      balanceType === 'shielded'
        ? balancesAfter[i].shielded - balancesBefore[i].shielded
        : balancesAfter[i].unshielded - balancesBefore[i].unshielded;
    const expectedDelta = expectedDeltas[i];
    const accountAddress =
      typeof account === 'string' ? account : (account as TestSigner).address;
    return {
      account: accountAddress,
      expected: expectedDelta,
      actual: actualDelta,
      pass: actualDelta === expectedDelta,
    };
  });

  const allPass = results.every((r) => r.pass);
  const pass = this.isNot ? !allPass : allPass;

  const failures = results.filter((r) => !r.pass);

  return {
    pass,
    message: () => {
      if (pass) {
        return `Expected balances not to change as specified, but they did`;
      }
      return failures
        .map(
          (f) =>
            `Expected ${balanceType} balance of ${f.account} to change by ${f.expected}, but it changed by ${f.actual}`
        )
        .join('\n');
    },
  };
}
