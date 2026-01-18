/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { confirm } from '@inquirer/prompts';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import { CompilerManager } from '../../compiler/manager.js';

/**
 * Cache entry for a compiled contract
 */
interface CacheEntry {
  sourceHash: string;
  compilerVersion: string;
  timestamp: number;
}

/**
 * Cache manifest
 */
interface CacheManifest {
  entries: Record<string, CacheEntry>;
}

/**
 * Get the cache directory
 */
function getCacheDir(projectDir: string): string {
  return join(projectDir, '.nightcap', 'cache');
}

/**
 * Get the cache manifest path
 */
function getCacheManifestPath(projectDir: string): string {
  return join(getCacheDir(projectDir), 'manifest.json');
}

/**
 * Load cache manifest
 */
async function loadCacheManifest(projectDir: string): Promise<CacheManifest> {
  const manifestPath = getCacheManifestPath(projectDir);
  try {
    if (existsSync(manifestPath)) {
      const content = await readFile(manifestPath, 'utf8');
      return JSON.parse(content) as CacheManifest;
    }
  } catch {
    // Ignore errors, return empty manifest
  }
  return { entries: {} };
}

/**
 * Save cache manifest
 */
async function saveCacheManifest(projectDir: string, manifest: CacheManifest): Promise<void> {
  const cacheDir = getCacheDir(projectDir);
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }
  const manifestPath = getCacheManifestPath(projectDir);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

/**
 * Hash file contents
 */
async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Discover .compact files in a directory recursively
 */
function discoverContracts(dir: string, exclude: string[] = []): string[] {
  const contracts: string[] = [];

  if (!existsSync(dir)) {
    return contracts;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    // Check exclusions
    const shouldExclude = exclude.some(pattern => {
      if (pattern.includes('*')) {
        // Simple glob matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fullPath);
      }
      return fullPath.includes(pattern);
    });

    if (shouldExclude) continue;

    if (stat.isDirectory()) {
      contracts.push(...discoverContracts(fullPath, exclude));
    } else if (entry.endsWith('.compact')) {
      contracts.push(fullPath);
    }
  }

  return contracts;
}

/**
 * Compile task - compiles Compact contracts
 */
export const compileTask: TaskDefinition = {
  name: 'compile',
  description: 'Compile Compact contracts',
  params: {
    force: {
      type: 'boolean',
      description: 'Force recompilation, ignoring cache',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const force = context.params['force'] === true;

    // Get source and artifact directories from config
    const sourcesDir = join(cwd, context.config.paths?.sources ?? 'contracts');
    const artifactsDir = join(cwd, context.config.paths?.artifacts ?? 'artifacts');

    // Check source directory exists
    if (!existsSync(sourcesDir)) {
      logger.error(`Source directory not found: ${sourcesDir}`);
      logger.info('Run "nightcap init" to create a new project');
      throw new Error('Source directory not found');
    }

    // Discover contracts
    const contracts = discoverContracts(sourcesDir);

    if (contracts.length === 0) {
      logger.info('No Compact contracts found to compile');
      return;
    }

    logger.info(`Found ${contracts.length} contract(s) to compile`);

    // Initialize compiler manager
    const compilerManager = new CompilerManager();

    // Get compiler version from config or use default
    const requestedVersion = context.config.compact?.version;
    let compilerPath = await compilerManager.getCompiler(requestedVersion);

    // If no compiler found, try to install
    if (!compilerPath) {
      logger.warn('Compact compiler (compactc) not found');

      if (requestedVersion) {
        logger.info(`Attempting to install compactc ${requestedVersion}...`);
        try {
          compilerPath = await compilerManager.install(requestedVersion);
        } catch (error) {
          logger.error(`Failed to install compiler: ${error instanceof Error ? error.message : String(error)}`);
          logger.info('Install manually: curl --proto "=https" --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh');
          throw new Error('Compiler not available');
        }
      } else {
        logger.info('Install compactc manually or specify version in config:');
        logger.log('  nightcap.config.ts: { compact: { version: "0.26.0" } }');
        throw new Error('Compiler not available');
      }
    }

    // Get compiler version
    const compilerVersion = compilerManager.getVersion(compilerPath) ?? 'unknown';
    logger.info(`Using compactc ${compilerVersion}`);

    // Load cache manifest
    const manifest = force ? { entries: {} } : await loadCacheManifest(cwd);

    // Create artifacts directory
    if (!existsSync(artifactsDir)) {
      await mkdir(artifactsDir, { recursive: true });
    }

    // Compile each contract
    let compiled = 0;
    let skipped = 0;
    let failed = 0;

    for (const contractPath of contracts) {
      const relativePath = relative(cwd, contractPath);
      const contractName = basename(contractPath, '.compact');

      // Check cache
      if (!force && manifest.entries[relativePath]) {
        const entry = manifest.entries[relativePath];
        const currentHash = await hashFile(contractPath);

        if (entry?.sourceHash === currentHash && entry?.compilerVersion === compilerVersion) {
          logger.debug(`Skipping ${contractName} (cached)`);
          skipped++;
          continue;
        }
      }

      // Compile
      logger.info(`Compiling ${contractName}...`);
      const result = await compilerManager.compile(contractPath, artifactsDir, compilerPath);

      if (result.success) {
        compiled++;

        // Update cache
        manifest.entries[relativePath] = {
          sourceHash: await hashFile(contractPath),
          compilerVersion,
          timestamp: Date.now(),
        };

        if (result.warnings && result.warnings.length > 0) {
          for (const warning of result.warnings) {
            logger.warn(warning);
          }
        }
      } else {
        failed++;
        logger.error(`Failed to compile ${contractName}:`);
        if (result.errors) {
          for (const error of result.errors) {
            logger.log(formatCompilationError(error));
          }
        }
      }
    }

    // Save cache
    await saveCacheManifest(cwd, manifest);

    // Summary
    logger.newline();
    if (failed > 0) {
      logger.error(`Compilation failed: ${failed} error(s)`);
      throw new Error('Compilation failed');
    } else if (compiled > 0) {
      logger.success(`Compiled ${compiled} contract(s)`);
      if (skipped > 0) {
        logger.info(`Skipped ${skipped} unchanged contract(s)`);
      }
    } else if (skipped > 0) {
      logger.info('Nothing to compile (all contracts up to date)');
      logger.info('Use --force to recompile');
    }
  },
};

/**
 * Format a compilation error for display
 */
function formatCompilationError(error: string): string {
  // Try to parse structured error output
  // Format: file:line:col: error: message
  const match = /^(.+):(\d+):(\d+):\s*(\w+):\s*(.+)$/m.exec(error);

  if (match) {
    const [, file, line, col, type, message] = match;
    return `  ${file}:${line}:${col}\n  ${type}: ${message}`;
  }

  // Return as-is if not structured
  return `  ${error}`;
}

/**
 * Clean task - removes artifacts and cache
 */
export const cleanTask: TaskDefinition = {
  name: 'clean',
  description: 'Remove compiled artifacts and cache',
  params: {
    force: {
      type: 'boolean',
      description: 'Skip confirmation prompt',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const force = context.params['force'] === true;

    const artifactsDir = join(cwd, context.config.paths?.artifacts ?? 'artifacts');
    const cacheDir = getCacheDir(cwd);

    const toClean: string[] = [];
    if (existsSync(artifactsDir)) toClean.push(artifactsDir);
    if (existsSync(cacheDir)) toClean.push(cacheDir);

    if (toClean.length === 0) {
      logger.info('Nothing to clean');
      return;
    }

    logger.info('The following directories will be cleaned:');
    for (const dir of toClean) {
      logger.log(`  ${relative(cwd, dir)}/`);
    }

    if (!force) {
      const proceed = await confirm({
        message: 'Proceed with cleaning?',
        default: true,
      });

      if (!proceed) {
        logger.info('Clean cancelled');
        return;
      }
    }

    // Remove directories
    for (const dir of toClean) {
      await rm(dir, { recursive: true, force: true });
      logger.debug(`Removed ${dir}`);
    }

    // Recreate artifacts with .gitkeep
    await mkdir(artifactsDir, { recursive: true });
    await writeFile(join(artifactsDir, '.gitkeep'), '', 'utf8');

    logger.success('Clean complete');
  },
};

/**
 * Compiler list task
 */
export const compilerListTask: TaskDefinition = {
  name: 'compiler:list',
  description: 'List installed Compact compiler versions',

  async action(_context: TaskContext): Promise<void> {
    const manager = new CompilerManager();
    const versions = manager.listInstalled();

    if (versions.length === 0) {
      logger.info('No Compact compilers installed');
      logger.info('Install with: nightcap compiler:install <version>');
      return;
    }

    logger.info('Installed compilers:');
    for (const v of versions) {
      const marker = v.isDefault ? ' (default)' : '';
      logger.log(`  ${v.version}${marker}`);
      logger.log(`    ${v.path}`);
    }
  },
};

/**
 * Compiler install task
 */
export const compilerInstallTask: TaskDefinition = {
  name: 'compiler:install',
  description: 'Install a Compact compiler version',
  params: {
    'compiler-version': {
      type: 'string',
      description: 'Compiler version to install (e.g., 0.26.0)',
      required: true,
    },
    prerelease: {
      type: 'boolean',
      description: 'Install from prerelease channel',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    // Commander.js converts kebab-case to camelCase
    const version = context.params['compilerVersion'] as string;
    const prerelease = context.params['prerelease'] === true;

    if (!version) {
      logger.error('Version is required');
      logger.info('Usage: nightcap compiler:install --compiler-version <version>');
      throw new Error('Version required');
    }

    const manager = new CompilerManager();

    try {
      await manager.install(version, prerelease);
    } catch (error) {
      logger.error(`Failed to install compiler: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
};
