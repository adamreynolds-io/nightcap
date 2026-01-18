/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Minimum required Node.js version
 */
const MIN_NODE_VERSION = 20;

/**
 * Check result for a single diagnostic
 */
interface CheckResult {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  details?: string;
}

/**
 * Parse Node.js version string to major version number
 */
function parseNodeVersion(version: string): number {
  const match = /^v?(\d+)/.exec(version);
  return match ? parseInt(match[1] ?? '0', 10) : 0;
}

/**
 * Check Node.js version
 */
function checkNodeVersion(): CheckResult {
  const version = process.version;
  const majorVersion = parseNodeVersion(version);

  if (majorVersion >= MIN_NODE_VERSION) {
    return {
      name: 'Node.js',
      status: 'ok',
      message: `Node.js ${version} installed`,
    };
  }

  return {
    name: 'Node.js',
    status: 'error',
    message: `Node.js ${version} is below minimum required version`,
    details: `Please upgrade to Node.js ${MIN_NODE_VERSION} or higher`,
  };
}

/**
 * Check Docker availability and version
 */
function checkDocker(): CheckResult {
  try {
    const version = execSync('docker --version', { encoding: 'utf8' }).trim();
    const versionMatch = /Docker version ([\d.]+)/.exec(version);

    // Check if Docker daemon is running
    try {
      execSync('docker info', { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      return {
        name: 'Docker',
        status: 'error',
        message: 'Docker is installed but daemon is not running',
        details: 'Start Docker Desktop or the Docker daemon',
      };
    }

    return {
      name: 'Docker',
      status: 'ok',
      message: `Docker ${versionMatch?.[1] ?? 'unknown version'} installed and running`,
    };
  } catch {
    return {
      name: 'Docker',
      status: 'warn',
      message: 'Docker is not installed',
      details: 'Install Docker to use local development features: https://docs.docker.com/get-docker/',
    };
  }
}

/**
 * Check for required Docker images
 */
function checkDockerImages(): CheckResult {
  const requiredImages = [
    'midnightntwrk/midnight-node',
    'midnightntwrk/midnight-indexer',
    'midnightntwrk/midnight-proof-server',
  ];

  try {
    // First check if Docker is available
    execSync('docker info', { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return {
      name: 'Docker Images',
      status: 'warn',
      message: 'Cannot check images - Docker not available',
    };
  }

  const missingImages: string[] = [];
  const presentImages: string[] = [];

  for (const image of requiredImages) {
    try {
      execSync(`docker image inspect ${image}:latest`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      presentImages.push(image);
    } catch {
      missingImages.push(image);
    }
  }

  if (missingImages.length === 0) {
    return {
      name: 'Docker Images',
      status: 'ok',
      message: `All ${requiredImages.length} Midnight images present`,
    };
  }

  if (presentImages.length === 0) {
    return {
      name: 'Docker Images',
      status: 'warn',
      message: 'No Midnight Docker images found',
      details: `Missing: ${missingImages.join(', ')}\nRun 'nightcap node pull' to download images`,
    };
  }

  return {
    name: 'Docker Images',
    status: 'warn',
    message: `${missingImages.length} of ${requiredImages.length} images missing`,
    details: `Missing: ${missingImages.join(', ')}`,
  };
}

/**
 * Check configuration validity
 */
function checkConfiguration(context: TaskContext): CheckResult {
  const { config, networkName, network } = context;

  if (!network) {
    return {
      name: 'Configuration',
      status: 'error',
      message: `Network '${networkName}' not found in configuration`,
      details: `Available networks: ${Object.keys(config.networks ?? {}).join(', ')}`,
    };
  }

  const missingUrls: string[] = [];
  if (!network.indexerUrl) missingUrls.push('indexerUrl');
  if (!network.proofServerUrl) missingUrls.push('proofServerUrl');
  if (!network.nodeUrl) missingUrls.push('nodeUrl');

  if (missingUrls.length > 0 && !network.isLocal) {
    return {
      name: 'Configuration',
      status: 'warn',
      message: `Network '${networkName}' missing some URLs`,
      details: `Missing: ${missingUrls.join(', ')}`,
    };
  }

  return {
    name: 'Configuration',
    status: 'ok',
    message: `Configuration valid, using network '${networkName}'`,
  };
}

/**
 * Check pnpm availability
 */
function checkPnpm(): CheckResult {
  try {
    const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    return {
      name: 'pnpm',
      status: 'ok',
      message: `pnpm ${version} installed`,
    };
  } catch {
    return {
      name: 'pnpm',
      status: 'warn',
      message: 'pnpm is not installed',
      details: 'Install pnpm for best experience: npm install -g pnpm',
    };
  }
}

/**
 * Doctor task definition
 */
export const doctorTask: TaskDefinition = {
  name: 'doctor',
  description: 'Check system requirements and configuration',

  async action(context: TaskContext): Promise<void> {
    logger.info('Running Nightcap diagnostics...\n');

    const checks: CheckResult[] = [
      checkNodeVersion(),
      checkPnpm(),
      checkDocker(),
      checkDockerImages(),
      checkConfiguration(context),
    ];

    let hasErrors = false;
    let hasWarnings = false;

    for (const check of checks) {
      const prefix = check.status === 'ok' ? '[OK]' : check.status === 'warn' ? '[WARN]' : '[ERROR]';
      logger.log(`${prefix} ${check.name}: ${check.message}`);

      if (check.details && context.verbose) {
        for (const line of check.details.split('\n')) {
          logger.log(`     ${line}`);
        }
      }

      if (check.status === 'error') hasErrors = true;
      if (check.status === 'warn') hasWarnings = true;
    }

    logger.newline();

    if (hasErrors) {
      logger.error('Some checks failed. Please fix the issues above.');
      throw new Error('Doctor found errors');
    } else if (hasWarnings) {
      logger.warn('Some checks have warnings. Review the messages above.');
    } else {
      logger.success('All checks passed! Your environment is ready.');
    }
  },
};
