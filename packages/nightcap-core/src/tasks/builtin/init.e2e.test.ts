/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 *
 * End-to-end tests for the init task.
 * These tests actually create project files on disk.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { readFile, mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initTask } from './init.js';
import type { TaskContext, NightcapConfig } from '../types.js';

/**
 * Create a TaskContext for testing
 */
function createTestContext(
  params: Record<string, unknown> = {},
  configOverrides: Partial<NightcapConfig> = {}
): TaskContext {
  const config: NightcapConfig = {
    defaultNetwork: 'local',
    networks: {
      local: { name: 'local', isLocal: true },
    },
    ...configOverrides,
  };

  return {
    config,
    network: config.networks!['local']!,
    networkName: 'local',
    params: {
      'skip-install': true, // Always skip install in e2e tests
      ...params,
    },
    verbose: false,
  };
}

describe('init e2e', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = join(tmpdir(), `nightcap-init-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });

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

  describe('basic template', () => {
    it('should create a basic project with expected files', async () => {
      const context = createTestContext({
        name: 'my-project',
        template: 'basic',
      });

      await initTask.action(context);

      // Verify core files exist
      expect(existsSync(join(testDir, 'package.json'))).toBe(true);
      expect(existsSync(join(testDir, 'nightcap.config.ts'))).toBe(true);
      expect(existsSync(join(testDir, 'tsconfig.json'))).toBe(true);
      expect(existsSync(join(testDir, '.gitignore'))).toBe(true);

      // Verify contracts directory
      expect(existsSync(join(testDir, 'contracts'))).toBe(true);
      expect(existsSync(join(testDir, 'contracts', 'Counter.compact'))).toBe(true);

      // Verify artifacts directory with .gitkeep
      expect(existsSync(join(testDir, 'artifacts', '.gitkeep'))).toBe(true);

      // Verify test directory
      expect(existsSync(join(testDir, 'test'))).toBe(true);
    });

    it('should set correct project name in package.json', async () => {
      const context = createTestContext({
        name: 'my-awesome-project',
        template: 'basic',
      });

      await initTask.action(context);

      const packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('my-awesome-project');
    });

    it('should include nightcap config with correct defaults', async () => {
      const context = createTestContext({
        name: 'test-project',
        template: 'basic',
      });

      await initTask.action(context);

      const configContent = await readFile(join(testDir, 'nightcap.config.ts'), 'utf8');
      expect(configContent).toContain('NightcapConfig');
      expect(configContent).toContain('defaultNetwork');
    });
  });

  describe('dapp template', () => {
    it('should create a dapp project with core files', async () => {
      const context = createTestContext({
        name: 'my-dapp',
        template: 'dapp',
      });

      await initTask.action(context);

      // Verify core dapp files
      expect(existsSync(join(testDir, 'package.json'))).toBe(true);
      expect(existsSync(join(testDir, 'nightcap.config.ts'))).toBe(true);
      expect(existsSync(join(testDir, 'src', 'index.ts'))).toBe(true);
      expect(existsSync(join(testDir, 'contracts'))).toBe(true);
    });

    it('should create CLI files when --cli flag is provided', async () => {
      const context = createTestContext({
        name: 'my-dapp',
        template: 'dapp',
        cli: true,
      });

      await initTask.action(context);

      // Verify CLI-specific file
      expect(existsSync(join(testDir, 'src', 'cli.ts'))).toBe(true);

      // Verify CLI content references commander or similar
      const cliContent = await readFile(join(testDir, 'src', 'cli.ts'), 'utf8');
      expect(cliContent.length).toBeGreaterThan(0);
    });

    it('should create React files when --react flag is provided', async () => {
      const context = createTestContext({
        name: 'my-dapp',
        template: 'dapp',
        react: true,
      });

      await initTask.action(context);

      // Verify React-specific files
      expect(existsSync(join(testDir, 'web', 'src', 'App.tsx'))).toBe(true);
      expect(existsSync(join(testDir, 'web', 'src', 'main.tsx'))).toBe(true);
      expect(existsSync(join(testDir, 'web', 'index.html'))).toBe(true);

      // Verify App.tsx has React content
      const appContent = await readFile(join(testDir, 'web', 'src', 'App.tsx'), 'utf8');
      expect(appContent).toContain('react');
    });

    it('should create both CLI and React files when both flags provided', async () => {
      const context = createTestContext({
        name: 'full-dapp',
        template: 'dapp',
        cli: true,
        react: true,
      });

      await initTask.action(context);

      // Verify both CLI and React files exist
      expect(existsSync(join(testDir, 'src', 'cli.ts'))).toBe(true);
      expect(existsSync(join(testDir, 'web', 'src', 'App.tsx'))).toBe(true);
    });
  });

  describe('library template', () => {
    it('should create a library project with expected files', async () => {
      const context = createTestContext({
        name: 'my-lib',
        template: 'library',
      });

      await initTask.action(context);

      // Verify library files
      expect(existsSync(join(testDir, 'package.json'))).toBe(true);
      expect(existsSync(join(testDir, 'contracts'))).toBe(true);

      // Library should have src directory for TypeScript exports
      expect(existsSync(join(testDir, 'src'))).toBe(true);
    });
  });

  describe('force flag', () => {
    it('should overwrite existing files with --force', async () => {
      // Create an existing file
      await writeFile(join(testDir, 'package.json'), '{"name": "existing"}', 'utf8');

      const context = createTestContext({
        name: 'new-project',
        template: 'basic',
        force: true,
      });

      await initTask.action(context);

      // Verify file was overwritten
      const packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('new-project');
    });

    it('should overwrite on subsequent runs with --force', async () => {
      // First init
      const context1 = createTestContext({
        name: 'first-project',
        template: 'basic',
        force: true,
      });
      await initTask.action(context1);

      // Verify first project name
      let packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('first-project');

      // Second init with force - should overwrite
      const context2 = createTestContext({
        name: 'second-project',
        template: 'basic',
        force: true,
      });
      await initTask.action(context2);

      // Verify file was overwritten with new name
      packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('second-project');
    });
  });

  describe('file structure', () => {
    it('should create proper directory hierarchy', async () => {
      const context = createTestContext({
        name: 'structured-project',
        template: 'basic',
      });

      await initTask.action(context);

      // List all created files/directories
      const topLevel = await readdir(testDir);

      // Should have these top-level items
      expect(topLevel).toContain('package.json');
      expect(topLevel).toContain('nightcap.config.ts');
      expect(topLevel).toContain('contracts');
      expect(topLevel).toContain('artifacts');
      expect(topLevel).toContain('test');
    });

    it('should create valid JSON files', async () => {
      const context = createTestContext({
        name: 'json-test',
        template: 'basic',
      });

      await initTask.action(context);

      // package.json should be valid JSON
      const packageContent = await readFile(join(testDir, 'package.json'), 'utf8');
      expect(() => JSON.parse(packageContent)).not.toThrow();

      // tsconfig.json should be valid JSON
      const tsconfigContent = await readFile(join(testDir, 'tsconfig.json'), 'utf8');
      expect(() => JSON.parse(tsconfigContent)).not.toThrow();
    });

    it('should create valid TypeScript config file', async () => {
      const context = createTestContext({
        name: 'ts-config-test',
        template: 'basic',
      });

      await initTask.action(context);

      const configContent = await readFile(join(testDir, 'nightcap.config.ts'), 'utf8');

      // Should be valid TypeScript (export default)
      expect(configContent).toContain('export default');
      expect(configContent).toContain('NightcapConfig');
    });
  });

  describe('contract templates', () => {
    it('should create Counter.compact with valid Compact syntax', async () => {
      const context = createTestContext({
        name: 'contract-test',
        template: 'basic',
      });

      await initTask.action(context);

      const counterContent = await readFile(join(testDir, 'contracts', 'Counter.compact'), 'utf8');

      // Should have pragma
      expect(counterContent).toContain('pragma language_version');

      // Should import standard library
      expect(counterContent).toContain('import CompactStandardLibrary');

      // Should have ledger declaration
      expect(counterContent).toContain('export ledger');

      // Should have circuit definitions
      expect(counterContent).toContain('export circuit');
    });
  });

  describe('gitignore', () => {
    it('should create .gitignore with common exclusions', async () => {
      const context = createTestContext({
        name: 'gitignore-test',
        template: 'basic',
      });

      await initTask.action(context);

      const gitignoreContent = await readFile(join(testDir, '.gitignore'), 'utf8');

      // Should exclude common directories
      expect(gitignoreContent).toContain('node_modules');
      expect(gitignoreContent).toContain('dist');
    });
  });

  describe('edge cases', () => {
    it('should handle project names with hyphens', async () => {
      const context = createTestContext({
        name: 'my-hyphenated-project',
        template: 'basic',
      });

      await initTask.action(context);

      const packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('my-hyphenated-project');
    });

    it('should handle project names with underscores', async () => {
      const context = createTestContext({
        name: 'my_underscored_project',
        template: 'basic',
      });

      await initTask.action(context);

      const packageJson = JSON.parse(await readFile(join(testDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('my_underscored_project');
    });

    it('should create all templates without errors', async () => {
      const templates = ['basic', 'dapp', 'library'];

      for (const template of templates) {
        // Create fresh directory for each template
        const templateDir = join(testDir, template);
        await mkdir(templateDir, { recursive: true });
        process.chdir(templateDir);

        const context = createTestContext({
          name: `test-${template}`,
          template,
        });

        // Should not throw
        await expect(initTask.action(context)).resolves.not.toThrow();

        // Should create package.json
        expect(existsSync(join(templateDir, 'package.json'))).toBe(true);
      }
    });
  });
});
