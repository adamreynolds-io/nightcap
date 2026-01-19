/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { logger } from '../utils/logger.js';
import type { CircuitInfo } from './typescript-generator.js';

/**
 * Loaded contract metadata from compiled artifacts
 */
export interface LoadedContract {
  /** Contract name (derived from directory name) */
  name: string;
  /** List of circuits extracted from the contract */
  circuits: CircuitInfo[];
  /** Path to the contract module (index.cjs or index.js) */
  modulePath: string;
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
 * Load a compiled contract from disk and extract its metadata
 *
 * @param contractPath - Path to the compiled contract directory (e.g., artifacts/Counter)
 * @returns LoadedContract with circuit information
 * @throws Error if no valid contract module is found
 */
export async function loadCompiledContract(contractPath: string): Promise<LoadedContract> {
  // Derive contract name from directory
  const name = basename(contractPath);

  // Try to find the contract module
  const possiblePaths = [
    join(contractPath, 'contract', 'index.cjs'),
    join(contractPath, 'contract', 'index.js'),
    join(contractPath, 'index.cjs'),
    join(contractPath, 'index.js'),
  ];

  for (const modulePath of possiblePaths) {
    if (!existsSync(modulePath)) continue;

    try {
      const circuits = await parseCircuitsFromModule(modulePath);
      return {
        name,
        circuits,
        modulePath,
      };
    } catch (error) {
      logger.debug(`Failed to load contract from ${modulePath}: ${error}`);
      // Continue to next possible path
    }
  }

  throw new Error(
    `No valid contract module found in ${contractPath}. ` +
      `Expected index.cjs or index.js in contract/ subdirectory or root.`
  );
}

/**
 * Check if a path contains a valid compiled contract
 *
 * @param contractPath - Path to check
 * @returns true if a contract module exists at the path
 */
export function isCompiledContract(contractPath: string): boolean {
  const possiblePaths = [
    join(contractPath, 'contract', 'index.cjs'),
    join(contractPath, 'contract', 'index.js'),
    join(contractPath, 'index.cjs'),
    join(contractPath, 'index.js'),
  ];

  return possiblePaths.some((p) => existsSync(p));
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
    throw new Error(`No Contract class found in ${modulePath}`);
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
 * Convert a string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Convert a string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
