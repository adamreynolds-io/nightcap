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
import { generateCompletion, getSupportedShells, type ShellType } from './completion.js';
import {
  resolvePluginList,
  HookManager,
  PluginValidationError,
  PluginDependencyCycleError,
  PluginLoadError,
  ConfigValidationError,
} from '../plugins/index.js';
import type { NightcapConfig, TaskContext, TaskDefinition, RuntimeEnvironment } from '../tasks/types.js';
import type { NightcapUserConfig, ResolvedNightcapConfig, NightcapPlugin, NightcapRuntimeEnvironment } from '../plugins/index.js';

const VERSION = '0.0.1';

/**
 * Module-level runtime environment populated by plugins.
 * This is set during CLI initialization and passed to task contexts.
 */
let runtimeEnv: RuntimeEnvironment | undefined;

interface GlobalOptions {
  network: string;
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
}

/**
 * Register custom tasks from config
 */
function registerCustomTasks(registry: TaskRegistry, config: NightcapConfig): void {
  if (!config.tasks) {
    return;
  }

  for (const [name, customTask] of Object.entries(config.tasks)) {
    try {
      registry.registerCustom(name, customTask);
      logger.debug(`Registered custom task: ${name}`);
    } catch (error) {
      logger.warn(`Failed to register custom task '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Register tasks from plugins
 */
function registerPluginTasks(registry: TaskRegistry, plugins: NightcapPlugin[]): void {
  for (const plugin of plugins) {
    if (!plugin.tasks) {
      continue;
    }
    for (const task of plugin.tasks) {
      try {
        registry.register(task);
        logger.debug(`Registered task '${task.name}' from plugin '${plugin.id}'`);
      } catch (error) {
        logger.warn(
          `Failed to register task '${task.name}' from plugin '${plugin.id}': ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }
}

/**
 * Handle plugin-related errors with helpful messages
 */
function handlePluginError(error: unknown): never {
  if (error instanceof PluginValidationError) {
    logger.error(`Plugin validation error: ${error.message}`);
  } else if (error instanceof PluginDependencyCycleError) {
    logger.error(`Circular plugin dependency: ${error.cycle.join(' -> ')}`);
  } else if (error instanceof PluginLoadError) {
    logger.error(`Failed to load plugin dependency: ${error.message}`);
  } else if (error instanceof ConfigValidationError) {
    logger.error('Configuration validation failed:');
    for (const err of error.errors) {
      logger.error(`  - ${err}`);
    }
  } else {
    logger.error(`Plugin error: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
}

/**
 * Create a task action handler that provides runSuper support
 */
function createTaskAction(
  task: TaskDefinition,
  registry: TaskRegistry,
  runner: TaskRunner,
  program: Command
): (options: Record<string, unknown>) => Promise<void> {
  return async (options: Record<string, unknown>) => {
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

    // Create context with runSuper if this task overrides another
    const context: TaskContext = {
      config,
      network,
      networkName,
      params: options,
      verbose: globalOpts.verbose ?? false,
      env: runtimeEnv,
    };

    // Add runSuper if this task has an original
    if (registry.hasOriginal(task.name)) {
      const original = registry.getOriginal(task.name);
      if (original) {
        context.runSuper = () => original.action(context);
      }
    }

    try {
      await runner.run(task.name, context);
    } catch (error) {
      logger.error(`Task '${task.name}' failed: ${error instanceof Error ? error.message : String(error)}`);
      if (globalOpts.verbose && error instanceof Error && error.stack) {
        logger.debug(error.stack);
      }
      process.exit(1);
    }
  };
}

/**
 * Register a task as a Commander command
 */
function registerCommand(
  program: Command,
  task: TaskDefinition,
  registry: TaskRegistry,
  runner: TaskRunner
): void {
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

  cmd.action(createTaskAction(task, registry, runner, program));
}

async function main(): Promise<void> {
  const program = new Command();

  // Initialize task registry and register built-in tasks
  const registry = new TaskRegistry();
  registerBuiltinTasks(registry);

  // Pre-load config and plugins before setting up Commander commands
  let resolvedConfig: ResolvedNightcapConfig | undefined;
  let hookManager: HookManager | undefined;

  try {
    // Check for --config flag in argv
    const configArgIndex = process.argv.indexOf('--config');
    const configPath = configArgIndex !== -1 ? process.argv[configArgIndex + 1] : undefined;
    const userConfig = (await loadConfig(configPath)) as NightcapUserConfig;

    // Resolve plugins (topological sort via DFS)
    const plugins = await resolvePluginList(userConfig.plugins ?? []);

    // Create hook manager and register plugins
    hookManager = new HookManager();
    for (const plugin of plugins) {
      hookManager.registerPlugin(plugin);
      logger.debug(`Registered plugin: ${plugin.id}`);
    }

    // Run config hooks to get resolved config
    resolvedConfig = await hookManager.runConfigHooks(userConfig, plugins);

    // Register custom tasks from config
    registerCustomTasks(registry, resolvedConfig);

    // Register tasks from plugins (later plugins can override earlier ones)
    registerPluginTasks(registry, plugins);
  } catch (error) {
    // Check if this is a plugin-related error
    if (
      error instanceof PluginValidationError ||
      error instanceof PluginDependencyCycleError ||
      error instanceof PluginLoadError ||
      error instanceof ConfigValidationError
    ) {
      handlePluginError(error);
    }
    // Config loading may fail here, but that's OK for some commands
    // We'll handle errors later when executing tasks that need config
    logger.debug(
      `Config preload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

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

  // Add completion command
  const supportedShells = getSupportedShells();
  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', `Shell type (${supportedShells.join(', ')})`)
    .action((shell: string) => {
      if (!supportedShells.includes(shell as ShellType)) {
        logger.error(`Unsupported shell: ${shell}`);
        logger.info(`Supported shells: ${supportedShells.join(', ')}`);
        process.exit(1);
      }

      const tasks = registry.getAllTasks();
      const script = generateCompletion(shell as ShellType, tasks);
      console.log(script);
    });

  // Register all tasks (built-in + custom + plugin) as commands
  for (const task of registry.getAllTasks()) {
    registerCommand(program, task, registry, runner);
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

  // Run runtime hooks if we have a resolved config
  if (resolvedConfig && hookManager) {
    try {
      // Create the runtime environment
      const runTaskFn = async (name: string, params?: Record<string, unknown>) => {
        const task = registry.get(name);
        if (!task) {
          throw new Error(`Unknown task: ${name}`);
        }
        const networkName = resolvedConfig!.defaultNetwork ?? 'localnet';
        const network = resolvedConfig!.networks?.[networkName];
        if (!network) {
          throw new Error(`Unknown network: ${networkName}`);
        }
        const context: TaskContext = {
          config: resolvedConfig!,
          network,
          networkName,
          params: params ?? {},
          verbose: false,
          env: runtimeEnv,
        };
        await runner.run(name, context);
      };

      // Create runtime environment for plugins to extend
      const nightcapEnv: NightcapRuntimeEnvironment = {
        config: resolvedConfig,
        runTask: runTaskFn,
      };

      // Run extendEnvironment hooks - plugins add their namespaces here
      await hookManager.runExtendEnvironmentHooks(nightcapEnv);

      // Store the environment for task contexts (extract plugin extensions)
      const { config: _config, runTask: _runTask, ...extensions } = nightcapEnv;
      runtimeEnv = extensions;

      // Run created hooks
      await hookManager.runRuntimeCreatedHooks({
        config: resolvedConfig,
        runTask: runTaskFn,
      });
    } catch (error) {
      logger.error(
        `Runtime hook failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  // Parse with all commands registered
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
