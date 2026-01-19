/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Represents a parsed contract with its dependencies
 */
export interface ContractInfo {
  /** Absolute path to the contract file */
  path: string;
  /** Contract name (filename without extension) */
  name: string;
  /** Required language version from pragma */
  languageVersion?: string;
  /** Minimum language version (when using >= operator) */
  minLanguageVersion?: string;
  /** List of imports (standard library and local files) */
  imports: string[];
  /** Local file imports that need to be resolved */
  localImports: string[];
  /** Whether this contract imports the standard library */
  usesStdLib: boolean;
}

/**
 * Compilation order result
 */
export interface CompilationOrder {
  /** Contracts in order they should be compiled */
  contracts: ContractInfo[];
  /** Any warnings during resolution */
  warnings: string[];
  /** Any errors during resolution */
  errors: string[];
}

/**
 * Parse a Compact contract file for dependencies
 */
export async function parseContract(contractPath: string): Promise<ContractInfo> {
  const content = await readFile(contractPath, 'utf8');
  const name = contractPath.split('/').pop()?.replace('.compact', '') ?? 'Unknown';

  const info: ContractInfo = {
    path: resolve(contractPath),
    name,
    imports: [],
    localImports: [],
    usesStdLib: false,
  };

  // Parse pragma language_version
  // Supports: pragma language_version 0.19;
  //           pragma language_version >= 0.19;
  const pragmaMatch = /pragma\s+language_version\s*(>=)?\s*([\d.]+)\s*;/.exec(content);
  if (pragmaMatch) {
    if (pragmaMatch[1] === '>=') {
      info.minLanguageVersion = pragmaMatch[2];
    } else {
      info.languageVersion = pragmaMatch[2];
    }
  }

  // Parse import statements
  // Supports: import CompactStandardLibrary;
  //           import "path/to/file.compact";
  //           import ModuleName;
  const importRegex = /import\s+(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*;/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]; // Quoted path
    const importName = match[2]; // Identifier

    if (importPath) {
      // Local file import: import "path/to/file.compact";
      info.imports.push(importPath);

      // Resolve relative to contract directory
      const resolvedPath = resolve(dirname(contractPath), importPath);
      if (existsSync(resolvedPath)) {
        info.localImports.push(resolvedPath);
      } else {
        // Try with .compact extension
        const withExtension = resolvedPath.endsWith('.compact')
          ? resolvedPath
          : `${resolvedPath}.compact`;
        if (existsSync(withExtension)) {
          info.localImports.push(withExtension);
        } else {
          info.localImports.push(resolvedPath); // Will be reported as missing
        }
      }
    } else if (importName) {
      // Named import
      info.imports.push(importName);
      if (importName === 'CompactStandardLibrary') {
        info.usesStdLib = true;
      }
    }
  }

  return info;
}

/**
 * Build a dependency graph and return compilation order
 */
export async function resolveCompilationOrder(
  contractPaths: string[],
  baseDir: string
): Promise<CompilationOrder> {
  const result: CompilationOrder = {
    contracts: [],
    warnings: [],
    errors: [],
  };

  // Parse all contracts
  const contractMap = new Map<string, ContractInfo>();
  const pendingPaths = [...contractPaths];
  const processedPaths = new Set<string>();

  while (pendingPaths.length > 0) {
    const contractPath = pendingPaths.pop()!;
    const resolvedPath = resolve(contractPath);

    if (processedPaths.has(resolvedPath)) {
      continue;
    }
    processedPaths.add(resolvedPath);

    try {
      const info = await parseContract(contractPath);
      contractMap.set(resolvedPath, info);

      // Add local imports to pending list
      for (const importPath of info.localImports) {
        if (!processedPaths.has(importPath)) {
          if (existsSync(importPath)) {
            pendingPaths.push(importPath);
          } else {
            result.errors.push(
              `Contract '${info.name}' imports '${relative(baseDir, importPath)}' which does not exist`
            );
          }
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to parse '${relative(baseDir, contractPath)}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Check for missing language version pragmas
  for (const info of contractMap.values()) {
    if (!info.languageVersion && !info.minLanguageVersion) {
      result.warnings.push(
        `Contract '${info.name}' has no pragma language_version declaration`
      );
    }
  }

  // Topological sort based on dependencies
  const sorted: ContractInfo[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // For cycle detection

  function visit(path: string): boolean {
    if (visited.has(path)) return true;
    if (visiting.has(path)) {
      // Cycle detected
      result.errors.push(`Circular dependency detected involving '${relative(baseDir, path)}'`);
      return false;
    }

    const info = contractMap.get(path);
    if (!info) return true;

    visiting.add(path);

    // Visit dependencies first
    for (const depPath of info.localImports) {
      if (contractMap.has(depPath)) {
        if (!visit(depPath)) return false;
      }
    }

    visiting.delete(path);
    visited.add(path);
    sorted.push(info);
    return true;
  }

  // Visit all contracts
  for (const path of contractMap.keys()) {
    if (!visit(path)) break;
  }

  result.contracts = sorted;
  return result;
}

/**
 * Check if a compiler version satisfies a contract's requirements
 */
export function checkVersionCompatibility(
  contract: ContractInfo,
  compilerVersion: string
): { compatible: boolean; message?: string } {
  // Parse versions into comparable numbers
  const parseVersion = (v: string): number[] =>
    v.split('.').map(n => parseInt(n, 10));

  const compareVersions = (a: number[], b: number[]): number => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aVal = a[i] ?? 0;
      const bVal = b[i] ?? 0;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  };

  const compilerParts = parseVersion(compilerVersion.replace(/-.*$/, '')); // Strip -rc.x

  if (contract.minLanguageVersion) {
    const requiredParts = parseVersion(contract.minLanguageVersion);
    if (compareVersions(compilerParts, requiredParts) < 0) {
      return {
        compatible: false,
        message: `Contract '${contract.name}' requires language version >= ${contract.minLanguageVersion}, but compiler is ${compilerVersion}`,
      };
    }
  }

  if (contract.languageVersion) {
    const requiredParts = parseVersion(contract.languageVersion);
    // For exact version, major.minor should match
    if (compilerParts[0] !== requiredParts[0] || compilerParts[1] !== requiredParts[1]) {
      return {
        compatible: false,
        message: `Contract '${contract.name}' requires language version ${contract.languageVersion}, but compiler is ${compilerVersion}`,
      };
    }
  }

  return { compatible: true };
}
