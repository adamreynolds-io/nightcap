/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapConfig, TaskDefinition } from '../tasks/types.js';

/**
 * User config before resolution (may have plugins)
 */
export interface NightcapUserConfig extends NightcapConfig {
  /** Explicit plugin list (no auto-discovery) */
  plugins?: NightcapPlugin[];
}

/**
 * Resolved config with sorted plugins
 */
export interface ResolvedNightcapConfig extends NightcapConfig {
  /** Topologically sorted plugins */
  plugins: NightcapPlugin[];
}

/**
 * Plugin definition (Hardhat 3 style)
 */
export interface NightcapPlugin {
  /** Unique plugin identifier */
  id: string;

  /** npm package name (for error messages) */
  npmPackage?: string;

  /** Plugin dependencies as dynamic imports */
  dependencies?: (() => Promise<{ default: NightcapPlugin }>)[];

  /** Hook handlers the plugin defines */
  hookHandlers?: Partial<NightcapHookHandlers>;

  /** Tasks the plugin defines or overrides */
  tasks?: TaskDefinition[];
}

/**
 * Hook handler categories
 */
export interface NightcapHookHandlers {
  config: ConfigHookHandlers;
  runtime: RuntimeHookHandlers;
}

/**
 * Config-phase hooks (run during config loading)
 */
export interface ConfigHookHandlers {
  /**
   * Extend user config before validation.
   * Use this to add default values or merge plugin-specific config.
   */
  extendUserConfig?: (config: NightcapUserConfig) => NightcapUserConfig;

  /**
   * Validate user config.
   * Return an array of error messages (empty if valid).
   */
  validateUserConfig?: (config: NightcapUserConfig) => string[];

  /**
   * Resolve user config to final config.
   * Called in a middleware chain - use next() to continue the chain.
   */
  resolveUserConfig?: (
    userConfig: NightcapUserConfig,
    resolvedConfig: ResolvedNightcapConfig,
    next: (config: NightcapUserConfig) => Promise<ResolvedNightcapConfig>
  ) => Promise<ResolvedNightcapConfig>;
}

/**
 * Runtime-phase hooks (run during task execution)
 */
export interface RuntimeHookHandlers {
  /**
   * Called after runtime environment is created but before task execution.
   * Use this for initialization, logging, or setting up global state.
   */
  created?: (ctx: NightcapContext) => void | Promise<void>;
}

/**
 * Context passed to runtime hooks
 */
export interface NightcapContext {
  /** The resolved configuration */
  config: ResolvedNightcapConfig;

  /** Run a task by name */
  runTask: (name: string, params?: Record<string, unknown>) => Promise<void>;
}
