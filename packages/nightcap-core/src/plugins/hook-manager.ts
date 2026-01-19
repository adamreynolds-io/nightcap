/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  NightcapPlugin,
  NightcapUserConfig,
  ResolvedNightcapConfig,
  NightcapContext,
  NightcapRuntimeEnvironment,
  ConfigHookHandlers,
  RuntimeHookHandlers,
} from './types.js';

/**
 * Error thrown when config validation fails
 */
export class ConfigValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Config validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Manages hook handler registration and execution.
 * Based on Hardhat 3's hook-manager.ts
 */
export class HookManager {
  #configHandlers: Array<{ pluginId: string; handlers: ConfigHookHandlers }> = [];
  #runtimeHandlers: Array<{ pluginId: string; handlers: RuntimeHookHandlers }> = [];

  /**
   * Register a plugin's hook handlers
   */
  registerPlugin(plugin: NightcapPlugin): void {
    if (plugin.hookHandlers?.config) {
      this.#configHandlers.push({
        pluginId: plugin.id,
        handlers: plugin.hookHandlers.config,
      });
    }
    if (plugin.hookHandlers?.runtime) {
      this.#runtimeHandlers.push({
        pluginId: plugin.id,
        handlers: plugin.hookHandlers.runtime,
      });
    }
  }

  /**
   * Run config hooks to transform user config into resolved config.
   *
   * Hook execution order:
   * 1. extendUserConfig - Sequential, each plugin can extend the config
   * 2. validateUserConfig - Parallel, collect all validation errors
   * 3. resolveUserConfig - Middleware chain with next()
   */
  async runConfigHooks(
    userConfig: NightcapUserConfig,
    plugins: NightcapPlugin[]
  ): Promise<ResolvedNightcapConfig> {
    // 1. extendUserConfig (sequential)
    let config = userConfig;
    for (const { handlers } of this.#configHandlers) {
      if (handlers.extendUserConfig) {
        config = handlers.extendUserConfig(config);
      }
    }

    // 2. validateUserConfig (collect all errors)
    const errors: string[] = [];
    for (const { pluginId, handlers } of this.#configHandlers) {
      if (handlers.validateUserConfig) {
        const pluginErrors = handlers.validateUserConfig(config);
        for (const error of pluginErrors) {
          errors.push(`[${pluginId}] ${error}`);
        }
      }
    }
    if (errors.length > 0) {
      throw new ConfigValidationError(errors);
    }

    // 3. resolveUserConfig (middleware chain)
    // Build the base resolver that creates the resolved config
    const baseResolver = async (cfg: NightcapUserConfig): Promise<ResolvedNightcapConfig> => {
      // Strip plugins from config and add sorted plugins list
      const { plugins: _, ...rest } = cfg;
      return {
        ...rest,
        plugins,
      };
    };

    // Build middleware chain from last to first
    // Each handler wraps the next one
    const handlers = this.#configHandlers
      .filter(h => h.handlers.resolveUserConfig)
      .reverse();

    let resolver = baseResolver;
    for (const { handlers: h } of handlers) {
      const currentResolver = resolver;
      const resolveUserConfig = h.resolveUserConfig!;

      resolver = async (cfg: NightcapUserConfig) => {
        // Create initial resolved config for the handler
        const initialResolved = await baseResolver(cfg);
        return resolveUserConfig(cfg, initialResolved, currentResolver);
      };
    }

    return resolver(config);
  }

  /**
   * Run runtime.extendEnvironment hooks to let plugins add extensions.
   * Hooks are run sequentially in plugin order.
   * Each plugin can add its namespace to the environment (e.g., env.midnight).
   */
  async runExtendEnvironmentHooks(env: NightcapRuntimeEnvironment): Promise<void> {
    for (const { handlers } of this.#runtimeHandlers) {
      if (handlers.extendEnvironment) {
        await handlers.extendEnvironment(env);
      }
    }
  }

  /**
   * Run runtime.created hooks after environment is set up.
   * Hooks are run sequentially in plugin order.
   */
  async runRuntimeCreatedHooks(ctx: NightcapContext): Promise<void> {
    for (const { handlers } of this.#runtimeHandlers) {
      if (handlers.created) {
        await handlers.created(ctx);
      }
    }
  }

  /**
   * Get the number of registered config handlers
   */
  get configHandlerCount(): number {
    return this.#configHandlers.length;
  }

  /**
   * Get the number of registered runtime handlers
   */
  get runtimeHandlerCount(): number {
    return this.#runtimeHandlers.length;
  }
}
