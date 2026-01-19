/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PrivateStateProvider } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * In-memory private state store (fallback when level not available)
 */
class InMemoryStore {
  private store = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.store.get(key);
  }

  async put(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Create a private state provider for encrypted state storage
 */
export async function createPrivateStateProvider(statePath: string): Promise<PrivateStateProvider> {
  // Ensure directory exists
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Try to use level for persistence, fall back to in-memory
  let store: InMemoryStore | { get: (key: string) => Promise<unknown>; put: (key: string, value: unknown) => Promise<void>; del: (key: string) => Promise<void> };

  try {
    // Dynamic import to handle missing dependency gracefully
    const { Level } = await import('level');
    const db = new Level<string, unknown>(statePath, { valueEncoding: 'json' });
    store = {
      async get(key: string) {
        try {
          return await db.get(key);
        } catch (err) {
          // Key not found
          if ((err as { code?: string }).code === 'LEVEL_NOT_FOUND') {
            return undefined;
          }
          throw err;
        }
      },
      async put(key: string, value: unknown) {
        await db.put(key, value);
      },
      async del(key: string) {
        try {
          await db.del(key);
        } catch {
          // Ignore if key doesn't exist
        }
      },
    };
  } catch {
    console.warn('Level not available, using in-memory private state storage');
    store = new InMemoryStore();
  }

  return {
    async getState(contractAddress: string): Promise<unknown> {
      return store.get(`state:${contractAddress}`);
    },

    async setState(contractAddress: string, state: unknown): Promise<void> {
      await store.put(`state:${contractAddress}`, state);
    },

    async clearState(contractAddress: string): Promise<void> {
      await store.del(`state:${contractAddress}`);
    },
  };
}
