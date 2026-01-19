/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import * as repl from 'node:repl';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { TaskDefinition, TaskContext, NightcapConfig, NetworkConfig } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * ANSI color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
} as const;

/**
 * History file path
 */
const HISTORY_FILE = path.join(os.homedir(), '.nightcap', 'console_history');

/**
 * Ensure directory exists for history file
 */
function ensureHistoryDir(): void {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load contract artifacts from the artifacts directory
 */
async function loadArtifacts(artifactsDir: string): Promise<Map<string, unknown>> {
  const artifacts = new Map<string, unknown>();

  if (!fs.existsSync(artifactsDir)) {
    return artifacts;
  }

  const entries = fs.readdirSync(artifactsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Look for contract artifact in directory
      const contractDir = path.join(artifactsDir, entry.name, 'contract');
      const indexPath = path.join(contractDir, 'index.cjs');

      if (fs.existsSync(indexPath)) {
        try {
          const module = await import(indexPath);
          artifacts.set(entry.name, module);
        } catch {
          // Skip contracts that fail to load
        }
      }
    }
  }

  return artifacts;
}

/**
 * Create console context with helpers
 */
function createContext(
  config: NightcapConfig,
  network: NetworkConfig,
  networkName: string,
  artifacts: Map<string, unknown>
): Record<string, unknown> {
  // Contract names for display
  const contractNames = Array.from(artifacts.keys());

  // Helper to get a contract artifact
  const getContract = (name: string): unknown => {
    const artifact = artifacts.get(name);
    if (!artifact) {
      const available = contractNames.length > 0
        ? `Available: ${contractNames.join(', ')}`
        : 'No contracts compiled';
      throw new Error(`Contract '${name}' not found. ${available}`);
    }
    return artifact;
  };

  // Helper to list contracts
  const listContracts = (): string[] => {
    return contractNames;
  };

  // Placeholder for deploy - requires midnight-js integration
  const deployContract = async (name: string, _args: unknown[] = []): Promise<unknown> => {
    const artifact = getContract(name);
    logger.warn('deployContract requires midnight-js plugin integration');
    logger.info('Contract artifact loaded, but deployment not yet implemented');
    return { name, artifact, deployed: false };
  };

  // Placeholder for getContractAt - requires midnight-js integration
  const getContractAt = async (name: string, address: string): Promise<unknown> => {
    const artifact = getContract(name);
    logger.warn('getContractAt requires midnight-js plugin integration');
    return { name, address, artifact, connected: false };
  };

  // Network query helpers (placeholders)
  const getBalance = async (address: string): Promise<unknown> => {
    logger.warn('getBalance requires midnight-js plugin integration');
    return { address, shielded: 0n, unshielded: 0n };
  };

  const getBlock = async (number?: number): Promise<unknown> => {
    logger.warn('getBlock requires midnight-js plugin integration');
    return { number: number ?? 'latest', hash: null };
  };

  // Help function
  const help = (fn?: unknown): void => {
    if (fn === undefined) {
      console.log(`
${colors.cyan}Nightcap Console Help${colors.reset}

${colors.green}Available objects:${colors.reset}
  config        - Nightcap configuration
  network       - Current network configuration
  networkName   - Name of the current network
  contracts     - List of compiled contract names

${colors.green}Contract helpers:${colors.reset}
  getContract(name)              - Get contract artifact by name
  listContracts()                - List all compiled contracts
  deployContract(name, args)     - Deploy a contract (requires midnight-js)
  getContractAt(name, address)   - Connect to deployed contract (requires midnight-js)

${colors.green}Network helpers:${colors.reset}
  getBalance(address)            - Get account balance (requires midnight-js)
  getBlock(number?)              - Get block info (requires midnight-js)

${colors.green}REPL commands:${colors.reset}
  .help         - Show REPL commands
  .exit         - Exit the console
  .clear        - Clear the screen

${colors.dim}Tip: Use 'await' for async operations${colors.reset}
`);
    } else if (typeof fn === 'function') {
      console.log(`Function: ${fn.name || 'anonymous'}`);
      console.log(`Parameters: ${fn.length}`);
    } else {
      console.log('Pass a function to see its details, or call help() with no arguments');
    }
  };

  return {
    // Configuration
    config,
    network,
    networkName,
    contracts: contractNames,

    // Contract helpers
    getContract,
    listContracts,
    deployContract,
    getContractAt,

    // Network helpers
    getBalance,
    getBlock,

    // Utilities
    help,
  };
}

/**
 * Print welcome banner
 */
function printBanner(networkName: string, network: NetworkConfig, contractCount: number): void {
  console.log(`
${colors.cyan}╔════════════════════════════════════════╗
║         Nightcap Console               ║
╚════════════════════════════════════════╝${colors.reset}

${colors.green}Network:${colors.reset}    ${networkName}${network.isLocal ? ' (local)' : ''}
${colors.green}Node:${colors.reset}       ${network.nodeUrl ?? 'not configured'}
${colors.green}Indexer:${colors.reset}    ${network.indexerUrl ?? 'not configured'}
${colors.green}Contracts:${colors.reset}  ${contractCount} compiled

Type ${colors.yellow}help()${colors.reset} for available commands
`);
}

/**
 * Console task definition
 */
export const consoleTask: TaskDefinition = {
  name: 'console',
  description: 'Open an interactive console for contract interaction',

  async action(context: TaskContext): Promise<void> {
    const { config, network, networkName } = context;

    // Load artifacts
    const artifactsDir = path.resolve(process.cwd(), config.paths?.artifacts ?? 'artifacts');
    const artifacts = await loadArtifacts(artifactsDir);

    // Print welcome banner
    printBanner(networkName, network, artifacts.size);

    // Create context
    const consoleContext = createContext(config, network, networkName, artifacts);

    // Ensure history directory exists
    ensureHistoryDir();

    // Create REPL
    const replServer = repl.start({
      prompt: `${colors.magenta}nightcap${colors.reset}:${colors.cyan}${networkName}${colors.reset}> `,
      useColors: true,
      useGlobal: false,
      ignoreUndefined: true,
      preview: true,
    });

    // Add context to REPL
    Object.assign(replServer.context, consoleContext);

    // Enable top-level await
    replServer.setupHistory(HISTORY_FILE, (err) => {
      if (err) {
        logger.debug(`Failed to setup history: ${err.message}`);
      }
    });

    // Custom .contracts command
    replServer.defineCommand('contracts', {
      help: 'List compiled contracts',
      action() {
        const names = Array.from(artifacts.keys());
        if (names.length === 0) {
          console.log('No contracts compiled');
        } else {
          console.log('Compiled contracts:');
          for (const name of names) {
            console.log(`  - ${name}`);
          }
        }
        this.displayPrompt();
      },
    });

    // Custom .network command
    replServer.defineCommand('network', {
      help: 'Show current network info',
      action() {
        console.log(`Network: ${networkName}`);
        console.log(`  Node URL: ${network.nodeUrl ?? 'not configured'}`);
        console.log(`  Indexer URL: ${network.indexerUrl ?? 'not configured'}`);
        console.log(`  Proof Server: ${network.proofServerUrl ?? 'not configured'}`);
        console.log(`  Local: ${network.isLocal ?? false}`);
        this.displayPrompt();
      },
    });

    // Wait for REPL to close
    await new Promise<void>((resolve) => {
      replServer.on('exit', () => {
        console.log('\nGoodbye!');
        resolve();
      });
    });
  },
};
