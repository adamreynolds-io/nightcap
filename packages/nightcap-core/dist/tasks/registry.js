/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Registry for managing task definitions.
 * Supports task registration, lookup, and override.
 */
export class TaskRegistry {
    tasks = new Map();
    overrides = new Map();
    /**
     * Register a new task or override an existing one
     */
    register(task) {
        if (this.tasks.has(task.name)) {
            // Store the original as an override target
            const existing = this.tasks.get(task.name);
            if (existing) {
                this.overrides.set(task.name, existing);
            }
        }
        this.tasks.set(task.name, task);
    }
    /**
     * Get a task by name
     */
    get(name) {
        return this.tasks.get(name);
    }
    /**
     * Check if a task exists
     */
    has(name) {
        return this.tasks.has(name);
    }
    /**
     * Get all registered tasks
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * Get task names that partially match the input
     */
    getSuggestions(partialName) {
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
    override(name, overrides) {
        const existing = this.tasks.get(name);
        if (!existing) {
            throw new Error(`Cannot override non-existent task: ${name}`);
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
    getOriginal(name) {
        return this.overrides.get(name);
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[b.length][a.length];
    }
}
//# sourceMappingURL=registry.js.map