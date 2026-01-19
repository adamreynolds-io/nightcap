/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createIndexerProvider } from './indexer.js';

describe('indexer provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createIndexerProvider', () => {
    it('should create provider with correct graphql URL', () => {
      const provider = createIndexerProvider('http://localhost:8088');
      expect(provider).toBeDefined();
      expect(provider.getBalance).toBeInstanceOf(Function);
      expect(provider.getBlock).toBeInstanceOf(Function);
      expect(provider.getTransaction).toBeInstanceOf(Function);
    });

    it('should handle URL with trailing slash', () => {
      const provider = createIndexerProvider('http://localhost:8088/');
      expect(provider).toBeDefined();
    });

    it('should handle URL already ending with /graphql', () => {
      const provider = createIndexerProvider('http://localhost:8088/api/v1/graphql');
      expect(provider).toBeDefined();
    });
  });

  describe('getBalance', () => {
    it('should return balance from indexer', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            balance: {
              unshielded: '1000000000000',
              shielded: '500000000000',
            },
          },
        }),
      } as Response);

      const provider = createIndexerProvider('http://localhost:8088');
      const balance = await provider.getBalance('0x1234');

      expect(balance.unshielded).toBe(1000000000000n);
      expect(balance.shielded).toBe(500000000000n);
    });

    it('should return zero balance on error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const provider = createIndexerProvider('http://localhost:8088');
      const balance = await provider.getBalance('0x1234');

      expect(balance.unshielded).toBe(0n);
      expect(balance.shielded).toBe(0n);
    });
  });

  describe('getBlock', () => {
    it('should return block info', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            block: {
              number: 100,
              hash: '0xabc123',
              timestamp: 1705000000,
              parentHash: '0xdef456',
            },
          },
        }),
      } as Response);

      const provider = createIndexerProvider('http://localhost:8088');
      const block = await provider.getBlock(100);

      expect(block.number).toBe(100);
      expect(block.hash).toBe('0xabc123');
      expect(block.timestamp).toBe(1705000000);
      expect(block.parentHash).toBe('0xdef456');
    });

    it('should throw on query error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          errors: [{ message: 'Block not found' }],
        }),
      } as Response);

      const provider = createIndexerProvider('http://localhost:8088');

      await expect(provider.getBlock(999999)).rejects.toThrow('Block not found');
    });
  });

  describe('getTransaction', () => {
    it('should return transaction info', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            transaction: {
              hash: '0xabc123',
              blockNumber: 100,
              from: '0x1234',
              to: '0x5678',
              status: 'success',
            },
          },
        }),
      } as Response);

      const provider = createIndexerProvider('http://localhost:8088');
      const tx = await provider.getTransaction('0xabc123');

      expect(tx.hash).toBe('0xabc123');
      expect(tx.blockNumber).toBe(100);
      expect(tx.from).toBe('0x1234');
      expect(tx.to).toBe('0x5678');
      expect(tx.status).toBe('success');
    });
  });
});
