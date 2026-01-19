/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync } from 'node:fs';
import { writeFile, mkdir, cp } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { input, select, confirm, checkbox } from '@inquirer/prompts';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import {
  TEMPLATES,
  getTemplateFiles,
  getContractAwareTemplateFiles,
  type TemplateType,
  type DappInterface,
  type ProjectConfig,
} from '../../templates/index.js';
import {
  loadCompiledContract,
  isCompiledContract,
  toCamelCase,
} from '../../compiler/contract-loader.js';

/**
 * Detect which package manager to use
 */
function detectPackageManager(dir: string): 'npm' | 'yarn' | 'pnpm' {
  let current = dir;
  const root = dirname(current);

  while (current !== root) {
    if (existsSync(join(current, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(current, 'yarn.lock'))) return 'yarn';
    if (existsSync(join(current, 'package-lock.json'))) return 'npm';
    current = dirname(current);
  }

  return 'npm'; // Default to npm
}

/**
 * Check if directory is empty (ignoring hidden files and common files)
 */
function isDirectoryEmpty(dir: string): boolean {
  if (!existsSync(dir)) return true;

  const files = readdirSync(dir);
  const ignoredFiles = ['.git', '.gitignore', '.DS_Store', 'README.md', 'LICENSE'];

  return files.every(file => ignoredFiles.includes(file));
}

/**
 * Run package manager install
 */
async function runInstall(dir: string, packageManager: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(packageManager, ['install'], {
      cwd: dir,
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Write files to disk
 */
async function writeFiles(
  dir: string,
  files: Array<{ path: string; content: string }>,
  force: boolean
): Promise<{ written: string[]; skipped: string[] }> {
  const written: string[] = [];
  const skipped: string[] = [];

  // Resolve the target directory to an absolute path for security validation
  const resolvedDir = resolve(dir);

  for (const file of files) {
    const fullPath = join(dir, file.path);
    const resolvedPath = resolve(fullPath);

    // Security: Prevent path traversal attacks
    // Ensure the resolved path stays within the target directory
    if (!resolvedPath.startsWith(resolvedDir + '/') && resolvedPath !== resolvedDir) {
      throw new Error(`Path traversal attempt detected: ${file.path}`);
    }

    const fileDir = dirname(fullPath);

    // Create directory if needed
    if (!existsSync(fileDir)) {
      await mkdir(fileDir, { recursive: true });
    }

    // Check if file exists
    if (existsSync(fullPath) && !force) {
      skipped.push(file.path);
      continue;
    }

    await writeFile(fullPath, file.content, 'utf8');
    written.push(file.path);
  }

  return { written, skipped };
}

/**
 * Init task - create a new Nightcap project
 */
export const initTask: TaskDefinition = {
  name: 'init',
  description: 'Create a new Nightcap project',
  params: {
    template: {
      type: 'string',
      description: 'Project template (basic, dapp, library)',
    },
    force: {
      type: 'boolean',
      description: 'Overwrite existing files',
      default: false,
    },
    'skip-install': {
      type: 'boolean',
      description: 'Skip dependency installation',
      default: false,
    },
    name: {
      type: 'string',
      description: 'Project name',
    },
    cli: {
      type: 'boolean',
      description: 'Include CLI interface (dapp template)',
      default: false,
    },
    react: {
      type: 'boolean',
      description: 'Include React web app (dapp template)',
      default: false,
    },
    'from-contract': {
      type: 'string',
      description: 'Path to compiled contract directory to scaffold from',
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const force = context.params['force'] === true;
    const skipInstall = context.params['skip-install'] === true;
    const fromContract = context.params['from-contract'] as string | undefined;

    // Check if directory is empty
    if (!isDirectoryEmpty(cwd) && !force) {
      logger.warn('Current directory is not empty.');

      const proceed = await confirm({
        message: 'Continue and potentially overwrite files?',
        default: false,
      });

      if (!proceed) {
        logger.info('Initialization cancelled.');
        return;
      }
    }

    // Handle --from-contract mode
    if (fromContract) {
      await initFromContract(cwd, fromContract, context, force, skipInstall);
      return;
    }

    // Get project configuration
    let config: ProjectConfig;

    if (context.params['template'] && context.params['name']) {
      // Non-interactive mode
      const interfaces: DappInterface[] = [];
      if (context.params['cli'] === true) interfaces.push('cli');
      if (context.params['react'] === true) interfaces.push('react');

      config = {
        name: context.params['name'] as string,
        template: context.params['template'] as TemplateType,
        interfaces: interfaces.length > 0 ? interfaces : undefined,
      };
    } else {
      // Interactive mode
      logger.info('Creating a new Nightcap project...\n');

      const name = (context.params['name'] as string) ?? await input({
        message: 'Project name:',
        default: basename(cwd),
        validate: (value) => {
          if (!value.trim()) return 'Project name is required';
          if (!/^[a-z0-9-_]+$/i.test(value)) return 'Invalid project name (use letters, numbers, hyphens, underscores)';
          return true;
        },
      });

      const template = (context.params['template'] as TemplateType) ?? await select({
        message: 'Select a template:',
        choices: TEMPLATES.map(t => ({
          name: `${t.displayName} - ${t.description}`,
          value: t.name,
        })),
      });

      // Ask for interfaces if dapp template
      let interfaces: DappInterface[] | undefined;
      if (template === 'dapp') {
        // Check if interfaces were provided via CLI flags
        const cliFlag = context.params['cli'] === true;
        const reactFlag = context.params['react'] === true;

        if (cliFlag || reactFlag) {
          interfaces = [];
          if (cliFlag) interfaces.push('cli');
          if (reactFlag) interfaces.push('react');
        } else {
          // Interactive selection
          interfaces = await checkbox({
            message: 'What interfaces do you want?',
            choices: [
              { name: 'CLI tool', value: 'cli' as DappInterface },
              { name: 'React web app', value: 'react' as DappInterface },
            ],
          });
        }
      }

      const description = await input({
        message: 'Project description (optional):',
        default: '',
      });

      config = {
        name,
        template,
        description: description || undefined,
        interfaces,
      };
    }

    logger.newline();
    logger.info(`Creating ${config.template} project: ${config.name}`);

    // Generate files
    const files = getTemplateFiles(config);
    const { written, skipped } = await writeFiles(cwd, files, force);

    // Report results
    if (written.length > 0) {
      logger.success(`Created ${written.length} files:`);
      for (const file of written) {
        logger.log(`  + ${file}`);
      }
    }

    if (skipped.length > 0) {
      logger.warn(`Skipped ${skipped.length} existing files:`);
      for (const file of skipped) {
        logger.log(`  - ${file}`);
      }
    }

    // Install dependencies
    if (!skipInstall) {
      logger.newline();
      const packageManager = detectPackageManager(cwd);
      logger.info(`Installing dependencies with ${packageManager}...`);

      const success = await runInstall(cwd, packageManager);
      if (success) {
        logger.success('Dependencies installed successfully');
      } else {
        logger.warn('Failed to install dependencies. Run install manually.');
      }
    }

    // Show next steps
    logger.newline();
    logger.success('Project created successfully!');
    logger.newline();
    logger.info('Next steps:');
    logger.log('  1. Start the local network:');
    logger.log('     nightcap node');
    logger.newline();
    logger.log('  2. Compile your contracts:');
    logger.log('     nightcap compile');
    logger.newline();
    logger.log('  3. Run tests:');
    logger.log('     nightcap test');
    logger.newline();
    logger.info('Happy building on Midnight!');
  },
};

/**
 * Initialize project from a compiled contract
 */
async function initFromContract(
  cwd: string,
  contractPath: string,
  context: TaskContext,
  force: boolean,
  skipInstall: boolean
): Promise<void> {
  // Resolve the contract path
  const resolvedContractPath = resolve(contractPath);

  // Validate that the contract path exists and is a valid compiled contract
  if (!existsSync(resolvedContractPath)) {
    logger.error(`Contract path does not exist: ${resolvedContractPath}`);
    throw new Error(`Contract path does not exist: ${resolvedContractPath}`);
  }

  if (!isCompiledContract(resolvedContractPath)) {
    logger.error(`No valid compiled contract found at: ${resolvedContractPath}`);
    logger.info('Expected to find index.cjs or index.js in contract/ subdirectory or root.');
    throw new Error(`No valid compiled contract found at: ${resolvedContractPath}`);
  }

  // Load the contract and extract circuit information
  logger.info(`Loading contract from ${contractPath}...`);
  const contract = await loadCompiledContract(resolvedContractPath);

  logger.success(`Found contract: ${contract.name}`);
  if (contract.circuits.length > 0) {
    const impure = contract.circuits.filter(c => c.isImpure);
    const witnesses = contract.circuits.filter(c => !c.isImpure);
    if (impure.length > 0) {
      logger.info(`  Circuits: ${impure.map(c => c.name).join(', ')}`);
    }
    if (witnesses.length > 0) {
      logger.info(`  Witnesses: ${witnesses.map(c => c.name).join(', ')}`);
    }
  }

  // Determine project name
  const providedName = context.params['name'] as string | undefined;
  const projectName = providedName ?? toCamelCase(contract.name);

  // Create project config
  const config: ProjectConfig = {
    name: projectName,
    template: 'dapp', // Contract-based projects are always dapp type
    description: `A Midnight dApp using the ${contract.name} contract`,
  };

  logger.newline();
  logger.info(`Creating project: ${config.name} (from ${contract.name} contract)`);

  // Generate contract-aware template files
  const files = getContractAwareTemplateFiles(config, contract);
  const { written, skipped } = await writeFiles(cwd, files, force);

  // Copy the compiled contract artifacts to the project
  const artifactsDir = join(cwd, 'artifacts', contract.name);
  await mkdir(artifactsDir, { recursive: true });

  // Copy the contract directory
  const sourceContractDir = dirname(contract.modulePath);
  const destContractDir = join(artifactsDir, 'contract');
  await cp(sourceContractDir, destContractDir, { recursive: true });

  written.push(`artifacts/${contract.name}/contract/`);

  // Report results
  if (written.length > 0) {
    logger.success(`Created ${written.length} files:`);
    for (const file of written) {
      logger.log(`  + ${file}`);
    }
  }

  if (skipped.length > 0) {
    logger.warn(`Skipped ${skipped.length} existing files:`);
    for (const file of skipped) {
      logger.log(`  - ${file}`);
    }
  }

  // Install dependencies
  if (!skipInstall) {
    logger.newline();
    const packageManager = detectPackageManager(cwd);
    logger.info(`Installing dependencies with ${packageManager}...`);

    const success = await runInstall(cwd, packageManager);
    if (success) {
      logger.success('Dependencies installed successfully');
    } else {
      logger.warn('Failed to install dependencies. Run install manually.');
    }
  }

  // Show next steps
  logger.newline();
  logger.success('Project created successfully!');
  logger.newline();
  logger.info('Next steps:');
  logger.log('  1. Start the local network:');
  logger.log('     nightcap node');
  logger.newline();
  logger.log('  2. Implement your circuit handlers in src/circuits/');
  logger.newline();
  logger.log('  3. Run tests:');
  logger.log('     npm test');
  logger.newline();
  logger.info('Happy building on Midnight!');
}
