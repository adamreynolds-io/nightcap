/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setProvider,
  setSigners,
  getSigners,
  getProvider,
  duration,
} from './helpers.js';
import type { TestSigner } from './types.js';

describe('helpers', () => {
  describe('getProvider', () => {
    beforeEach(() => {
      // Reset provider by setting a new one
    });

    it('should throw when no provider is configured', () => {
      expect(() => getProvider()).toThrow(
        'No provider configured. Make sure tests are running with Nightcap test context.'
      );
    });

    it('should return the configured provider', () => {
      const mockProvider = {
        send: async () => null,
        getBlockNumber: async () => 100,
        getBlock: async () => ({ timestamp: 1234567890 }),
      };

      setProvider(mockProvider);
      expect(getProvider()).toBe(mockProvider);
    });
  });

  describe('getSigners', () => {
    beforeEach(() => {
      setSigners([]);
    });

    it('should throw when no signers are configured', async () => {
      await expect(getSigners()).rejects.toThrow(
        'No signers configured. Make sure tests are running with Nightcap test context.'
      );
    });

    it('should return configured signers', async () => {
      const mockSigners: TestSigner[] = [
        {
          address: '0x1234',
          signMessage: async () => 'sig',
          signTransaction: async () => 'tx',
        },
        {
          address: '0x5678',
          signMessage: async () => 'sig',
          signTransaction: async () => 'tx',
        },
      ];

      setSigners(mockSigners);
      const signers = await getSigners();

      expect(signers).toHaveLength(2);
      expect(signers[0].address).toBe('0x1234');
      expect(signers[1].address).toBe('0x5678');
    });
  });

  describe('duration', () => {
    it('should calculate seconds correctly', () => {
      expect(duration.seconds(30)).toBe(30);
    });

    it('should calculate minutes correctly', () => {
      expect(duration.minutes(5)).toBe(300);
    });

    it('should calculate hours correctly', () => {
      expect(duration.hours(2)).toBe(7200);
    });

    it('should calculate days correctly', () => {
      expect(duration.days(1)).toBe(86400);
    });

    it('should calculate weeks correctly', () => {
      expect(duration.weeks(1)).toBe(604800);
    });
  });
});
