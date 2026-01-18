/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskContext, TaskDefinition, TaskResult } from './types.js';
import type { TaskRegistry } from './registry.js';
import { logger } from '../utils/logger.js';

/**
 * Task runner with dependency resolution.
 * Executes tasks in topological order based on dependencies.
 */
export class TaskRunner {
  private registry: TaskRegistry;
  private completedTasks: Set<string> = new Set();

  constructor(registry: TaskRegistry) {
    this.registry = registry;
  }

  /**
   * Run a task and its dependencies
   */
  async run(taskName: string, context: TaskContext): Promise<TaskResult[]> {
    this.completedTasks.clear();
    const results: TaskResult[] = [];

    const executionOrder = this.resolveExecutionOrder(taskName);

    for (const name of executionOrder) {
      const result = await this.executeTask(name, context);
      results.push(result);

      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Resolve task execution order using topological sort
   */
  private resolveExecutionOrder(taskName: string): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      const task = this.registry.get(name);
      if (!task) {
        const suggestions = this.registry.getSuggestions(name);
        let message = `Unknown task: ${name}`;
        if (suggestions.length > 0) {
          message += `\nDid you mean: ${suggestions.join(', ')}?`;
        }
        throw new Error(message);
      }

      visiting.add(name);

      if (task.dependencies) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    visit(taskName);
    return order;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    taskName: string,
    context: TaskContext
  ): Promise<TaskResult> {
    const task = this.registry.get(taskName) as TaskDefinition;
    const startTime = Date.now();

    logger.info(`Running task: ${taskName}`);

    try {
      await task.action(context);
      const duration = Date.now() - startTime;

      this.completedTasks.add(taskName);
      logger.debug(`Task ${taskName} completed in ${duration}ms`);

      return {
        name: taskName,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error(`Task ${taskName} failed: ${err.message}`);

      return {
        name: taskName,
        success: false,
        duration,
        error: err,
      };
    }
  }
}
