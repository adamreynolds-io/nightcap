/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskDefinition } from './types.js';

/**
 * Registry for managing task definitions.
 * Supports task registration, lookup, and override.
 */
export class TaskRegistry {
  private tasks: Map<string, TaskDefinition> = new Map();
  private originals: Map<string, TaskDefinition> = new Map();

  /**
   * Register a new task or override an existing one
   */
  register(task: TaskDefinition): void {
    if (this.tasks.has(task.name)) {
      // Store the original for runSuper support
      const existing = this.tasks.get(task.name);
      if (existing) {
        this.originals.set(task.name, existing);
      }
    }
    this.tasks.set(task.name, task);
  }

  /**
   * Register a custom task from config, merging with existing if present
   */
  registerCustom(name: string, customTask: Partial<TaskDefinition>): void {
    const existing = this.tasks.get(name);

    if (existing) {
      // Store original for runSuper
      this.originals.set(name, existing);

      // Merge custom task with existing
      this.tasks.set(name, {
        ...existing,
        ...customTask,
        name, // Ensure name matches
        action: customTask.action ?? existing.action,
        params: {
          ...existing.params,
          ...customTask.params,
        },
      });
    } else if (customTask.action) {
      // New custom task - must have an action
      this.tasks.set(name, {
        name,
        description: customTask.description ?? `Custom task: ${name}`,
        dependencies: customTask.dependencies,
        params: customTask.params,
        action: customTask.action,
      });
    } else {
      throw new Error(
        `Cannot register custom task '${name}': no action provided and no existing task to override`
      );
    }
  }

  /**
   * Get a task by name
   */
  get(name: string): TaskDefinition | undefined {
    return this.tasks.get(name);
  }

  /**
   * Check if a task exists
   */
  has(name: string): boolean {
    return this.tasks.has(name);
  }

  /**
   * Get all registered tasks
   */
  getAllTasks(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task names that partially match the input
   */
  getSuggestions(partialName: string): string[] {
    const names = Array.from(this.tasks.keys());
    const lowercasePartial = partialName.toLowerCase();

    return names.filter(name => {
      const lowerName = name.toLowerCase();
      return lowerName.includes(lowercasePartial) ||
             lowercasePartial.includes(lowerName) ||
             this.levenshteinDistance(lowerName, lowercasePartial) <= 2;
    });
  }

  /**
   * Override specific properties of an existing task
   */
  override(name: string, overrides: Partial<TaskDefinition>): void {
    const existing = this.tasks.get(name);
    if (!existing) {
      throw new Error(`Cannot override non-existent task: ${name}`);
    }

    // Store original for runSuper if not already stored
    if (!this.originals.has(name)) {
      this.originals.set(name, existing);
    }

    this.tasks.set(name, {
      ...existing,
      ...overrides,
      // Preserve the action if not explicitly overridden
      action: overrides.action ?? existing.action,
    });
  }

  /**
   * Get the original (non-overridden) version of a task
   */
  getOriginal(name: string): TaskDefinition | undefined {
    return this.originals.get(name);
  }

  /**
   * Check if a task has an original version (was overridden)
   */
  hasOriginal(name: string): boolean {
    return this.originals.has(name);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j - 1]! + cost
        );
      }
    }

    return matrix[b.length]![a.length]!;
  }
}
