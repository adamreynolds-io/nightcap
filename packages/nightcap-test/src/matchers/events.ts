/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TransactionReceipt, TestContract } from '../types.js';

/**
 * Event matcher options
 */
export interface EventMatcherOptions {
  /** Contract that should emit the event */
  contract?: TestContract;
  /** Expected event arguments (partial match) */
  args?: Record<string, unknown>;
}

/**
 * Check if a transaction emitted a specific event.
 *
 * @example
 * ```typescript
 * // Basic usage
 * await expect(token.send('transfer', [recipient, 100n]))
 *   .toEmitEvent('Transfer');
 *
 * // With specific contract
 * await expect(exchange.send('swap', [tokenA, tokenB, 100n]))
 *   .toEmitEvent('Swap', { contract: exchange });
 *
 * // With expected arguments
 * await expect(token.send('transfer', [recipient, 100n]))
 *   .toEmitEvent('Transfer', { args: { to: recipient, amount: 100n } });
 * ```
 */
export async function toEmitEvent(
  this: { isNot: boolean; utils: { printReceived: (v: unknown) => string } },
  received: Promise<TransactionReceipt>,
  eventName: string,
  options: EventMatcherOptions = {}
): Promise<{ pass: boolean; message: () => string }> {
  const receipt = await received;

  // Find matching events
  const matchingEvents = receipt.events.filter((event) => {
    // Check event name
    if (event.name !== eventName) {
      return false;
    }

    // Check contract address if specified
    if (options.contract && event.address !== options.contract.address) {
      return false;
    }

    // Check arguments if specified
    if (options.args) {
      for (const [key, expectedValue] of Object.entries(options.args)) {
        if (event.args[key] !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  });

  const pass = this.isNot
    ? matchingEvents.length === 0
    : matchingEvents.length > 0;

  return {
    pass,
    message: () => {
      if (this.isNot) {
        return `Expected transaction not to emit "${eventName}" event, but it did`;
      }

      const eventNames = receipt.events.map((e) => e.name).join(', ');
      if (receipt.events.length === 0) {
        return `Expected transaction to emit "${eventName}" event, but no events were emitted`;
      }

      if (options.contract) {
        return `Expected transaction to emit "${eventName}" event from ${options.contract.address}, but it didn't. Emitted events: ${eventNames}`;
      }

      if (options.args) {
        return `Expected transaction to emit "${eventName}" event with matching arguments, but it didn't. Emitted events: ${eventNames}`;
      }

      return `Expected transaction to emit "${eventName}" event, but it didn't. Emitted events: ${eventNames}`;
    },
  };
}

/**
 * Check if a transaction emitted events in a specific order.
 *
 * @example
 * ```typescript
 * await expect(exchange.send('swap', [...]))
 *   .toEmitEventOrder(['Approval', 'Transfer', 'Swap']);
 * ```
 */
export async function toEmitEventOrder(
  this: { isNot: boolean },
  received: Promise<TransactionReceipt>,
  eventNames: string[]
): Promise<{ pass: boolean; message: () => string }> {
  const receipt = await received;
  const actualEventNames = receipt.events.map((e) => e.name);

  // Check if events appear in order (not necessarily consecutive)
  let lastIndex = -1;
  let allInOrder = true;
  const missingOrOutOfOrder: string[] = [];

  for (const eventName of eventNames) {
    const index = actualEventNames.indexOf(eventName, lastIndex + 1);
    if (index === -1) {
      allInOrder = false;
      missingOrOutOfOrder.push(eventName);
    } else {
      lastIndex = index;
    }
  }

  const pass = this.isNot ? !allInOrder : allInOrder;

  return {
    pass,
    message: () => {
      if (pass) {
        return `Expected events not to be emitted in order [${eventNames.join(', ')}], but they were`;
      }
      return `Expected events to be emitted in order [${eventNames.join(', ')}], but got [${actualEventNames.join(', ')}]. Missing or out of order: [${missingOrOutOfOrder.join(', ')}]`;
    },
  };
}
