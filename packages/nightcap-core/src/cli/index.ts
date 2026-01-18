#!/usr/bin/env node
/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { Command } from 'commander';
import { loadConfig } from '../config/loader.js';
import { TaskRegistry } from '../tasks/registry.js';
import { TaskRunner } from '../tasks/runner.js';
import { registerBuiltinTasks } from '../tasks/builtin/index.js';
import { logger, LogLevel } from '../utils/logger.js';
import type { NightcapConfig, TaskContext } from '../tasks/types.js';

const VERSION = '0.0.1';

interface GlobalOptions {
  network: string;
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
}

async function main(): Promise<void> {
  const program = new Command();

  // Initialize task registry and register built-in tasks first
  const registry = new TaskRegistry();
  registerBuiltinTasks(registry);

  // Create task runner
  const runner = new TaskRunner(registry);

  program
    .name('nightcap')
    .description('A development environment for Midnight blockchain')
    .version(VERSION, '-v, --version', 'Output the current version')
    .option('--network <name>', 'Network to use', 'localnet')
    .option('--verbose', 'Enable verbose output')
    .option('--quiet', 'Suppress non-essential output')
    .option('--config <path>', 'Path to config file');

  // Register tasks as commands before parsing
  for (const task of registry.getAllTasks()) {
    const cmd = program
      .command(task.name)
      .description(task.description);

    // Add task-specific parameters
    if (task.params) {
      for (const [name, paramDef] of Object.entries(task.params)) {
        const flag = paramDef.type === 'boolean'
          ? `--${name}`
          : `--${name} <value>`;

        if (paramDef.required) {
          cmd.requiredOption(flag, paramDef.description);
        } else {
          cmd.option(flag, paramDef.description, paramDef.default?.toString());
        }
      }
    }

    cmd.action(async (options: Record<string, unknown>) => {
      const globalOpts = program.opts<GlobalOptions>();

      // Set log level based on flags
      if (globalOpts.verbose) {
        logger.setLevel(LogLevel.Debug);
      } else if (globalOpts.quiet) {
        logger.setLevel(LogLevel.Warn);
      }

      // Load configuration
      let config: NightcapConfig;
      try {
        config = await loadConfig(globalOpts.config);
      } catch (error) {
        logger.error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }

      const networkName = globalOpts.network ?? config.defaultNetwork ?? 'localnet';
      const network = config.networks?.[networkName];

      if (!network) {
        logger.error(`Unknown network: ${networkName}`);
        const availableNetworks = Object.keys(config.networks ?? {}).join(', ');
        if (availableNetworks) {
          logger.info(`Available networks: ${availableNetworks}`);
        }
        process.exit(1);
      }

      const context: TaskContext = {
        config,
        network,
        networkName,
        params: options,
        verbose: globalOpts.verbose ?? false,
      };

      try {
        await runner.run(task.name, context);
      } catch (error) {
        logger.error(`Task '${task.name}' failed: ${error instanceof Error ? error.message : String(error)}`);
        if (globalOpts.verbose && error instanceof Error && error.stack) {
          logger.debug(error.stack);
        }
        process.exit(1);
      }
    });
  }

  // Handle unknown commands
  program.on('command:*', (operands: string[]) => {
    const unknownCommand = operands[0];
    logger.error(`Unknown command: ${unknownCommand}`);

    // Suggest similar commands
    const allCommands = registry.getAllTasks().map(t => t.name);
    const suggestions = allCommands.filter(cmd =>
      cmd.includes(unknownCommand ?? '') || (unknownCommand?.includes(cmd) ?? false)
    );

    if (suggestions.length > 0) {
      logger.info(`Did you mean: ${suggestions.join(', ')}?`);
    }

    logger.info('Run "nightcap --help" for available commands');
    process.exit(1);
  });

  // Parse with all commands registered
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
