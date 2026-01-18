/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import { doctorTask } from './doctor.js';
/**
 * Register all built-in tasks with the registry
 */
export function registerBuiltinTasks(registry) {
    registry.register(doctorTask);
}
//# sourceMappingURL=index.js.map