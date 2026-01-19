/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskRegistry } from '../registry.js';
import { doctorTask } from './doctor.js';
import { initTask } from './init.js';
import {
  nodeTask,
  nodeStopTask,
  nodeStatusTask,
  nodeLogsTask,
  nodeResetTask,
  nodeExecTask,
  nodeSnapshotTask,
  nodeRestoreTask,
  nodeSnapshotsTask,
  nodeSnapshotDeleteTask,
} from './node.js';
import {
  compileTask,
  cleanTask,
  compilerListTask,
  compilerInstallTask,
} from './compile.js';
import {
  deployTask,
  deploymentsTask,
} from './deploy.js';
import { consoleTask } from './console.js';

/**
 * Register all built-in tasks with the registry
 */
export function registerBuiltinTasks(registry: TaskRegistry): void {
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
  registry.register(nodeExecTask);
  registry.register(nodeSnapshotTask);
  registry.register(nodeRestoreTask);
  registry.register(nodeSnapshotsTask);
  registry.register(nodeSnapshotDeleteTask);

  // Compile tasks
  registry.register(compileTask);
  registry.register(cleanTask);
  registry.register(compilerListTask);
  registry.register(compilerInstallTask);

  // Deploy tasks
  registry.register(deployTask);
  registry.register(deploymentsTask);

  // Interactive console
  registry.register(consoleTask);
}
