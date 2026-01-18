/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import { logger } from '../utils/logger.js';
/**
 * Task runner with dependency resolution.
 * Executes tasks in topological order based on dependencies.
 */
export class TaskRunner {
    registry;
    completedTasks = new Set();
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Run a task and its dependencies
     */
    async run(taskName, context) {
        this.completedTasks.clear();
        const results = [];
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
    resolveExecutionOrder(taskName) {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        const visit = (name) => {
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
    async executeTask(taskName, context) {
        const task = this.registry.get(taskName);
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
        }
        catch (error) {
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
//# sourceMappingURL=runner.js.map