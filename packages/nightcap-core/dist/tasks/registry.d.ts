/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskDefinition } from './types.js';
/**
 * Registry for managing task definitions.
 * Supports task registration, lookup, and override.
 */
export declare class TaskRegistry {
    private tasks;
    private overrides;
    /**
     * Register a new task or override an existing one
     */
    register(task: TaskDefinition): void;
    /**
     * Get a task by name
     */
    get(name: string): TaskDefinition | undefined;
    /**
     * Check if a task exists
     */
    has(name: string): boolean;
    /**
     * Get all registered tasks
     */
    getAllTasks(): TaskDefinition[];
    /**
     * Get task names that partially match the input
     */
    getSuggestions(partialName: string): string[];
    /**
     * Override specific properties of an existing task
     */
    override(name: string, overrides: Partial<TaskDefinition>): void;
    /**
     * Get the original (non-overridden) version of a task
     */
    getOriginal(name: string): TaskDefinition | undefined;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
}
//# sourceMappingURL=registry.d.ts.map