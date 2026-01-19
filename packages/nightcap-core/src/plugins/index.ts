/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export types
export type {
  NightcapPlugin,
  NightcapUserConfig,
  ResolvedNightcapConfig,
  NightcapHookHandlers,
  ConfigHookHandlers,
  RuntimeHookHandlers,
  NightcapRuntimeEnvironment,
  NightcapContext,
} from './types.js';

// Re-export plugin resolution
export {
  resolvePluginList,
  PluginDependencyCycleError,
  PluginLoadError,
} from './resolve-plugin-list.js';

// Re-export hook manager
export { HookManager, ConfigValidationError } from './hook-manager.js';

// Re-export validation
export { validatePlugin, PluginValidationError } from './validation.js';
