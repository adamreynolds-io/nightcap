/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 *
 * End-to-end tests for the compile task.
 * These tests require the compactc compiler to be installed.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { readFile, mkdir, rm, cp, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { compileTask, cleanTask } from './compile.js';
import { CompilerManager } from '../../compiler/manager.js';
import type { TaskContext, NightcapConfig } from '../types.js';

const FIXTURES_DIR = join(import.meta.dirname, '..', '..', '__fixtures__', 'contracts');

/**
 * Create a TaskContext for testing
 */
function createTestContext(
  projectDir: string,
  params: Record<string, unknown> = {},
  configOverrides: Partial<NightcapConfig> = {}
): TaskContext {
  const config: NightcapConfig = {
    defaultNetwork: 'local',
    networks: {
      local: { name: 'local', isLocal: true },
    },
    paths: {
      sources: 'contracts',
      artifacts: 'artifacts',
      types: 'typechain',
      ...configOverrides.paths,
    },
    ...configOverrides,
  };

  return {
    config,
    network: config.networks!['local']!,
    networkName: 'local',
    params,
    verbose: false,
  };
}

describe('compile e2e', () => {
  let compilerPath: string | null;
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Check if compiler is available
    const manager = new CompilerManager();
    compilerPath = await manager.getCompiler();

    if (!compilerPath) {
      console.warn('Compact compiler not found. Install compactc to run e2e tests.');
    }
  });

  beforeEach(async () => {
    // Create a temporary project directory for each test
    testDir = join(tmpdir(), `nightcap-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'contracts'), { recursive: true });

    // Save and change cwd
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore cwd
    process.chdir(originalCwd);

    // Clean up temp directory
    if (testDir && existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('full compilation workflow', () => {
    it('should compile a simple contract and create artifacts', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter.compact to the test project
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );

      const context = createTestContext(testDir);
      await compileTask.action(context);

      // Verify artifacts were created
      const artifactsDir = join(testDir, 'artifacts');
      expect(existsSync(artifactsDir)).toBe(true);

      // Check for expected output files (contract.js, contract.cjs)
      const files = await readdir(artifactsDir);
      expect(files.length).toBeGreaterThan(0);

      // Check cache was created
      const cacheDir = join(testDir, '.nightcap', 'cache');
      expect(existsSync(cacheDir)).toBe(true);
      expect(existsSync(join(cacheDir, 'manifest.json'))).toBe(true);
    });

    it('should discover and compile multiple contracts', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter and Token contracts
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );
      await cp(
        join(FIXTURES_DIR, 'Token.compact'),
        join(testDir, 'contracts', 'Token.compact')
      );

      const context = createTestContext(testDir);
      await compileTask.action(context);

      // Verify artifacts directory exists and has content
      const artifactsDir = join(testDir, 'artifacts');
      expect(existsSync(artifactsDir)).toBe(true);
      const files = await readdir(artifactsDir);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('dependency resolution', () => {
    it('should compile multiple independent contracts', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter and Token contracts
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );
      await cp(
        join(FIXTURES_DIR, 'Token.compact'),
        join(testDir, 'contracts', 'Token.compact')
      );

      const context = createTestContext(testDir);

      // Should compile without throwing
      await expect(compileTask.action(context)).resolves.not.toThrow();
    });
  });

  describe('caching behavior', () => {
    it('should skip unchanged contracts on second compile', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter.compact
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );

      const context = createTestContext(testDir);

      // First compile
      await compileTask.action(context);

      // Check manifest has entry
      const manifestPath = join(testDir, '.nightcap', 'cache', 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      expect(Object.keys(manifest.entries).length).toBeGreaterThan(0);

      // Get timestamp from first compile
      const firstEntry = Object.values(manifest.entries)[0] as { timestamp: number };
      const firstTimestamp = firstEntry.timestamp;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second compile - should skip
      await compileTask.action(context);

      // Verify manifest wasn't updated (contract was skipped)
      const manifestAfter = JSON.parse(await readFile(manifestPath, 'utf8'));
      const secondEntry = Object.values(manifestAfter.entries)[0] as { timestamp: number };
      expect(secondEntry.timestamp).toBe(firstTimestamp);
    });

    it('should recompile when source changes', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter.compact
      const contractPath = join(testDir, 'contracts', 'Counter.compact');
      await cp(join(FIXTURES_DIR, 'Counter.compact'), contractPath);

      const context = createTestContext(testDir);

      // First compile
      await compileTask.action(context);

      const manifestPath = join(testDir, '.nightcap', 'cache', 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const firstEntry = Object.values(manifest.entries)[0] as { sourceHash: string };
      const firstHash = firstEntry.sourceHash;

      // Modify the contract
      const content = await readFile(contractPath, 'utf8');
      await writeFile(contractPath, content + '\n// modified\n');

      // Second compile
      await compileTask.action(context);

      // Verify source hash changed
      const manifestAfter = JSON.parse(await readFile(manifestPath, 'utf8'));
      const secondEntry = Object.values(manifestAfter.entries)[0] as { sourceHash: string };
      expect(secondEntry.sourceHash).not.toBe(firstHash);
    });
  });

  describe('force recompilation', () => {
    it('should recompile all contracts with --force flag', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter.compact
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );

      // First compile
      const context = createTestContext(testDir);
      await compileTask.action(context);

      const manifestPath = join(testDir, '.nightcap', 'cache', 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const firstEntry = Object.values(manifest.entries)[0] as { timestamp: number };
      const firstTimestamp = firstEntry.timestamp;

      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Force recompile
      const forceContext = createTestContext(testDir, { force: true });
      await compileTask.action(forceContext);

      // Verify timestamp changed (was recompiled)
      const manifestAfter = JSON.parse(await readFile(manifestPath, 'utf8'));
      const secondEntry = Object.values(manifestAfter.entries)[0] as { timestamp: number };
      expect(secondEntry.timestamp).toBeGreaterThan(firstTimestamp);
    });
  });

  describe('TypeScript generation', () => {
    it('should generate TypeScript factory files with --generate-types', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy Counter.compact
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );

      const context = createTestContext(testDir, { generateTypes: true });
      await compileTask.action(context);

      // Check typechain directory was created
      const typesDir = join(testDir, 'typechain');
      expect(existsSync(typesDir)).toBe(true);

      // Check for generated files
      if (existsSync(typesDir)) {
        const files = await readdir(typesDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });
  });

  describe('error handling', () => {
    it('should fail with clear error for invalid contracts', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy invalid contract
      await mkdir(join(testDir, 'contracts', 'invalid'), { recursive: true });
      await cp(
        join(FIXTURES_DIR, 'invalid', 'BadSyntax.compact'),
        join(testDir, 'contracts', 'invalid', 'BadSyntax.compact')
      );

      const context = createTestContext(testDir);

      // Should throw an error
      await expect(compileTask.action(context)).rejects.toThrow();
    });

    it('should fail when source directory does not exist', async () => {
      // Use non-existent contracts dir
      const context = createTestContext(testDir, {}, {
        paths: { sources: 'nonexistent' },
      });

      await expect(compileTask.action(context)).rejects.toThrow('Source directory not found');
    });
  });

  describe('clean task', () => {
    it('should remove artifacts and cache directories', async () => {
      if (!compilerPath) {
        console.log('Skipping test: compiler not available');
        return;
      }

      // Copy and compile a contract first
      await cp(
        join(FIXTURES_DIR, 'Counter.compact'),
        join(testDir, 'contracts', 'Counter.compact')
      );

      const context = createTestContext(testDir);
      await compileTask.action(context);

      // Verify artifacts and cache exist
      expect(existsSync(join(testDir, 'artifacts'))).toBe(true);
      expect(existsSync(join(testDir, '.nightcap', 'cache'))).toBe(true);

      // Run clean with force flag (skip confirmation)
      const cleanContext = createTestContext(testDir, { force: true });
      await cleanTask.action(cleanContext);

      // Verify cache is gone (artifacts dir is recreated with .gitkeep)
      expect(existsSync(join(testDir, '.nightcap', 'cache'))).toBe(false);
      expect(existsSync(join(testDir, 'artifacts', '.gitkeep'))).toBe(true);
    });
  });
});
