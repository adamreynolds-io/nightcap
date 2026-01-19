/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { logger } from '../utils/logger.js';

/**
 * Contract metadata extracted from compiled artifacts
 */
export interface ContractMetadata {
  name: string;
  sourcePath: string;
  artifactPath: string;
  circuits: CircuitInfo[];
  privateStateType?: string;
  publicStateType?: string;
}

/**
 * Information about a circuit (callable method)
 */
export interface CircuitInfo {
  name: string;
  isImpure: boolean;
  parameters: ParameterInfo[];
  returnType?: string;
}

/**
 * Information about a circuit parameter
 */
export interface ParameterInfo {
  name: string;
  type: string;
}

/**
 * Options for TypeScript generation
 */
export interface GeneratorOptions {
  /** Output directory for generated files */
  outputDir: string;
  /** Generate .d.ts declaration files */
  generateDeclarations?: boolean;
  /** Generate factory functions */
  generateFactories?: boolean;
  /** Include midnight-js type imports */
  includeMidnightTypes?: boolean;
}

/**
 * Parse compiled contract artifacts to extract metadata
 */
export async function parseContractArtifacts(
  artifactsDir: string
): Promise<ContractMetadata[]> {
  const contracts: ContractMetadata[] = [];

  if (!existsSync(artifactsDir)) {
    return contracts;
  }

  const entries = readdirSync(artifactsDir);

  for (const entry of entries) {
    const entryPath = join(artifactsDir, entry);
    const stat = statSync(entryPath);

    // Skip non-directories and special files
    if (!stat.isDirectory()) continue;
    if (entry.startsWith('.')) continue;

    // Look for contract index file (index.cjs or index.js)
    const indexPath = join(entryPath, 'contract', 'index.cjs');
    const indexJsPath = join(entryPath, 'contract', 'index.js');
    const contractFile = existsSync(indexPath)
      ? indexPath
      : existsSync(indexJsPath)
        ? indexJsPath
        : null;

    if (!contractFile) {
      // Try direct structure
      const directIndex = join(entryPath, 'index.cjs');
      const directIndexJs = join(entryPath, 'index.js');
      if (!existsSync(directIndex) && !existsSync(directIndexJs)) {
        continue;
      }
    }

    const metadata = await parseContractMetadata(entryPath, entry);
    if (metadata) {
      contracts.push(metadata);
    }
  }

  return contracts;
}

/**
 * Parse metadata for a single contract using dynamic import
 * This approach follows the pattern from midnight-contracts/test-runner
 * which dynamically imports the compiled contract module and inspects
 * the Contract class instance for circuit information.
 */
async function parseContractMetadata(
  artifactDir: string,
  contractName: string
): Promise<ContractMetadata | null> {
  // Try to find the contract module
  // The compact compiler outputs JavaScript modules with the contract definition
  const possiblePaths = [
    join(artifactDir, 'contract', 'index.cjs'),
    join(artifactDir, 'contract', 'index.js'),
    join(artifactDir, 'index.cjs'),
    join(artifactDir, 'index.js'),
  ];

  for (const modulePath of possiblePaths) {
    if (!existsSync(modulePath)) continue;

    try {
      const circuits = await parseCircuitsFromModule(modulePath);

      return {
        name: contractName,
        sourcePath: '', // Would need to track this from compilation
        artifactPath: artifactDir,
        circuits,
      };
    } catch (error) {
      logger.debug(`Failed to parse circuits from ${modulePath}: ${error}`);
      // Continue to next possible path
    }
  }

  // If no module found, create basic metadata
  return {
    name: contractName,
    sourcePath: '',
    artifactPath: artifactDir,
    circuits: [],
  };
}

/**
 * Contract module interface for compiled Compact contracts
 */
interface CompiledContractModule {
  Contract: new (config: Record<string, unknown>) => {
    impureCircuits?: Record<string, unknown>;
    witnesses?: Record<string, unknown>;
  };
}

/**
 * Parse circuit information by dynamically importing the compiled contract module
 * and inspecting the Contract class instance.
 *
 * This approach is based on the midnight-contracts/test-runner pattern:
 * 1. Dynamic import of compiled index.cjs with cache-busting
 * 2. Instantiate Contract class with empty config
 * 3. Access impureCircuits and witnesses properties directly
 */
async function parseCircuitsFromModule(modulePath: string): Promise<CircuitInfo[]> {
  const circuits: CircuitInfo[] = [];

  // Use file:// URL with cache-busting timestamp for dynamic import
  const fileUrl = `file://${modulePath}?update=${Date.now()}`;
  const contractModule = (await import(fileUrl)) as CompiledContractModule;

  // Check if the module exports a Contract class
  if (!contractModule.Contract || typeof contractModule.Contract !== 'function') {
    logger.debug(`No Contract class found in ${modulePath}`);
    return circuits;
  }

  // Instantiate the contract with empty config
  const contractInstance = new contractModule.Contract({});

  // Extract impure circuits (state-modifying functions)
  if (contractInstance.impureCircuits && typeof contractInstance.impureCircuits === 'object') {
    for (const name of Object.keys(contractInstance.impureCircuits)) {
      if (name && !['__proto__', 'constructor'].includes(name)) {
        circuits.push({
          name,
          isImpure: true,
          parameters: [],
        });
      }
    }
  }

  // Extract witnesses (pure functions)
  if (contractInstance.witnesses && typeof contractInstance.witnesses === 'object') {
    for (const name of Object.keys(contractInstance.witnesses)) {
      if (name && !['__proto__', 'constructor'].includes(name)) {
        circuits.push({
          name,
          isImpure: false,
          parameters: [],
        });
      }
    }
  }

  return circuits;
}

/**
 * Generate TypeScript factory code for a contract
 */
export function generateContractFactory(
  metadata: ContractMetadata,
  options: GeneratorOptions
): string {
  const { name } = metadata;
  const pascalName = toPascalCase(name);

  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(` * Generated contract factory for ${name}`);
  lines.push(' * DO NOT EDIT - This file is auto-generated by Nightcap');
  lines.push(' */');
  lines.push('');

  // Imports
  if (options.includeMidnightTypes) {
    lines.push("import type { Contract } from '@midnight-ntwrk/compact-runtime';");
    lines.push("import type {");
    lines.push("  MidnightProvider,");
    lines.push("  PrivateStateProvider,");
    lines.push("  PublicDataProvider,");
    lines.push("  ProofProvider,");
    lines.push("  ZKConfigProvider,");
    lines.push("} from '@midnight-ntwrk/midnight-js-types';");
    lines.push("import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';");
    lines.push('');
  }

  // Re-export the contract
  lines.push(`// Re-export contract from compiled artifact`);
  lines.push(`export * as ${pascalName} from './${name}/contract/index.cjs';`);
  lines.push('');

  // Private state type placeholder
  lines.push(`/**`);
  lines.push(` * Private state type for ${pascalName}`);
  lines.push(` * Define this based on your contract's private state requirements`);
  lines.push(` */`);
  lines.push(`export interface ${pascalName}PrivateState {`);
  lines.push(`  // Add your private state fields here`);
  lines.push(`}`);
  lines.push('');

  // Witnesses placeholder
  lines.push(`/**`);
  lines.push(` * Witness functions for ${pascalName}`);
  lines.push(` * Implement these based on your contract's witness requirements`);
  lines.push(` */`);
  lines.push(`export const ${name}Witnesses = {`);
  lines.push(`  // Add witness implementations here`);
  lines.push(`};`);
  lines.push('');

  // Provider types
  if (options.includeMidnightTypes) {
    lines.push(`/**`);
    lines.push(` * Provider configuration for ${pascalName} contract`);
    lines.push(` */`);
    lines.push(`export interface ${pascalName}Providers {`);
    lines.push(`  publicDataProvider: PublicDataProvider;`);
    lines.push(`  privateStateProvider: PrivateStateProvider<${pascalName}PrivateState>;`);
    lines.push(`  proofProvider: ProofProvider;`);
    lines.push(`  zkConfigProvider: ZKConfigProvider;`);
    lines.push(`  walletProvider: MidnightProvider;`);
    lines.push(`}`);
    lines.push('');

    // Deploy function
    lines.push(`/**`);
    lines.push(` * Deploy a new ${pascalName} contract`);
    lines.push(` */`);
    lines.push(`export async function deploy${pascalName}(`);
    lines.push(`  providers: ${pascalName}Providers,`);
    lines.push(`  initialPrivateState: ${pascalName}PrivateState,`);
    lines.push(`  privateStateId = '${name}PrivateState'`);
    lines.push(`) {`);
    lines.push(`  // Import the contract`);
    lines.push(`  const { ${pascalName} } = await import('./${name}/contract/index.cjs');`);
    lines.push('');
    lines.push(`  return deployContract(providers, {`);
    lines.push(`    contract: ${pascalName}.Contract,`);
    lines.push(`    privateStateId,`);
    lines.push(`    initialPrivateState,`);
    lines.push(`  });`);
    lines.push(`}`);
    lines.push('');

    // Find deployed function
    lines.push(`/**`);
    lines.push(` * Find an existing deployed ${pascalName} contract`);
    lines.push(` */`);
    lines.push(`export async function find${pascalName}(`);
    lines.push(`  providers: ${pascalName}Providers,`);
    lines.push(`  contractAddress: string,`);
    lines.push(`  privateStateId = '${name}PrivateState'`);
    lines.push(`) {`);
    lines.push(`  // Import the contract`);
    lines.push(`  const { ${pascalName} } = await import('./${name}/contract/index.cjs');`);
    lines.push('');
    lines.push(`  return findDeployedContract(providers, {`);
    lines.push(`    contract: ${pascalName}.Contract,`);
    lines.push(`    contractAddress,`);
    lines.push(`    privateStateId,`);
    lines.push(`  });`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

/**
 * Generate TypeScript declaration file for a contract
 */
export function generateContractDeclaration(
  metadata: ContractMetadata,
  options: GeneratorOptions
): string {
  const { name, circuits } = metadata;
  const pascalName = toPascalCase(name);

  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(` * Type declarations for ${name} contract`);
  lines.push(' * DO NOT EDIT - This file is auto-generated by Nightcap');
  lines.push(' */');
  lines.push('');

  if (options.includeMidnightTypes) {
    lines.push("import type { Contract } from '@midnight-ntwrk/compact-runtime';");
    lines.push('');
  }

  // Private state interface
  lines.push(`export interface ${pascalName}PrivateState {`);
  lines.push(`  [key: string]: unknown;`);
  lines.push(`}`);
  lines.push('');

  // Circuit types
  if (circuits.length > 0) {
    lines.push(`/** Available circuits in ${pascalName} contract */`);
    lines.push(`export type ${pascalName}CircuitId = `);
    const impureCircuits = circuits.filter(c => c.isImpure);
    if (impureCircuits.length > 0) {
      lines.push(`  | ${impureCircuits.map(c => `'${c.name}'`).join('\n  | ')};`);
    } else {
      lines.push(`  never;`);
    }
    lines.push('');
  }

  // Contract type
  lines.push(`/** ${pascalName} contract type */`);
  lines.push(`export type ${pascalName}Contract = Contract<${pascalName}PrivateState>;`);
  lines.push('');

  // Witnesses type
  lines.push(`/** Witness functions type for ${pascalName} */`);
  lines.push(`export type ${pascalName}Witnesses = Record<string, (...args: unknown[]) => unknown>;`);

  return lines.join('\n');
}

/**
 * Generate an index file that re-exports all contracts
 */
export function generateIndexFile(
  contracts: ContractMetadata[],
  _options: GeneratorOptions
): string {
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(' * Contract type exports');
  lines.push(' * DO NOT EDIT - This file is auto-generated by Nightcap');
  lines.push(' */');
  lines.push('');

  for (const contract of contracts) {
    const name = contract.name;
    lines.push(`export * from './${name}';`);
  }

  return lines.join('\n');
}

/**
 * Generate all TypeScript files for compiled contracts
 */
export async function generateTypeScript(
  artifactsDir: string,
  options: GeneratorOptions
): Promise<{ generated: string[]; errors: string[] }> {
  const generated: string[] = [];
  const errors: string[] = [];

  // Parse all contract artifacts
  const contracts = await parseContractArtifacts(artifactsDir);

  if (contracts.length === 0) {
    logger.debug('No contract artifacts found for TypeScript generation');
    return { generated, errors };
  }

  // Create output directory
  const typesDir = options.outputDir;
  if (!existsSync(typesDir)) {
    await mkdir(typesDir, { recursive: true });
  }

  // Generate files for each contract
  for (const contract of contracts) {
    const contractDir = join(typesDir, contract.name);
    if (!existsSync(contractDir)) {
      await mkdir(contractDir, { recursive: true });
    }

    try {
      // Generate factory file
      if (options.generateFactories !== false) {
        const factoryCode = generateContractFactory(contract, options);
        const factoryPath = join(contractDir, 'index.ts');
        await writeFile(factoryPath, factoryCode, 'utf8');
        generated.push(relative(process.cwd(), factoryPath));
      }

      // Generate declaration file
      if (options.generateDeclarations !== false) {
        const declCode = generateContractDeclaration(contract, options);
        const declPath = join(contractDir, 'types.d.ts');
        await writeFile(declPath, declCode, 'utf8');
        generated.push(relative(process.cwd(), declPath));
      }
    } catch (error) {
      errors.push(
        `Failed to generate types for ${contract.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Generate index file
  if (contracts.length > 0) {
    try {
      const indexCode = generateIndexFile(contracts, options);
      const indexPath = join(typesDir, 'index.ts');
      await writeFile(indexPath, indexCode, 'utf8');
      generated.push(relative(process.cwd(), indexPath));
    } catch (error) {
      errors.push(
        `Failed to generate index file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return { generated, errors };
}

/**
 * Convert a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}
