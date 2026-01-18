/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskContext, TaskResult } from './types.js';
import type { TaskRegistry } from './registry.js';
/**
 * Task runner with dependency resolution.
 * Executes tasks in topological order based on dependencies.
 */
export declare class TaskRunner {
    private registry;
    private completedTasks;
    constructor(registry: TaskRegistry);
    /**
     * Run a task and its dependencies
     */
    run(taskName: string, context: TaskContext): Promise<TaskResult[]>;
    /**
     * Resolve task execution order using topological sort
     */
    private resolveExecutionOrder;
    /**
     * Execute a single task
     */
    private executeTask;
}
//# sourceMappingURL=runner.d.ts.map