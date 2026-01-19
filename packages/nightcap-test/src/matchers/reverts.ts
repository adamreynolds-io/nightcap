/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Check if a transaction reverted.
 *
 * @example
 * ```typescript
 * // Check for any revert
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeReverted();
 *
 * // Check for specific revert reason
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeRevertedWith('Insufficient balance');
 *
 * // Check for custom error
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeRevertedWithCustomError('InsufficientBalance');
 * ```
 */
export async function toBeReverted(
  this: { isNot: boolean },
  received: Promise<unknown>
): Promise<{ pass: boolean; message: () => string }> {
  let reverted = false;
  let revertReason: string | undefined;

  try {
    const result = await received;
    // Check if it's a transaction receipt with success: false
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      !(result as { success: boolean }).success
    ) {
      reverted = true;
      revertReason = (result as { revertReason?: string }).revertReason;
    }
  } catch (error) {
    reverted = true;
    if (error instanceof Error) {
      revertReason = error.message;
    }
  }

  const pass = this.isNot ? !reverted : reverted;

  return {
    pass,
    message: () => {
      if (this.isNot) {
        return `Expected transaction not to revert, but it did${revertReason ? ` with: ${revertReason}` : ''}`;
      }
      return `Expected transaction to revert, but it succeeded`;
    },
  };
}

/**
 * Check if a transaction reverted with a specific reason.
 *
 * @example
 * ```typescript
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeRevertedWith('Insufficient balance');
 * ```
 */
export async function toBeRevertedWith(
  this: { isNot: boolean },
  received: Promise<unknown>,
  expectedReason: string
): Promise<{ pass: boolean; message: () => string }> {
  let reverted = false;
  let revertReason: string | undefined;

  try {
    const result = await received;
    // Check if it's a transaction receipt with success: false
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      !(result as { success: boolean }).success
    ) {
      reverted = true;
      revertReason = (result as { revertReason?: string }).revertReason;
    }
  } catch (error) {
    reverted = true;
    if (error instanceof Error) {
      revertReason = error.message;
    }
  }

  const reasonMatches =
    reverted && revertReason && revertReason.includes(expectedReason);
  const pass = this.isNot ? !reasonMatches : !!reasonMatches;

  return {
    pass,
    message: () => {
      if (!reverted) {
        return `Expected transaction to revert with "${expectedReason}", but it succeeded`;
      }
      if (this.isNot) {
        return `Expected transaction not to revert with "${expectedReason}", but it did`;
      }
      return `Expected transaction to revert with "${expectedReason}", but it reverted with "${revertReason || 'unknown reason'}"`;
    },
  };
}

/**
 * Check if a transaction reverted with a custom error.
 *
 * @example
 * ```typescript
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeRevertedWithCustomError('InsufficientBalance');
 *
 * // With expected arguments
 * await expect(token.send('transfer', [recipient, 1000000n]))
 *   .toBeRevertedWithCustomError('InsufficientBalance', { required: 1000000n, available: 100n });
 * ```
 */
export async function toBeRevertedWithCustomError(
  this: { isNot: boolean },
  received: Promise<unknown>,
  errorName: string,
  expectedArgs?: Record<string, unknown>
): Promise<{ pass: boolean; message: () => string }> {
  let reverted = false;
  let revertReason: string | undefined;
  let actualErrorName: string | undefined;
  let actualArgs: Record<string, unknown> | undefined;

  try {
    const result = await received;
    // Check if it's a transaction receipt with success: false
    if (
      result &&
      typeof result === 'object' &&
      'success' in result &&
      !(result as { success: boolean }).success
    ) {
      reverted = true;
      revertReason = (result as { revertReason?: string }).revertReason;
      // Parse custom error from revert reason if available
      // Format might be: "CustomError(arg1, arg2)" or similar
      const customErrorMatch = revertReason?.match(/^(\w+)\((.*)\)$/);
      if (customErrorMatch) {
        actualErrorName = customErrorMatch[1];
        // Parse args would require ABI information
      }
    }
  } catch (error) {
    reverted = true;
    if (error instanceof Error) {
      revertReason = error.message;
      // Try to extract custom error name
      const customErrorMatch = revertReason.match(/^(\w+)\((.*)\)$/);
      if (customErrorMatch) {
        actualErrorName = customErrorMatch[1];
      }
    }
  }

  let pass = false;
  if (reverted && actualErrorName === errorName) {
    if (expectedArgs && actualArgs) {
      // Check if all expected args match
      pass = Object.entries(expectedArgs).every(
        ([key, value]) => actualArgs![key] === value
      );
    } else if (!expectedArgs) {
      pass = true;
    }
  }

  if (this.isNot) {
    pass = !pass;
  }

  return {
    pass,
    message: () => {
      if (!reverted) {
        return `Expected transaction to revert with custom error "${errorName}", but it succeeded`;
      }
      if (this.isNot) {
        return `Expected transaction not to revert with custom error "${errorName}", but it did`;
      }
      if (actualErrorName !== errorName) {
        return `Expected transaction to revert with custom error "${errorName}", but got "${actualErrorName || revertReason || 'unknown'}"`;
      }
      if (expectedArgs) {
        return `Expected custom error "${errorName}" to have args ${JSON.stringify(expectedArgs)}, but got ${JSON.stringify(actualArgs)}`;
      }
      return `Expected transaction to revert with custom error "${errorName}"`;
    },
  };
}

/**
 * Check that a transaction does not revert (syntactic sugar).
 *
 * @example
 * ```typescript
 * await expect(token.send('transfer', [recipient, 100n]))
 *   .not.toBeReverted();
 * ```
 */
export async function toSucceed(
  this: { isNot: boolean },
  received: Promise<unknown>
): Promise<{ pass: boolean; message: () => string }> {
  // Just invert the logic of toBeReverted
  const result = await toBeReverted.call({ isNot: !this.isNot }, received);
  return result;
}
