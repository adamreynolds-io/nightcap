/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export types
export type * from './tasks/types.js';

// Re-export task system
export { TaskRegistry } from './tasks/registry.js';
export { TaskRunner } from './tasks/runner.js';

// Re-export config system
export { loadConfig } from './config/loader.js';
export { DEFAULT_NETWORKS, DEFAULT_PROOF_SERVER_URL } from './config/defaults.js';
export { validateConfig } from './config/validator.js';

// Re-export logger
export { logger, LogLevel } from './utils/logger.js';

// Re-export plugin system
export type {
  NightcapPlugin,
  NightcapUserConfig,
  ResolvedNightcapConfig,
  NightcapHookHandlers,
  ConfigHookHandlers,
  RuntimeHookHandlers,
  NightcapRuntimeEnvironment,
  NightcapContext,
} from './plugins/index.js';
export {
  resolvePluginList,
  HookManager,
  validatePlugin,
  PluginValidationError,
  PluginDependencyCycleError,
  PluginLoadError,
  ConfigValidationError,
} from './plugins/index.js';

// Re-export compiler
export { CompilerManager } from './compiler/index.js';
export type { CompilerVersion, CompilationResult } from './compiler/index.js';

// Re-export toolkit
export { Toolkit, ToolkitDockerBridge, ToolkitNativeBridge } from './toolkit/index.js';
export { DEFAULT_TOOLKIT_IMAGE, TOOLKIT_ERROR_CODES } from './toolkit/index.js';
export type {
  ToolkitConfig,
  ToolkitMode,
  ToolkitEndpoint,
  ToolkitCommandOptions,
  ToolkitResult,
  ToolkitError,
  ToolkitErrorCode,
  DeployInput,
  DeployResult,
  CallInput,
  CallResult,
  WalletInfo,
  WalletBalance,
  TransactionInfo,
} from './toolkit/index.js';
