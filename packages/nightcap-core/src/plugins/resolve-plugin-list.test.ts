/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  resolvePluginList,
  PluginDependencyCycleError,
  PluginLoadError,
} from './resolve-plugin-list.js';
import { PluginValidationError } from './validation.js';
import type { NightcapPlugin } from './types.js';

function createPlugin(id: string, deps?: NightcapPlugin[]): NightcapPlugin {
  return {
    id,
    dependencies: deps?.map((dep) => async () => ({ default: dep })),
  };
}

describe('resolvePluginList', () => {
  describe('basic resolution', () => {
    it('should return empty array for empty input', async () => {
      const result = await resolvePluginList([]);
      expect(result).toEqual([]);
    });

    it('should return single plugin unchanged', async () => {
      const plugin = createPlugin('a');
      const result = await resolvePluginList([plugin]);
      expect(result).toEqual([plugin]);
    });

    it('should preserve order for independent plugins', async () => {
      const a = createPlugin('a');
      const b = createPlugin('b');
      const c = createPlugin('c');

      const result = await resolvePluginList([a, b, c]);
      expect(result).toEqual([a, b, c]);
    });
  });

  describe('dependency resolution', () => {
    it('should resolve dependencies before dependents', async () => {
      const dep = createPlugin('dep');
      const main = createPlugin('main', [dep]);

      const result = await resolvePluginList([main]);
      expect(result).toEqual([dep, main]);
    });

    it('should resolve deep dependencies', async () => {
      const deep = createPlugin('deep');
      const mid = createPlugin('mid', [deep]);
      const top = createPlugin('top', [mid]);

      const result = await resolvePluginList([top]);
      expect(result).toEqual([deep, mid, top]);
    });

    it('should handle multiple dependencies', async () => {
      const a = createPlugin('a');
      const b = createPlugin('b');
      const c = createPlugin('c', [a, b]);

      const result = await resolvePluginList([c]);
      expect(result.indexOf(a)).toBeLessThan(result.indexOf(c));
      expect(result.indexOf(b)).toBeLessThan(result.indexOf(c));
    });

    it('should not duplicate shared dependencies', async () => {
      const shared = createPlugin('shared');
      const a = createPlugin('a', [shared]);
      const b = createPlugin('b', [shared]);

      const result = await resolvePluginList([a, b]);

      // shared should only appear once
      const sharedCount = result.filter((p) => p.id === 'shared').length;
      expect(sharedCount).toBe(1);

      // shared should come before both a and b
      const sharedIndex = result.findIndex((p) => p.id === 'shared');
      const aIndex = result.findIndex((p) => p.id === 'a');
      const bIndex = result.findIndex((p) => p.id === 'b');
      expect(sharedIndex).toBeLessThan(aIndex);
      expect(sharedIndex).toBeLessThan(bIndex);
    });

    it('should handle diamond dependency pattern', async () => {
      const bottom = createPlugin('bottom');
      const left = createPlugin('left', [bottom]);
      const right = createPlugin('right', [bottom]);
      const top = createPlugin('top', [left, right]);

      const result = await resolvePluginList([top]);

      // bottom should appear only once and first
      expect(result.filter((p) => p.id === 'bottom').length).toBe(1);
      expect(result[0]!.id).toBe('bottom');

      // top should be last
      expect(result[result.length - 1]!.id).toBe('top');
    });
  });

  describe('cycle detection', () => {
    it('should detect self-referential cycle', async () => {
      const self: NightcapPlugin = {
        id: 'self',
        dependencies: [],
      };
      // Create circular reference
      self.dependencies = [async () => ({ default: self })];

      await expect(resolvePluginList([self])).rejects.toThrow(PluginDependencyCycleError);
    });

    it('should detect two-node cycle', async () => {
      const a: NightcapPlugin = { id: 'a', dependencies: [] };
      const b: NightcapPlugin = { id: 'b', dependencies: [] };
      a.dependencies = [async () => ({ default: b })];
      b.dependencies = [async () => ({ default: a })];

      await expect(resolvePluginList([a])).rejects.toThrow(PluginDependencyCycleError);
    });

    it('should detect longer cycle', async () => {
      const a: NightcapPlugin = { id: 'a', dependencies: [] };
      const b: NightcapPlugin = { id: 'b', dependencies: [] };
      const c: NightcapPlugin = { id: 'c', dependencies: [] };
      a.dependencies = [async () => ({ default: b })];
      b.dependencies = [async () => ({ default: c })];
      c.dependencies = [async () => ({ default: a })];

      await expect(resolvePluginList([a])).rejects.toThrow(PluginDependencyCycleError);
    });

    it('should include cycle path in error', async () => {
      const a: NightcapPlugin = { id: 'a', dependencies: [] };
      const b: NightcapPlugin = { id: 'b', dependencies: [] };
      a.dependencies = [async () => ({ default: b })];
      b.dependencies = [async () => ({ default: a })];

      try {
        await resolvePluginList([a]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginDependencyCycleError);
        const cycleError = error as PluginDependencyCycleError;
        expect(cycleError.cycle).toContain('a');
        expect(cycleError.cycle).toContain('b');
      }
    });
  });

  describe('duplicate detection', () => {
    it('should accept same plugin instance multiple times', async () => {
      const plugin = createPlugin('a');
      const result = await resolvePluginList([plugin, plugin]);
      expect(result).toEqual([plugin]);
    });

    it('should throw for different instances with same id', async () => {
      const a1 = createPlugin('a');
      const a2 = createPlugin('a');

      await expect(resolvePluginList([a1, a2])).rejects.toThrow(PluginValidationError);
      await expect(resolvePluginList([a1, a2])).rejects.toThrow('Duplicate plugin id');
    });
  });

  describe('validation', () => {
    it('should validate plugins during resolution', async () => {
      const invalid = { notAPlugin: true };
      await expect(resolvePluginList([invalid as unknown as NightcapPlugin])).rejects.toThrow(
        PluginValidationError
      );
    });

    it('should validate dependency plugins', async () => {
      const invalid = { notAPlugin: true };
      const main: NightcapPlugin = {
        id: 'main',
        dependencies: [async () => ({ default: invalid as unknown as NightcapPlugin })],
      };

      await expect(resolvePluginList([main])).rejects.toThrow(PluginValidationError);
    });
  });

  describe('load errors', () => {
    it('should wrap dependency load errors', async () => {
      const main: NightcapPlugin = {
        id: 'main',
        dependencies: [
          async () => {
            throw new Error('Module not found');
          },
        ],
      };

      await expect(resolvePluginList([main])).rejects.toThrow(PluginLoadError);
    });

    it('should include plugin id in load error', async () => {
      const main: NightcapPlugin = {
        id: 'main-plugin',
        dependencies: [
          async () => {
            throw new Error('Module not found');
          },
        ],
      };

      try {
        await resolvePluginList([main]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginLoadError);
        const loadError = error as PluginLoadError;
        expect(loadError.pluginId).toBe('main-plugin');
        expect(loadError.message).toContain('main-plugin');
      }
    });
  });
});
