/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import { compileTask } from './compile.js';

/**
 * Discover test files in a directory recursively
 */
function discoverTests(dir: string): string[] {
  const tests: string[] = [];

  if (!existsSync(dir)) {
    return tests;
  }

  // Simple recursive discovery - actual pattern matching done by Vitest
  function walk(currentDir: string): void {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      // Skip node_modules and artifacts
      if (entry === 'node_modules' || entry === 'artifacts' || entry === 'dist') {
        continue;
      }

      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.endsWith('.test.ts') ||
        entry.endsWith('.spec.ts') ||
        entry.endsWith('.test.js') ||
        entry.endsWith('.spec.js')
      ) {
        tests.push(fullPath);
      }
    }
  }

  walk(dir);
  return tests;
}

/**
 * Run Vitest with the given arguments
 */
async function runVitest(args: string[], cwd: string): Promise<{ code: number }> {
  return new Promise((resolve) => {
    // Try to find vitest in node_modules
    const vitestPaths = [
      join(cwd, 'node_modules', '.bin', 'vitest'),
      join(cwd, 'node_modules', 'vitest', 'vitest.mjs'),
    ];

    let vitestPath: string | undefined;
    for (const p of vitestPaths) {
      if (existsSync(p)) {
        vitestPath = p;
        break;
      }
    }

    if (!vitestPath) {
      logger.error('Vitest not found. Install with: pnpm add -D vitest');
      resolve({ code: 1 });
      return;
    }

    logger.debug(`Running vitest: ${vitestPath} ${args.join(' ')}`);

    const child = spawn(vitestPath, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (error) => {
      logger.error(`Failed to start vitest: ${error.message}`);
      resolve({ code: 1 });
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 0 });
    });
  });
}

/**
 * Test task - runs tests using Vitest
 */
export const testTask: TaskDefinition = {
  name: 'test',
  description: 'Run contract tests using Vitest',
  params: {
    watch: {
      type: 'boolean',
      description: 'Run in watch mode',
      default: false,
    },
    bail: {
      type: 'boolean',
      description: 'Stop on first test failure',
      default: false,
    },
    grep: {
      type: 'string',
      description: 'Filter tests by name pattern',
    },
    reporter: {
      type: 'string',
      description: 'Reporter format: default, verbose, json, junit',
      default: 'default',
    },
    coverage: {
      type: 'boolean',
      description: 'Enable code coverage',
      default: false,
    },
    'no-compile': {
      type: 'boolean',
      description: 'Skip contract compilation before testing',
      default: false,
    },
    parallel: {
      type: 'boolean',
      description: 'Run tests in parallel (default: true)',
      default: true,
    },
    workers: {
      type: 'number',
      description: 'Number of parallel workers',
    },
    update: {
      type: 'boolean',
      description: 'Update snapshots',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();

    // Get test directory from config
    const testDir = join(cwd, context.config.paths?.tests ?? 'test');

    // Compile contracts first (unless skipped)
    const noCompile = context.params['noCompile'] === true;
    if (!noCompile) {
      logger.info('Compiling contracts...');
      try {
        // Create a compile context with empty params
        const compileContext: TaskContext = {
          ...context,
          params: {},
        };
        await compileTask.action(compileContext);
      } catch (error) {
        logger.error('Compilation failed, aborting tests');
        throw error;
      }
    }

    // Discover tests
    const testFiles = discoverTests(testDir);

    if (testFiles.length === 0) {
      logger.info('No test files found');
      logger.info(`Test directory: ${relative(cwd, testDir)}`);
      logger.info('Create test files matching: *.test.ts, *.spec.ts');
      return;
    }

    logger.info(`Found ${testFiles.length} test file(s)`);

    // Build vitest args
    const args: string[] = ['run'];

    // Watch mode
    if (context.params['watch'] === true) {
      args[0] = 'watch';
    }

    // Bail on first failure
    if (context.params['bail'] === true) {
      args.push('--bail');
    }

    // Filter by name
    const grep = context.params['grep'] as string | undefined;
    if (grep) {
      args.push('--testNamePattern', grep);
    }

    // Reporter
    const reporter = context.params['reporter'] as string | undefined;
    if (reporter && reporter !== 'default') {
      args.push('--reporter', reporter);
    }

    // Coverage
    if (context.params['coverage'] === true) {
      args.push('--coverage');
    }

    // Parallel execution
    if (context.params['parallel'] === false) {
      args.push('--no-threads');
    }

    // Worker count
    const workers = context.params['workers'] as number | undefined;
    if (workers !== undefined) {
      args.push('--maxWorkers', String(workers));
    }

    // Update snapshots
    if (context.params['update'] === true) {
      args.push('--update');
    }

    // Pass the test directory
    args.push(testDir);

    // Run vitest
    logger.newline();
    const result = await runVitest(args, cwd);

    if (result.code !== 0) {
      throw new Error(`Tests failed with exit code ${result.code}`);
    }
  },
};

/**
 * Coverage task - runs tests with coverage enabled
 */
export const coverageTask: TaskDefinition = {
  name: 'coverage',
  description: 'Run tests with code coverage',
  params: {
    threshold: {
      type: 'number',
      description: 'Minimum coverage threshold percentage',
    },
    reporter: {
      type: 'string',
      description: 'Coverage reporter: text, lcov, html, json',
      default: 'text',
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const testDir = join(cwd, context.config.paths?.tests ?? 'test');

    // Compile first
    logger.info('Compiling contracts...');
    try {
      const compileContext: TaskContext = {
        ...context,
        params: {},
      };
      await compileTask.action(compileContext);
    } catch (error) {
      logger.error('Compilation failed, aborting coverage');
      throw error;
    }

    // Build vitest args for coverage
    const args: string[] = ['run', '--coverage'];

    // Coverage reporter
    const reporter = context.params['reporter'] as string | undefined;
    if (reporter) {
      args.push('--coverage.reporter', reporter);
    }

    // Threshold
    const threshold = context.params['threshold'] as number | undefined;
    if (threshold !== undefined) {
      args.push(
        '--coverage.branches', String(threshold),
        '--coverage.functions', String(threshold),
        '--coverage.lines', String(threshold),
        '--coverage.statements', String(threshold)
      );
    }

    args.push(testDir);

    // Run vitest with coverage
    logger.newline();
    const result = await runVitest(args, cwd);

    if (result.code !== 0) {
      throw new Error(`Coverage failed with exit code ${result.code}`);
    }
  },
};
