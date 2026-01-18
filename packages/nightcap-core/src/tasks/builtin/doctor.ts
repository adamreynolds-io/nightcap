/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import type { TaskDefinition, TaskContext } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Minimum required Node.js version
 */
const MIN_NODE_VERSION = 20;

/**
 * Minimum recommended memory in GB
 * The Midnight stack (node + indexer + proof server) needs significant RAM
 */
const MIN_MEMORY_GB = 8;

/**
 * Minimum recommended disk space in GB
 * Docker images and blockchain data can consume significant storage
 */
const MIN_DISK_GB = 20;

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
 * Registry endpoints to check for connectivity
 */
const REGISTRY_ENDPOINTS = [
  {
    name: 'GitHub Container Registry',
    url: 'https://ghcr.io/v2/',
    // ghcr.io returns 401 when unauthenticated, but that still means connectivity works
    acceptCodes: [200, 401],
  },
] as const;

/**
 * Check network connectivity to container registries
 */
async function checkRegistryConnectivity(): Promise<CheckResult> {
  const results: { name: string; reachable: boolean; error?: string }[] = [];

  for (const endpoint of REGISTRY_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isReachable = endpoint.acceptCodes.includes(response.status);
      results.push({ name: endpoint.name, reachable: isReachable });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Connection timed out'
            : error.message
          : 'Unknown error';
      results.push({ name: endpoint.name, reachable: false, error: errorMessage });
    }
  }

  const unreachable = results.filter((r) => !r.reachable);

  if (unreachable.length === 0) {
    return {
      name: 'Registry Connectivity',
      status: 'ok',
      message: 'Container registries are reachable',
    };
  }

  const details = unreachable.map((r) => `${r.name}: ${r.error ?? 'unreachable'}`).join('\n');

  return {
    name: 'Registry Connectivity',
    status: 'warn',
    message: `Cannot reach ${unreachable.length} registry endpoint(s)`,
    details: `${details}\nCheck your network connection or firewall settings`,
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
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

/**
 * Check system memory
 */
function checkMemory(): CheckResult {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const totalGB = totalMemory / (1024 * 1024 * 1024);

  if (totalGB >= MIN_MEMORY_GB) {
    return {
      name: 'System Memory',
      status: 'ok',
      message: `${formatBytes(totalMemory)} total (${formatBytes(freeMemory)} available)`,
    };
  }

  return {
    name: 'System Memory',
    status: 'warn',
    message: `${formatBytes(totalMemory)} total - below recommended ${MIN_MEMORY_GB} GB`,
    details: `The Midnight stack may run slowly. Consider closing other applications or upgrading RAM.`,
  };
}

/**
 * Check available disk space
 */
async function checkDiskSpace(): Promise<CheckResult> {
  try {
    // Check disk space in current working directory
    const stats = await fs.statfs(process.cwd());
    const availableBytes = stats.bfree * stats.bsize;
    const totalBytes = stats.blocks * stats.bsize;
    const availableGB = availableBytes / (1024 * 1024 * 1024);

    if (availableGB >= MIN_DISK_GB) {
      return {
        name: 'Disk Space',
        status: 'ok',
        message: `${formatBytes(availableBytes)} available of ${formatBytes(totalBytes)}`,
      };
    }

    if (availableGB >= MIN_DISK_GB / 2) {
      return {
        name: 'Disk Space',
        status: 'warn',
        message: `${formatBytes(availableBytes)} available - getting low`,
        details: `Recommended: at least ${MIN_DISK_GB} GB free for Docker images and data`,
      };
    }

    return {
      name: 'Disk Space',
      status: 'error',
      message: `${formatBytes(availableBytes)} available - critically low`,
      details: `Need at least ${MIN_DISK_GB} GB free. Docker images alone require several GB.`,
    };
  } catch {
    return {
      name: 'Disk Space',
      status: 'warn',
      message: 'Unable to check disk space',
      details: 'Could not determine available disk space',
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

    // Run sync checks first
    const syncChecks: CheckResult[] = [
      checkNodeVersion(),
      checkPnpm(),
      checkDocker(),
      checkDockerImages(),
      checkConfiguration(context),
      checkMemory(),
    ];

    // Run async checks
    const asyncChecks: CheckResult[] = await Promise.all([
      checkRegistryConnectivity(),
      checkDiskSpace(),
    ]);

    const checks: CheckResult[] = [...syncChecks, ...asyncChecks];

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
