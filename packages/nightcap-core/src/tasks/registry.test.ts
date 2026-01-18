/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRegistry } from './registry.js';
import type { TaskDefinition } from './types.js';

function createMockTask(name: string, deps?: string[]): TaskDefinition {
  return {
    name,
    description: `Mock task ${name}`,
    dependencies: deps,
    action: async () => {},
  };
}

describe('TaskRegistry', () => {
  let registry: TaskRegistry;

  beforeEach(() => {
    registry = new TaskRegistry();
  });

  describe('register', () => {
    it('should register a task', () => {
      const task = createMockTask('test');
      registry.register(task);
      expect(registry.has('test')).toBe(true);
    });

    it('should allow overriding an existing task', () => {
      const original = createMockTask('test');
      const override = createMockTask('test');
      override.description = 'Overridden';

      registry.register(original);
      registry.register(override);

      expect(registry.get('test')?.description).toBe('Overridden');
    });

    it('should store original when task is overridden', () => {
      const original = createMockTask('test');
      original.description = 'Original';
      const override = createMockTask('test');
      override.description = 'Overridden';

      registry.register(original);
      registry.register(override);

      const stored = registry.getOriginal('test');
      expect(stored?.description).toBe('Original');
    });
  });

  describe('get', () => {
    it('should return undefined for unknown task', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });

    it('should return registered task', () => {
      const task = createMockTask('test');
      registry.register(task);
      expect(registry.get('test')).toBe(task);
    });
  });

  describe('has', () => {
    it('should return false for unknown task', () => {
      expect(registry.has('unknown')).toBe(false);
    });

    it('should return true for registered task', () => {
      registry.register(createMockTask('test'));
      expect(registry.has('test')).toBe(true);
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array when no tasks registered', () => {
      expect(registry.getAllTasks()).toEqual([]);
    });

    it('should return all registered tasks', () => {
      registry.register(createMockTask('a'));
      registry.register(createMockTask('b'));
      registry.register(createMockTask('c'));

      const tasks = registry.getAllTasks();
      expect(tasks).toHaveLength(3);
      expect(tasks.map((t) => t.name)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      registry.register(createMockTask('compile'));
      registry.register(createMockTask('clean'));
      registry.register(createMockTask('doctor'));
      registry.register(createMockTask('node'));
      registry.register(createMockTask('node:start'));
    });

    it('should suggest tasks with partial match', () => {
      const suggestions = registry.getSuggestions('comp');
      expect(suggestions).toContain('compile');
    });

    it('should suggest tasks with similar names (levenshtein)', () => {
      const suggestions = registry.getSuggestions('complie'); // typo
      expect(suggestions).toContain('compile');
    });

    it('should return empty for completely unrelated input', () => {
      const suggestions = registry.getSuggestions('xyz123');
      expect(suggestions).toEqual([]);
    });
  });

  describe('override', () => {
    it('should throw when overriding non-existent task', () => {
      expect(() => {
        registry.override('nonexistent', { description: 'New' });
      }).toThrow('Cannot override non-existent task: nonexistent');
    });

    it('should override specific properties', () => {
      const original = createMockTask('test');
      original.description = 'Original';
      registry.register(original);

      registry.override('test', { description: 'Overridden' });

      expect(registry.get('test')?.description).toBe('Overridden');
    });

    it('should preserve action if not explicitly overridden', () => {
      const originalAction = async () => {};
      const task = createMockTask('test');
      task.action = originalAction;
      registry.register(task);

      registry.override('test', { description: 'Overridden' });

      expect(registry.get('test')?.action).toBe(originalAction);
    });

    it('should store original for runSuper support', () => {
      const original = createMockTask('test');
      original.description = 'Original';
      registry.register(original);

      registry.override('test', { description: 'Overridden' });

      expect(registry.hasOriginal('test')).toBe(true);
      expect(registry.getOriginal('test')?.description).toBe('Original');
    });
  });

  describe('registerCustom', () => {
    it('should register a new custom task with action', () => {
      const customAction = async () => {};
      registry.registerCustom('custom', {
        description: 'Custom task',
        action: customAction,
      });

      expect(registry.has('custom')).toBe(true);
      expect(registry.get('custom')?.description).toBe('Custom task');
      expect(registry.get('custom')?.action).toBe(customAction);
    });

    it('should use default description for new task without one', () => {
      registry.registerCustom('custom', {
        action: async () => {},
      });

      expect(registry.get('custom')?.description).toBe('Custom task: custom');
    });

    it('should throw when registering new task without action', () => {
      expect(() => {
        registry.registerCustom('custom', { description: 'No action' });
      }).toThrow("Cannot register custom task 'custom': no action provided");
    });

    it('should override existing task with custom action', () => {
      const originalAction = async () => {};
      const customAction = async () => {};

      registry.register({
        name: 'test',
        description: 'Original',
        action: originalAction,
      });

      registry.registerCustom('test', {
        description: 'Custom override',
        action: customAction,
      });

      expect(registry.get('test')?.description).toBe('Custom override');
      expect(registry.get('test')?.action).toBe(customAction);
    });

    it('should preserve original action when overriding without action', () => {
      const originalAction = async () => {};

      registry.register({
        name: 'test',
        description: 'Original',
        action: originalAction,
      });

      registry.registerCustom('test', {
        description: 'Custom description only',
      });

      expect(registry.get('test')?.description).toBe('Custom description only');
      expect(registry.get('test')?.action).toBe(originalAction);
    });

    it('should store original for runSuper support when overriding', () => {
      const originalAction = async () => {};

      registry.register({
        name: 'test',
        description: 'Original',
        action: originalAction,
      });

      registry.registerCustom('test', {
        description: 'Custom',
        action: async () => {},
      });

      expect(registry.hasOriginal('test')).toBe(true);
      expect(registry.getOriginal('test')?.action).toBe(originalAction);
    });

    it('should merge params from original and custom', () => {
      registry.register({
        name: 'test',
        description: 'Original',
        params: {
          foo: { type: 'string', description: 'Foo param' },
        },
        action: async () => {},
      });

      registry.registerCustom('test', {
        params: {
          bar: { type: 'boolean', description: 'Bar param' },
        },
      });

      const task = registry.get('test');
      expect(task?.params?.['foo']).toBeDefined();
      expect(task?.params?.['bar']).toBeDefined();
    });
  });

  describe('hasOriginal', () => {
    it('should return false when task has no original', () => {
      registry.register(createMockTask('test'));
      expect(registry.hasOriginal('test')).toBe(false);
    });

    it('should return true when task was overridden via register', () => {
      registry.register(createMockTask('test'));
      registry.register(createMockTask('test'));
      expect(registry.hasOriginal('test')).toBe(true);
    });

    it('should return true when task was overridden via override', () => {
      registry.register(createMockTask('test'));
      registry.override('test', { description: 'New' });
      expect(registry.hasOriginal('test')).toBe(true);
    });

    it('should return true when task was overridden via registerCustom', () => {
      registry.register(createMockTask('test'));
      registry.registerCustom('test', { description: 'Custom' });
      expect(registry.hasOriginal('test')).toBe(true);
    });
  });
});
