/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NightcapConfig } from '../tasks/types.js';
import { createDefaultConfig } from './defaults.js';
import { validateConfig, ConfigValidationError } from './validator.js';
import { logger } from '../utils/logger.js';

/**
 * Supported config file names in order of preference
 */
const CONFIG_FILE_NAMES = [
  'nightcap.config.ts',
  'nightcap.config.mts',
  'nightcap.config.js',
  'nightcap.config.mjs',
];

/**
 * Find the config file in the current directory or ancestors
 */
function findConfigFile(startDir: string = process.cwd()): string | undefined {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);

  while (currentDir !== root) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = resolve(currentDir, fileName);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    currentDir = dirname(currentDir);
  }

  return undefined;
}

/**
 * Load a TypeScript or JavaScript config file
 */
async function loadConfigFile(configPath: string): Promise<unknown> {
  const ext = configPath.split('.').pop();

  if (ext === 'ts' || ext === 'mts') {
    // Try to use tsx or ts-node for TypeScript files
    // First, try native import with tsx
    try {
      const fileUrl = pathToFileURL(configPath).href;
      const module = (await import(fileUrl)) as { default?: unknown };
      return module.default ?? module;
    } catch (error) {
      // If native import fails, provide helpful error
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.includes('Unknown file extension')) {
        throw new Error(
          `Cannot load TypeScript config file directly. ` +
          `Install tsx globally (npm i -g tsx) and run with: tsx --import nightcap, ` +
          `or use a .js/.mjs config file instead.`
        );
      }
      throw error;
    }
  }

  // For JS/MJS files, use native import
  const fileUrl = pathToFileURL(configPath).href;
  const module = (await import(fileUrl)) as { default?: unknown };
  return module.default ?? module;
}

/**
 * Merge user config with defaults
 */
function mergeConfigs(
  defaults: NightcapConfig,
  userConfig: NightcapConfig
): NightcapConfig {
  return {
    defaultNetwork: userConfig.defaultNetwork ?? defaults.defaultNetwork,
    networks: {
      ...defaults.networks,
      ...userConfig.networks,
    },
    docker: {
      ...defaults.docker,
      ...userConfig.docker,
      images: {
        ...defaults.docker?.images,
        ...userConfig.docker?.images,
      },
    },
    paths: {
      ...defaults.paths,
      ...userConfig.paths,
    },
    tasks: userConfig.tasks,
  };
}

/**
 * Load and validate the Nightcap configuration
 */
export async function loadConfig(
  configPath?: string
): Promise<NightcapConfig> {
  const defaults = createDefaultConfig();

  // If explicit path provided, it must exist
  if (configPath) {
    const resolvedPath = resolve(configPath);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }

    logger.debug(`Loading config from: ${resolvedPath}`);
    const rawConfig = await loadConfigFile(resolvedPath);
    const validatedConfig = validateConfig(rawConfig);
    return mergeConfigs(defaults, validatedConfig);
  }

  // Auto-discover config file
  const discoveredPath = findConfigFile();

  if (!discoveredPath) {
    logger.debug('No config file found, using defaults');
    return defaults;
  }

  logger.debug(`Found config file: ${discoveredPath}`);

  try {
    const rawConfig = await loadConfigFile(discoveredPath);
    const validatedConfig = validateConfig(rawConfig);
    return mergeConfigs(defaults, validatedConfig);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw new Error(
        `Invalid configuration at ${error.path}: ${error.message}`
      );
    }
    throw error;
  }
}

export { ConfigValidationError };
