/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskRunner } from './runner.js';
import { TaskRegistry } from './registry.js';
import type { TaskDefinition, TaskContext } from './types.js';

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

function createMockTask(
  name: string,
  deps?: string[],
  action?: () => Promise<void>
): TaskDefinition {
  return {
    name,
    description: `Mock task ${name}`,
    dependencies: deps,
    action: action ?? (async () => {}),
  };
}

function createMockContext(): TaskContext {
  return {
    config: {},
    network: { name: 'localnet' },
    networkName: 'localnet',
    params: {},
    verbose: false,
  };
}

describe('TaskRunner', () => {
  let registry: TaskRegistry;
  let runner: TaskRunner;

  beforeEach(() => {
    registry = new TaskRegistry();
    runner = new TaskRunner(registry);
  });

  describe('run', () => {
    it('should run a simple task', async () => {
      const executed: string[] = [];
      registry.register(
        createMockTask('test', undefined, async () => {
          executed.push('test');
        })
      );

      const results = await runner.run('test', createMockContext());

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.name).toBe('test');
      expect(executed).toEqual(['test']);
    });

    it('should run dependencies in order', async () => {
      const executed: string[] = [];

      registry.register(
        createMockTask('a', undefined, async () => {
          executed.push('a');
        })
      );
      registry.register(
        createMockTask('b', ['a'], async () => {
          executed.push('b');
        })
      );
      registry.register(
        createMockTask('c', ['b'], async () => {
          executed.push('c');
        })
      );

      await runner.run('c', createMockContext());

      expect(executed).toEqual(['a', 'b', 'c']);
    });

    it('should handle multiple dependencies', async () => {
      const executed: string[] = [];

      registry.register(
        createMockTask('a', undefined, async () => {
          executed.push('a');
        })
      );
      registry.register(
        createMockTask('b', undefined, async () => {
          executed.push('b');
        })
      );
      registry.register(
        createMockTask('c', ['a', 'b'], async () => {
          executed.push('c');
        })
      );

      await runner.run('c', createMockContext());

      expect(executed).toContain('a');
      expect(executed).toContain('b');
      expect(executed.indexOf('c')).toBeGreaterThan(executed.indexOf('a'));
      expect(executed.indexOf('c')).toBeGreaterThan(executed.indexOf('b'));
    });

    it('should stop on task failure', async () => {
      const executed: string[] = [];

      registry.register(
        createMockTask('a', undefined, async () => {
          executed.push('a');
          throw new Error('Task a failed');
        })
      );
      registry.register(
        createMockTask('b', ['a'], async () => {
          executed.push('b');
        })
      );

      const results = await runner.run('b', createMockContext());

      expect(executed).toEqual(['a']);
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error?.message).toBe('Task a failed');
    });

    it('should throw for unknown task', async () => {
      await expect(runner.run('unknown', createMockContext())).rejects.toThrow(
        'Unknown task: unknown'
      );
    });

    it('should suggest similar tasks when task not found', async () => {
      registry.register(createMockTask('compile'));

      await expect(runner.run('complie', createMockContext())).rejects.toThrow(
        /Did you mean: compile/
      );
    });

    it('should detect circular dependencies', async () => {
      registry.register(createMockTask('a', ['b']));
      registry.register(createMockTask('b', ['a']));

      await expect(runner.run('a', createMockContext())).rejects.toThrow(
        /Circular dependency detected/
      );
    });

    it('should track task duration', async () => {
      registry.register(
        createMockTask('slow', undefined, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
        })
      );

      const results = await runner.run('slow', createMockContext());

      expect(results[0]?.duration).toBeGreaterThanOrEqual(50);
    });
  });
});
