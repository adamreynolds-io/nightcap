/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { input, select, confirm, checkbox } from '@inquirer/prompts';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import {
  TEMPLATES,
  getTemplateFiles,
  type TemplateType,
  type DappInterface,
  type ProjectConfig,
} from '../../templates/index.js';

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

  for (const file of files) {
    const fullPath = join(dir, file.path);
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
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const force = context.params['force'] === true;
    const skipInstall = context.params['skip-install'] === true;

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
