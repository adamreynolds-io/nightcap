/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { TaskDefinition, TaskContext, NightcapConfig, NetworkConfig } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Script context provided to executed scripts
 */
export interface ScriptContext {
  /** Nightcap configuration */
  config: NightcapConfig;
  /** Current network configuration */
  network: NetworkConfig;
  /** Name of the current network */
  networkName: string;
  /** Helper to get a deployed contract address */
  getDeployedAddress: (contractName: string) => string | undefined;
  /** Logger for script output */
  log: typeof logger;
}

/**
 * Load deployment history for a network
 */
function loadDeploymentHistory(
  deploymentsDir: string,
  networkName: string
): Map<string, string> {
  const addresses = new Map<string, string>();
  const networkDir = path.join(deploymentsDir, networkName);

  if (!fs.existsSync(networkDir)) {
    return addresses;
  }

  const files = fs.readdirSync(networkDir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(path.join(networkDir, file.name), 'utf-8');
        const deployment = JSON.parse(content);
        if (deployment.address && deployment.contractName) {
          addresses.set(deployment.contractName, deployment.address);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  return addresses;
}

/**
 * Run task definition
 */
export const runTask: TaskDefinition = {
  name: 'run',
  description: 'Execute a standalone script with Nightcap context',

  params: {
    script: {
      type: 'string',
      description: 'Path to the script to execute',
      required: true,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const { config, network, networkName, params } = context;
    const scriptPath = params.script as string;

    if (!scriptPath) {
      logger.error('Script path is required');
      logger.info('Usage: nightcap run --script <path>');
      throw new Error('Missing script path');
    }

    // Resolve script path
    const cwd = process.cwd();
    const absolutePath = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.resolve(cwd, scriptPath);

    // Verify script exists
    if (!fs.existsSync(absolutePath)) {
      logger.error(`Script not found: ${absolutePath}`);
      throw new Error(`Script not found: ${absolutePath}`);
    }

    // Load deployment history for getDeployedAddress helper
    const deploymentsDir = path.resolve(cwd, config.paths?.deployments ?? 'deployments');
    const deploymentHistory = loadDeploymentHistory(deploymentsDir, networkName);

    // Create script context
    const scriptContext: ScriptContext = {
      config,
      network,
      networkName,
      getDeployedAddress: (contractName: string) => deploymentHistory.get(contractName),
      log: logger,
    };

    // Make context available globally for the script
    (globalThis as Record<string, unknown>).nightcap = scriptContext;

    logger.info(`Running script: ${path.relative(cwd, absolutePath)}`);
    logger.info(`Network: ${networkName}`);
    logger.info('');

    try {
      // Import and execute the script
      const scriptUrl = pathToFileURL(absolutePath).href;
      const scriptModule = await import(scriptUrl);

      // If script exports a default function, call it with context
      if (typeof scriptModule.default === 'function') {
        await scriptModule.default(scriptContext);
      }
      // If script exports a main function, call it with context
      else if (typeof scriptModule.main === 'function') {
        await scriptModule.main(scriptContext);
      }
      // Otherwise, the script's top-level code has already executed

      logger.success('Script completed successfully');
    } catch (error) {
      logger.error(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
      if (context.verbose && error instanceof Error && error.stack) {
        logger.debug(error.stack);
      }
      throw error;
    } finally {
      // Clean up global context
      delete (globalThis as Record<string, unknown>).nightcap;
    }
  },
};
