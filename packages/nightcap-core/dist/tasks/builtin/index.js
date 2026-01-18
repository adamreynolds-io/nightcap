/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import { doctorTask } from './doctor.js';
import { initTask } from './init.js';
import { nodeTask, nodeStopTask, nodeStatusTask, nodeLogsTask, nodeResetTask, } from './node.js';
import { compileTask, cleanTask, compilerListTask, compilerInstallTask, } from './compile.js';
/**
 * Register all built-in tasks with the registry
 */
export function registerBuiltinTasks(registry) {
    // Project tasks
    registry.register(initTask);
    // Diagnostic tasks
    registry.register(doctorTask);
    // Node/network tasks
    registry.register(nodeTask);
    registry.register(nodeStopTask);
    registry.register(nodeStatusTask);
    registry.register(nodeLogsTask);
    registry.register(nodeResetTask);
    // Compile tasks
    registry.register(compileTask);
    registry.register(cleanTask);
    registry.register(compilerListTask);
    registry.register(compilerInstallTask);
}
//# sourceMappingURL=index.js.map