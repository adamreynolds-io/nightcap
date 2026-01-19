/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFixture,
  createFixture,
  setSnapshotFunctions,
  clearFixtureCache,
} from './fixtures.js';

describe('fixtures', () => {
  beforeEach(() => {
    clearFixtureCache();
  });

  describe('loadFixture', () => {
    it('should execute fixture function on first call', async () => {
      let callCount = 0;
      const fixture = async () => {
        callCount++;
        return { value: 42 };
      };

      const result = await loadFixture(fixture);

      expect(result).toEqual({ value: 42 });
      expect(callCount).toBe(1);
    });

    it('should return cached result on subsequent calls', async () => {
      let callCount = 0;
      const fixture = async () => {
        callCount++;
        return { value: callCount };
      };

      // Without snapshot functions, fixture runs each time
      const result1 = await loadFixture(fixture);
      const result2 = await loadFixture(fixture);

      // First call caches the result
      expect(result1).toEqual({ value: 1 });
      // Second call returns cached result (not re-executed)
      expect(result2).toEqual({ value: 1 });
      // Fixture was only called once
      expect(callCount).toBe(1);
    });

    it('should use snapshot/revert when available', async () => {
      let snapshotCount = 0;
      let revertCount = 0;

      setSnapshotFunctions(
        async () => {
          snapshotCount++;
          return `snapshot-${snapshotCount}`;
        },
        async () => {
          revertCount++;
        }
      );

      let callCount = 0;
      const fixture = async () => {
        callCount++;
        return { value: callCount };
      };

      await loadFixture(fixture);
      await loadFixture(fixture);

      // Fixture runs once, snapshot taken once after first execution
      expect(callCount).toBe(1);
      // Snapshot taken after first call, and after revert
      expect(snapshotCount).toBe(2);
      // Revert called on second loadFixture
      expect(revertCount).toBe(1);
    });

    it('should maintain separate caches for different fixtures', async () => {
      const fixture1 = async () => ({ value: 1 });
      const fixture2 = async () => ({ value: 2 });

      const result1 = await loadFixture(fixture1);
      const result2 = await loadFixture(fixture2);

      expect(result1).toEqual({ value: 1 });
      expect(result2).toEqual({ value: 2 });
    });
  });

  describe('createFixture', () => {
    it('should return the same function', () => {
      const fn = async () => ({ test: true });
      const fixture = createFixture(fn);

      expect(fixture).toBe(fn);
    });

    it('should work with loadFixture', async () => {
      const deployFixture = createFixture(async () => {
        return { contract: 'deployed' };
      });

      const result = await loadFixture(deployFixture);
      expect(result).toEqual({ contract: 'deployed' });
    });
  });

  describe('clearFixtureCache', () => {
    it('should clear all cached fixtures', async () => {
      let callCount = 0;
      const fixture = async () => {
        callCount++;
        return { value: callCount };
      };

      await loadFixture(fixture);
      expect(callCount).toBe(1);

      clearFixtureCache();

      await loadFixture(fixture);
      expect(callCount).toBe(2);
    });
  });
});
