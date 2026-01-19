/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import {
  parseContractArtifacts,
  generateContractFactory,
  generateContractDeclaration,
  generateIndexFile,
  generateTypeScript,
} from './typescript-generator.js';
import type { ContractMetadata } from './typescript-generator.js';

describe('typescript-generator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `nightcap-ts-gen-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('parseContractArtifacts', () => {
    it('should return empty array for non-existent directory', async () => {
      const artifacts = await parseContractArtifacts('/non/existent/path');
      expect(artifacts).toEqual([]);
    });

    it('should return empty array for empty directory', async () => {
      const artifacts = await parseContractArtifacts(testDir);
      expect(artifacts).toEqual([]);
    });

    it('should parse contract artifacts from directory structure', async () => {
      // Create a mock contract artifact structure with Contract class
      // This matches the structure output by the Compact compiler
      const counterDir = join(testDir, 'Counter', 'contract');
      await mkdir(counterDir, { recursive: true });
      await writeFile(
        join(counterDir, 'index.cjs'),
        `
class Contract {
  constructor(config) {
    this.impureCircuits = {
      increment: function() {},
      decrement: function() {}
    };
    this.witnesses = {
      localWitness: function() {}
    };
  }
}
module.exports = { Contract };
        `
      );

      const artifacts = await parseContractArtifacts(testDir);

      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('Counter');
      expect(artifacts[0]?.circuits.length).toBeGreaterThan(0);
      // Verify impure circuits were found
      const impureCircuits = artifacts[0]?.circuits.filter(c => c.isImpure);
      expect(impureCircuits?.length).toBe(2);
      expect(impureCircuits?.map(c => c.name).sort()).toEqual(['decrement', 'increment']);
      // Verify witnesses were found
      const witnesses = artifacts[0]?.circuits.filter(c => !c.isImpure);
      expect(witnesses?.length).toBe(1);
      expect(witnesses?.[0]?.name).toBe('localWitness');
    });
  });

  describe('generateContractFactory', () => {
    const mockMetadata: ContractMetadata = {
      name: 'counter',
      sourcePath: 'contracts/counter.compact',
      artifactPath: 'artifacts/Counter',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
        { name: 'decrement', isImpure: true, parameters: [] },
      ],
    };

    it('should generate factory with imports when includeMidnightTypes is true', () => {
      const code = generateContractFactory(mockMetadata, {
        outputDir: testDir,
        includeMidnightTypes: true,
      });

      expect(code).toContain("import type { Contract } from '@midnight-ntwrk/compact-runtime'");
      expect(code).toContain("import { deployContract, findDeployedContract }");
      expect(code).toContain('export async function deployCounter');
      expect(code).toContain('export async function findCounter');
    });

    it('should generate factory without midnight types when not requested', () => {
      const code = generateContractFactory(mockMetadata, {
        outputDir: testDir,
        includeMidnightTypes: false,
      });

      expect(code).not.toContain("import type { Contract }");
      expect(code).not.toContain('deployContract');
    });

    it('should use PascalCase for type names', () => {
      const code = generateContractFactory(mockMetadata, {
        outputDir: testDir,
        includeMidnightTypes: true,
      });

      expect(code).toContain('CounterPrivateState');
      expect(code).toContain('CounterProviders');
      expect(code).toContain('deployCounter');
    });

    it('should include header comment', () => {
      const code = generateContractFactory(mockMetadata, {
        outputDir: testDir,
      });

      expect(code).toContain('Generated contract factory');
      expect(code).toContain('DO NOT EDIT');
    });
  });

  describe('generateContractDeclaration', () => {
    const mockMetadata: ContractMetadata = {
      name: 'token',
      sourcePath: 'contracts/token.compact',
      artifactPath: 'artifacts/Token',
      circuits: [
        { name: 'transfer', isImpure: true, parameters: [] },
        { name: 'mint', isImpure: true, parameters: [] },
      ],
    };

    it('should generate type declaration file', () => {
      const code = generateContractDeclaration(mockMetadata, {
        outputDir: testDir,
        includeMidnightTypes: true,
      });

      expect(code).toContain('TokenPrivateState');
      expect(code).toContain('TokenContract');
      expect(code).toContain('TokenWitnesses');
    });

    it('should include circuit type union', () => {
      const code = generateContractDeclaration(mockMetadata, {
        outputDir: testDir,
      });

      expect(code).toContain('TokenCircuitId');
      expect(code).toContain("'transfer'");
      expect(code).toContain("'mint'");
    });
  });

  describe('generateIndexFile', () => {
    it('should generate index file with re-exports', () => {
      const contracts: ContractMetadata[] = [
        { name: 'Counter', sourcePath: '', artifactPath: '', circuits: [] },
        { name: 'Token', sourcePath: '', artifactPath: '', circuits: [] },
      ];

      const code = generateIndexFile(contracts, { outputDir: testDir });

      expect(code).toContain("export * from './Counter'");
      expect(code).toContain("export * from './Token'");
      expect(code).toContain('DO NOT EDIT');
    });
  });

  describe('generateTypeScript', () => {
    it('should return empty result for empty artifacts directory', async () => {
      const outputDir = join(testDir, 'types');

      const result = await generateTypeScript(testDir, { outputDir });

      // No contracts means no files generated
      expect(result.generated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate files for contracts', async () => {
      // Create mock artifact with Contract class structure
      const counterDir = join(testDir, 'Counter', 'contract');
      await mkdir(counterDir, { recursive: true });
      await writeFile(
        join(counterDir, 'index.cjs'),
        `
class Contract {
  constructor(config) {
    this.impureCircuits = { test: function() {} };
    this.witnesses = {};
  }
}
module.exports = { Contract };
        `
      );

      const outputDir = join(testDir, 'types');
      const result = await generateTypeScript(testDir, {
        outputDir,
        generateFactories: true,
        generateDeclarations: true,
      });

      expect(result.errors).toHaveLength(0);
      expect(result.generated.length).toBeGreaterThan(0);
      expect(existsSync(join(outputDir, 'Counter', 'index.ts'))).toBe(true);
    });

    it('should return errors when generation fails', async () => {
      // This should not throw but return errors in result
      const result = await generateTypeScript('/non/existent', {
        outputDir: join(testDir, 'types'),
      });

      expect(result.generated).toHaveLength(0);
      // No errors because no contracts found
      expect(result.errors).toHaveLength(0);
    });
  });
});
