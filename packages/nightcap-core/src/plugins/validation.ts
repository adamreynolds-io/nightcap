/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapPlugin } from './types.js';

/**
 * Validation error for plugins
 */
export class PluginValidationError extends Error {
  constructor(
    public readonly pluginId: string,
    message: string
  ) {
    super(`Plugin '${pluginId}': ${message}`);
    this.name = 'PluginValidationError';
  }
}

/**
 * Validate a plugin definition
 * @throws PluginValidationError if the plugin is invalid
 */
export function validatePlugin(plugin: unknown): asserts plugin is NightcapPlugin {
  if (!plugin || typeof plugin !== 'object') {
    throw new PluginValidationError('unknown', 'Plugin must be an object');
  }

  const p = plugin as Record<string, unknown>;

  // id is required and must be a non-empty string
  if (typeof p.id !== 'string' || p.id.trim() === '') {
    throw new PluginValidationError(
      String(p.id ?? 'unknown'),
      'Plugin must have a non-empty string "id" property'
    );
  }

  const pluginId = p.id;

  // npmPackage is optional but must be a string if present
  if (p.npmPackage !== undefined && typeof p.npmPackage !== 'string') {
    throw new PluginValidationError(pluginId, '"npmPackage" must be a string');
  }

  // dependencies is optional but must be an array of functions if present
  if (p.dependencies !== undefined) {
    if (!Array.isArray(p.dependencies)) {
      throw new PluginValidationError(pluginId, '"dependencies" must be an array');
    }
    for (let i = 0; i < p.dependencies.length; i++) {
      if (typeof p.dependencies[i] !== 'function') {
        throw new PluginValidationError(
          pluginId,
          `dependencies[${i}] must be a function returning a Promise`
        );
      }
    }
  }

  // hookHandlers is optional but must have valid structure if present
  if (p.hookHandlers !== undefined) {
    if (!p.hookHandlers || typeof p.hookHandlers !== 'object') {
      throw new PluginValidationError(pluginId, '"hookHandlers" must be an object');
    }
    validateHookHandlers(pluginId, p.hookHandlers as Record<string, unknown>);
  }

  // tasks is optional but must be an array of task definitions if present
  if (p.tasks !== undefined) {
    if (!Array.isArray(p.tasks)) {
      throw new PluginValidationError(pluginId, '"tasks" must be an array');
    }
    for (let i = 0; i < p.tasks.length; i++) {
      validateTaskDefinition(pluginId, i, p.tasks[i]);
    }
  }
}

/**
 * Validate hook handlers structure
 */
function validateHookHandlers(
  pluginId: string,
  handlers: Record<string, unknown>
): void {
  // config hooks
  if (handlers.config !== undefined) {
    if (!handlers.config || typeof handlers.config !== 'object') {
      throw new PluginValidationError(pluginId, '"hookHandlers.config" must be an object');
    }
    const config = handlers.config as Record<string, unknown>;

    if (config.extendUserConfig !== undefined && typeof config.extendUserConfig !== 'function') {
      throw new PluginValidationError(
        pluginId,
        '"hookHandlers.config.extendUserConfig" must be a function'
      );
    }
    if (config.validateUserConfig !== undefined && typeof config.validateUserConfig !== 'function') {
      throw new PluginValidationError(
        pluginId,
        '"hookHandlers.config.validateUserConfig" must be a function'
      );
    }
    if (config.resolveUserConfig !== undefined && typeof config.resolveUserConfig !== 'function') {
      throw new PluginValidationError(
        pluginId,
        '"hookHandlers.config.resolveUserConfig" must be a function'
      );
    }
  }

  // runtime hooks
  if (handlers.runtime !== undefined) {
    if (!handlers.runtime || typeof handlers.runtime !== 'object') {
      throw new PluginValidationError(pluginId, '"hookHandlers.runtime" must be an object');
    }
    const runtime = handlers.runtime as Record<string, unknown>;

    if (runtime.created !== undefined && typeof runtime.created !== 'function') {
      throw new PluginValidationError(
        pluginId,
        '"hookHandlers.runtime.created" must be a function'
      );
    }
  }
}

/**
 * Validate a task definition within a plugin
 */
function validateTaskDefinition(
  pluginId: string,
  index: number,
  task: unknown
): void {
  if (!task || typeof task !== 'object') {
    throw new PluginValidationError(pluginId, `tasks[${index}] must be an object`);
  }

  const t = task as Record<string, unknown>;

  if (typeof t.name !== 'string' || t.name.trim() === '') {
    throw new PluginValidationError(
      pluginId,
      `tasks[${index}] must have a non-empty string "name" property`
    );
  }

  if (typeof t.description !== 'string') {
    throw new PluginValidationError(
      pluginId,
      `tasks[${index}] must have a string "description" property`
    );
  }

  if (typeof t.action !== 'function') {
    throw new PluginValidationError(
      pluginId,
      `tasks[${index}] must have a function "action" property`
    );
  }
}
