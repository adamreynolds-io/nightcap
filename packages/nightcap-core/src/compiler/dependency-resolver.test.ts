/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseContract,
  resolveCompilationOrder,
  checkVersionCompatibility,
  type ContractInfo,
} from './dependency-resolver.js';

describe('dependency-resolver', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `nightcap-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('parseContract', () => {
    it('should parse pragma language_version', async () => {
      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
pragma language_version 0.19;
import CompactStandardLibrary;

export ledger counter: Cell<Unsigned<64>>;
`);

      const info = await parseContract(contractPath);
      expect(info.languageVersion).toBe('0.19');
      expect(info.minLanguageVersion).toBeUndefined();
    });

    it('should parse minimum version pragma', async () => {
      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
pragma language_version >= 0.19;
import CompactStandardLibrary;
`);

      const info = await parseContract(contractPath);
      expect(info.minLanguageVersion).toBe('0.19');
      expect(info.languageVersion).toBeUndefined();
    });

    it('should detect standard library import', async () => {
      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
pragma language_version 0.19;
import CompactStandardLibrary;
`);

      const info = await parseContract(contractPath);
      expect(info.usesStdLib).toBe(true);
      expect(info.imports).toContain('CompactStandardLibrary');
    });

    it('should parse local file imports', async () => {
      const libPath = join(testDir, 'lib.compact');
      await writeFile(libPath, 'pragma language_version 0.19;');

      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
pragma language_version 0.19;
import "lib.compact";
`);

      const info = await parseContract(contractPath);
      expect(info.imports).toContain('lib.compact');
      expect(info.localImports).toHaveLength(1);
      expect(info.localImports[0]).toContain('lib.compact');
    });

    it('should extract contract name from path', async () => {
      const contractPath = join(testDir, 'MyContract.compact');
      await writeFile(contractPath, 'pragma language_version 0.19;');

      const info = await parseContract(contractPath);
      expect(info.name).toBe('MyContract');
    });
  });

  describe('resolveCompilationOrder', () => {
    it('should return contracts in dependency order', async () => {
      // Create lib.compact (no dependencies)
      const libPath = join(testDir, 'lib.compact');
      await writeFile(libPath, 'pragma language_version 0.19;');

      // Create main.compact (depends on lib)
      const mainPath = join(testDir, 'main.compact');
      await writeFile(mainPath, `
pragma language_version 0.19;
import "lib.compact";
`);

      const result = await resolveCompilationOrder([mainPath, libPath], testDir);

      expect(result.errors).toHaveLength(0);
      expect(result.contracts).toHaveLength(2);
      // lib should come before main
      expect(result.contracts[0]?.name).toBe('lib');
      expect(result.contracts[1]?.name).toBe('main');
    });

    it('should detect circular dependencies', async () => {
      // Create a.compact (imports b)
      const aPath = join(testDir, 'a.compact');
      await writeFile(aPath, `
pragma language_version 0.19;
import "b.compact";
`);

      // Create b.compact (imports a)
      const bPath = join(testDir, 'b.compact');
      await writeFile(bPath, `
pragma language_version 0.19;
import "a.compact";
`);

      const result = await resolveCompilationOrder([aPath, bPath], testDir);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Circular'))).toBe(true);
    });

    it('should report missing dependencies', async () => {
      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
pragma language_version 0.19;
import "nonexistent.compact";
`);

      const result = await resolveCompilationOrder([contractPath], testDir);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);
    });

    it('should warn about missing pragma', async () => {
      const contractPath = join(testDir, 'test.compact');
      await writeFile(contractPath, `
import CompactStandardLibrary;
export ledger counter: Cell<Unsigned<64>>;
`);

      const result = await resolveCompilationOrder([contractPath], testDir);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('no pragma'))).toBe(true);
    });
  });

  describe('checkVersionCompatibility', () => {
    it('should pass when compiler meets exact version', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        languageVersion: '0.19',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.19.0');
      expect(result.compatible).toBe(true);
    });

    it('should pass when compiler meets minimum version', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        minLanguageVersion: '0.19',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.20.0');
      expect(result.compatible).toBe(true);
    });

    it('should fail when compiler below minimum version', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        minLanguageVersion: '0.20',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.19.0');
      expect(result.compatible).toBe(false);
      expect(result.message).toContain('0.20');
    });

    it('should fail when major.minor mismatch for exact version', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        languageVersion: '0.19',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.20.0');
      expect(result.compatible).toBe(false);
    });

    it('should handle prerelease versions', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        minLanguageVersion: '0.27',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.27.0-rc.1');
      expect(result.compatible).toBe(true);
    });

    it('should pass when no version requirement', () => {
      const contract: ContractInfo = {
        path: '/test.compact',
        name: 'test',
        imports: [],
        localImports: [],
        usesStdLib: false,
      };

      const result = checkVersionCompatibility(contract, '0.19.0');
      expect(result.compatible).toBe(true);
    });
  });
});
