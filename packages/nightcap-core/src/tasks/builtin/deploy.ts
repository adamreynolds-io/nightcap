/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { confirm } from '@inquirer/prompts';
import type { TaskDefinition, TaskContext, NetworkConfig } from '../types.js';
import { logger } from '../../utils/logger.js';
import { Toolkit } from '../../toolkit/toolkit.js';
import type { ToolkitEndpoint } from '../../toolkit/types.js';

/**
 * Deployment record stored in history
 */
export interface DeploymentRecord {
  contractName: string;
  address: string;
  transactionHash?: string;
  deployedAt: string;
  artifactHash: string;
  constructorArgs?: unknown[];
  deployer?: string;
}

/**
 * Deployment history for a network
 */
export interface DeploymentHistory {
  network: string;
  chainId?: string;
  deployments: Record<string, DeploymentRecord>;
}

/**
 * Deployment module definition
 */
export interface DeploymentModule {
  name: string;
  contracts: DeploymentContract[];
}

/**
 * Contract deployment configuration
 */
export interface DeploymentContract {
  name: string;
  artifact: string;
  constructorArgs?: unknown[] | ((deployed: Record<string, string>) => unknown[]);
  dependsOn?: string[];
}

/**
 * Get the deployments directory for a network
 */
function getDeploymentsDir(projectDir: string, networkName: string): string {
  return join(projectDir, 'deployments', networkName);
}

/**
 * Get the deployment history file path
 */
function getHistoryPath(projectDir: string, networkName: string): string {
  return join(getDeploymentsDir(projectDir, networkName), 'history.json');
}

/**
 * Load deployment history for a network
 */
async function loadHistory(projectDir: string, networkName: string): Promise<DeploymentHistory> {
  const historyPath = getHistoryPath(projectDir, networkName);

  if (existsSync(historyPath)) {
    try {
      const content = await readFile(historyPath, 'utf8');
      return JSON.parse(content) as DeploymentHistory;
    } catch {
      // Ignore parse errors, return empty history
    }
  }

  return {
    network: networkName,
    deployments: {},
  };
}

/**
 * Save deployment history for a network
 */
async function saveHistory(
  projectDir: string,
  networkName: string,
  history: DeploymentHistory
): Promise<void> {
  const deploymentsDir = getDeploymentsDir(projectDir, networkName);

  if (!existsSync(deploymentsDir)) {
    await mkdir(deploymentsDir, { recursive: true });
  }

  const historyPath = getHistoryPath(projectDir, networkName);
  await writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');
}

/**
 * Hash an artifact file for change detection
 */
async function hashArtifact(artifactPath: string): Promise<string> {
  const content = await readFile(artifactPath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Check if network requires confirmation
 */
function requiresConfirmation(networkName: string): boolean {
  // Localnet doesn't require confirmation
  if (networkName === 'localnet' || networkName === 'local') {
    return false;
  }
  return true;
}

/**
 * Check if network is mainnet
 */
function isMainnet(networkName: string): boolean {
  return networkName === 'mainnet' || networkName === 'main';
}

/**
 * Get network display name with environment indicator
 */
function getNetworkDisplayName(networkName: string): string {
  const indicators: Record<string, string> = {
    localnet: 'localnet (local Docker)',
    devnet: 'devnet (internal)',
    qanet: 'qanet (internal)',
    preview: 'preview (public testnet)',
    preprod: 'preprod (public)',
    mainnet: 'MAINNET (PRODUCTION)',
  };
  return indicators[networkName] ?? networkName;
}

/**
 * Discover deployment modules in the ignition directory
 */
function discoverModules(projectDir: string): string[] {
  const ignitionDir = join(projectDir, 'ignition', 'modules');
  const modules: string[] = [];

  if (!existsSync(ignitionDir)) {
    return modules;
  }

  const entries = readdirSync(ignitionDir);
  for (const entry of entries) {
    const fullPath = join(ignitionDir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.js'))) {
      modules.push(fullPath);
    }
  }

  return modules;
}

/**
 * Load a deployment module (for future use with module-based deployments)
 */
async function _loadModule(modulePath: string): Promise<DeploymentModule> {
  // For now, we'll use a simple JSON-based module format
  // TypeScript modules would require dynamic import with tsx
  const content = await readFile(modulePath, 'utf8');

  // Check if it's a TypeScript/JavaScript module
  if (modulePath.endsWith('.ts') || modulePath.endsWith('.js')) {
    // Try to dynamically import
    try {
      const module = await import(modulePath);
      if (module.default) {
        return module.default as DeploymentModule;
      }
      throw new Error('Module must export default');
    } catch (error) {
      // Fall back to parsing as JSON config if import fails
      logger.debug(`Could not import module dynamically: ${error}`);
    }
  }

  // Try JSON format
  try {
    return JSON.parse(content) as DeploymentModule;
  } catch {
    throw new Error(`Could not parse deployment module: ${modulePath}`);
  }
}

// Export for future use
export { _loadModule as loadModule };

/**
 * Get toolkit endpoint from network config
 */
function getEndpoint(network: NetworkConfig): ToolkitEndpoint {
  return {
    nodeUrl: network.nodeUrl ?? 'http://localhost:9933',
    indexerUrl: network.indexerUrl ?? 'http://localhost:8088',
    proofServerUrl: network.proofServerUrl ?? 'http://localhost:6300',
  };
}

/**
 * Deploy task - deploys contracts to a network
 */
export const deployTask: TaskDefinition = {
  name: 'deploy',
  description: 'Deploy contracts to a network',
  params: {
    module: {
      type: 'string',
      description: 'Path to deployment module (or discovers from ignition/modules/)',
    },
    'dry-run': {
      type: 'boolean',
      description: 'Preview deployment without executing',
      default: false,
    },
    reset: {
      type: 'boolean',
      description: 'Ignore deployment history and redeploy all contracts',
      default: false,
    },
    'confirm-mainnet': {
      type: 'boolean',
      description: 'Confirm deployment to mainnet',
      default: false,
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const networkName = context.networkName;
    const network = context.network;
    const dryRun = context.params['dryRun'] === true;
    const reset = context.params['reset'] === true;
    const confirmMainnet = context.params['confirmMainnet'] === true;
    const modulePath = context.params['module'] as string | undefined;

    // Check mainnet safety
    if (isMainnet(networkName)) {
      logger.warn('');
      logger.warn('  ⚠️  WARNING: MAINNET DEPLOYMENT  ⚠️');
      logger.warn('');
      logger.warn('  You are about to deploy to the PRODUCTION network.');
      logger.warn('  This action is irreversible and will use real funds.');
      logger.warn('');

      if (!confirmMainnet) {
        const confirmed = await confirm({
          message: 'Are you sure you want to deploy to mainnet?',
          default: false,
        });

        if (!confirmed) {
          logger.info('Deployment cancelled');
          return;
        }
      }
    }

    // Get artifacts directory
    const artifactsDir = join(cwd, context.config.paths?.artifacts ?? 'artifacts');
    if (!existsSync(artifactsDir)) {
      logger.error('No artifacts directory found. Run "nightcap compile" first.');
      throw new Error('Artifacts not found');
    }

    // Discover or load module
    let modules: string[] = [];
    if (modulePath) {
      if (!existsSync(modulePath)) {
        logger.error(`Deployment module not found: ${modulePath}`);
        throw new Error('Module not found');
      }
      modules = [modulePath];
    } else {
      modules = discoverModules(cwd);
      if (modules.length === 0) {
        // If no modules, deploy all artifacts directly
        logger.info('No deployment modules found, deploying all artifacts...');
        modules = readdirSync(artifactsDir)
          .filter(f => f.endsWith('.json') && f !== 'history.json')
          .map(f => join(artifactsDir, f));
      }
    }

    // Load deployment history
    const history = reset ? { network: networkName, deployments: {} } : await loadHistory(cwd, networkName);

    // Network confirmation for non-localnet
    if (requiresConfirmation(networkName) && !dryRun) {
      logger.info('');
      logger.info(`Deploying to: ${getNetworkDisplayName(networkName)}`);
      logger.info(`  Node:         ${network.nodeUrl ?? 'default'}`);
      logger.info(`  Proof Server: ${network.proofServerUrl ?? 'default'}`);
      logger.info(`  Indexer:      ${network.indexerUrl ?? 'default'}`);
      logger.info('');

      const confirmed = await confirm({
        message: `Proceed with deployment to ${networkName}?`,
        default: true,
      });

      if (!confirmed) {
        logger.info('Deployment cancelled');
        return;
      }
    }

    // Initialize toolkit
    const toolkit = Toolkit.fromConfig(context.config, network);
    const endpoint = getEndpoint(network);

    if (!dryRun) {
      const available = await toolkit.isAvailable();
      if (!available) {
        logger.error('Toolkit not available. Install Docker or midnight-node-toolkit.');
        throw new Error('Toolkit not available');
      }
      await toolkit.ensureReady();
      logger.info(`Using toolkit in ${toolkit.getMode()} mode`);
    }

    // Track deployed addresses for dependency resolution
    const deployedAddresses: Record<string, string> = {};

    // Load existing deployments
    for (const [name, record] of Object.entries(history.deployments)) {
      deployedAddresses[name] = record.address;
    }

    // Process each module/artifact
    let deployed = 0;
    let skipped = 0;
    let failed = 0;

    for (const moduleSrc of modules) {
      const isArtifact = moduleSrc.endsWith('.json');

      if (isArtifact) {
        // Direct artifact deployment
        const contractName = basename(moduleSrc, '.json');
        const artifactPath = moduleSrc;

        // Check if already deployed
        const artifactHash = await hashArtifact(artifactPath);
        const existing = history.deployments[contractName];

        if (existing && existing.artifactHash === artifactHash && !reset) {
          logger.debug(`Skipping ${contractName} (already deployed at ${existing.address})`);
          skipped++;
          continue;
        }

        if (existing && existing.artifactHash !== artifactHash) {
          logger.warn(`Contract ${contractName} has changed since last deployment`);
        }

        if (dryRun) {
          logger.info(`[DRY RUN] Would deploy: ${contractName}`);
          logger.info(`  Artifact: ${relative(cwd, artifactPath)}`);
          continue;
        }

        // Deploy contract
        logger.info(`Deploying ${contractName}...`);

        const result = await toolkit.deploy(
          { artifactPath: relative(cwd, artifactPath) },
          endpoint
        );

        if (result.success && result.data) {
          const deployResult = result.data;
          deployed++;

          // Record deployment
          history.deployments[contractName] = {
            contractName,
            address: deployResult.contractAddress ?? 'unknown',
            transactionHash: deployResult.transactionHash,
            deployedAt: new Date().toISOString(),
            artifactHash,
          };

          deployedAddresses[contractName] = deployResult.contractAddress ?? '';

          logger.success(`Deployed ${contractName}`);
          logger.info(`  Address: ${deployResult.contractAddress}`);
          if (deployResult.transactionHash) {
            logger.info(`  Tx Hash: ${deployResult.transactionHash}`);
          }
        } else {
          failed++;
          logger.error(`Failed to deploy ${contractName}: ${result.error}`);
          if (context.verbose && result.stderr) {
            logger.debug(result.stderr);
          }
        }
      } else {
        // Module-based deployment (future enhancement)
        logger.warn(`Module-based deployment not yet implemented: ${moduleSrc}`);
        logger.info('Use direct artifact deployment for now.');
      }
    }

    // Save deployment history
    if (!dryRun && (deployed > 0 || Object.keys(history.deployments).length > 0)) {
      await saveHistory(cwd, networkName, history);
    }

    // Summary
    logger.newline();
    if (dryRun) {
      logger.info('Dry run complete. No contracts were deployed.');
    } else if (failed > 0) {
      logger.error(`Deployment completed with errors: ${deployed} deployed, ${failed} failed, ${skipped} skipped`);
      throw new Error('Deployment failed');
    } else if (deployed > 0) {
      logger.success(`Deployment complete: ${deployed} deployed, ${skipped} skipped`);
      logger.info(`Deployment history saved to: deployments/${networkName}/`);
    } else if (skipped > 0) {
      logger.info('Nothing to deploy (all contracts already deployed)');
      logger.info('Use --reset to redeploy');
    } else {
      logger.info('No contracts to deploy');
    }
  },
};

/**
 * Deployments list task - shows deployment history
 */
export const deploymentsTask: TaskDefinition = {
  name: 'deployments',
  description: 'List deployed contracts for a network',
  params: {
    contract: {
      type: 'string',
      description: 'Show details for a specific contract',
    },
  },

  async action(context: TaskContext): Promise<void> {
    const cwd = process.cwd();
    const networkName = context.networkName;
    const contractName = context.params['contract'] as string | undefined;

    const history = await loadHistory(cwd, networkName);
    const deployments = Object.values(history.deployments);

    if (deployments.length === 0) {
      logger.info(`No deployments found for network: ${networkName}`);
      return;
    }

    if (contractName) {
      // Show specific contract
      const deployment = history.deployments[contractName];
      if (!deployment) {
        logger.error(`Contract '${contractName}' not found in deployment history`);
        return;
      }

      logger.info(`Contract: ${deployment.contractName}`);
      logger.info(`  Address:     ${deployment.address}`);
      logger.info(`  Deployed:    ${deployment.deployedAt}`);
      if (deployment.transactionHash) {
        logger.info(`  Tx Hash:     ${deployment.transactionHash}`);
      }
      logger.info(`  Artifact:    ${deployment.artifactHash}`);
    } else {
      // List all contracts
      logger.info(`Deployments on ${networkName}:`);
      logger.newline();

      for (const deployment of deployments) {
        logger.info(`  ${deployment.contractName}`);
        logger.info(`    Address:  ${deployment.address}`);
        logger.info(`    Deployed: ${deployment.deployedAt}`);
        logger.newline();
      }
    }
  },
};
