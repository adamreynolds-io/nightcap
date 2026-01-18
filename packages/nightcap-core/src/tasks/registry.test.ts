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
  });
});
