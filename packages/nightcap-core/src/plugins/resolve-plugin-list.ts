/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapPlugin } from './types.js';
import { validatePlugin, PluginValidationError } from './validation.js';

/**
 * Error thrown when there's a cycle in plugin dependencies
 */
export class PluginDependencyCycleError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected in plugins: ${cycle.join(' -> ')}`);
    this.name = 'PluginDependencyCycleError';
  }
}

/**
 * Error thrown when a plugin dependency fails to load
 */
export class PluginLoadError extends Error {
  constructor(
    public readonly pluginId: string,
    public readonly cause: unknown
  ) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to load dependency of plugin '${pluginId}': ${causeMessage}`);
    this.name = 'PluginLoadError';
  }
}

/**
 * Resolve plugins with topological sort via DFS.
 * Dependencies are loaded first, ensuring plugins are ordered correctly.
 *
 * Based on Hardhat 3's resolve-plugin-list.ts
 *
 * @param plugins - Array of plugins to resolve
 * @returns Topologically sorted array of plugins (dependencies first)
 */
export async function resolvePluginList(
  plugins: NightcapPlugin[]
): Promise<NightcapPlugin[]> {
  const resolved: NightcapPlugin[] = [];
  const seen = new Map<string, NightcapPlugin>();
  const visiting = new Set<string>(); // For cycle detection

  async function visit(plugin: NightcapPlugin, path: string[]): Promise<void> {
    // Validate plugin structure
    try {
      validatePlugin(plugin);
    } catch (error) {
      if (error instanceof PluginValidationError) {
        throw error;
      }
      throw new PluginValidationError(
        plugin.id ?? 'unknown',
        error instanceof Error ? error.message : String(error)
      );
    }

    // Check for cycles
    if (visiting.has(plugin.id)) {
      const cycleStart = path.indexOf(plugin.id);
      const cycle = [...path.slice(cycleStart), plugin.id];
      throw new PluginDependencyCycleError(cycle);
    }

    // Already processed this plugin
    if (seen.has(plugin.id)) {
      const existing = seen.get(plugin.id)!;
      if (existing !== plugin) {
        throw new PluginValidationError(
          plugin.id,
          `Duplicate plugin id '${plugin.id}' with different instances. ` +
            'Ensure each plugin is only added once to the plugins array.'
        );
      }
      return;
    }

    // Mark as visiting (for cycle detection)
    visiting.add(plugin.id);

    // Resolve dependencies first (DFS)
    if (plugin.dependencies) {
      for (const depLoader of plugin.dependencies) {
        let dep: NightcapPlugin;
        try {
          const module = await depLoader();
          dep = module.default;
        } catch (error) {
          throw new PluginLoadError(plugin.id, error);
        }

        await visit(dep, [...path, plugin.id]);
      }
    }

    // Done visiting
    visiting.delete(plugin.id);

    // Mark as seen and add to resolved list
    seen.set(plugin.id, plugin);
    resolved.push(plugin);
  }

  // Visit all plugins
  for (const plugin of plugins) {
    await visit(plugin, []);
  }

  return resolved;
}
