/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskRegistry } from '../registry.js';
import { doctorTask } from './doctor.js';
import {
  nodeTask,
  nodeStopTask,
  nodeStatusTask,
  nodeLogsTask,
  nodeResetTask,
} from './node.js';

/**
 * Register all built-in tasks with the registry
 */
export function registerBuiltinTasks(registry: TaskRegistry): void {
  // Diagnostic tasks
  registry.register(doctorTask);

  // Node/network tasks
  registry.register(nodeTask);
  registry.register(nodeStopTask);
  registry.register(nodeStatusTask);
  registry.register(nodeLogsTask);
  registry.register(nodeResetTask);
}
