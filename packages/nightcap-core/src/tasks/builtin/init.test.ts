/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initTask } from './init.js';

// Mock the logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    log: vi.fn(),
    newline: vi.fn(),
  },
}));

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-project'),
  select: vi.fn().mockResolvedValue('basic'),
  confirm: vi.fn().mockResolvedValue(true),
}));

// Mock fs operations
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readdirSync: vi.fn().mockReturnValue([]),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 10);
      }
    }),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  })),
}));

describe('initTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(initTask.name).toBe('init');
    });

    it('should have description', () => {
      expect(initTask.description).toBe('Create a new Nightcap project');
    });

    it('should have params defined', () => {
      expect(initTask.params).toBeDefined();
      expect(initTask.params?.template).toBeDefined();
      expect(initTask.params?.force).toBeDefined();
      expect(initTask.params?.['skip-install']).toBeDefined();
      expect(initTask.params?.name).toBeDefined();
    });

    it('should have correct param types', () => {
      expect(initTask.params?.template?.type).toBe('string');
      expect(initTask.params?.force?.type).toBe('boolean');
      expect(initTask.params?.['skip-install']?.type).toBe('boolean');
      expect(initTask.params?.name?.type).toBe('string');
    });

    it('should have default values for boolean params', () => {
      expect(initTask.params?.force?.default).toBe(false);
      expect(initTask.params?.['skip-install']?.default).toBe(false);
    });
  });

  describe('action', () => {
    it('should be a function', () => {
      expect(typeof initTask.action).toBe('function');
    });

    it('should create project in non-interactive mode', async () => {
      const { writeFile, mkdir } = await import('node:fs/promises');
      const { logger } = await import('../../utils/logger.js');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have created files
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith(
        'Project created successfully!'
      );
    });

    it('should skip existing files without force flag', async () => {
      const { existsSync } = await import('node:fs');
      const { writeFile } = await import('node:fs/promises');
      const { logger } = await import('../../utils/logger.js');

      // Make existsSync return true for file checks
      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('package.json')) {
          return true;
        }
        return false;
      });

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
          force: false,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should warn about skipped files
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipped')
      );
    });

    it('should overwrite files with force flag', async () => {
      const { existsSync, readdirSync } = await import('node:fs');
      const { writeFile } = await import('node:fs/promises');

      // Directory exists and is not empty
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdirSync).mockReturnValue(['src', 'package.json'] as unknown as string[]);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
          force: true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have written files despite them existing
      expect(writeFile).toHaveBeenCalled();
    });

    it('should skip dependency installation with skip-install flag', async () => {
      const { spawn } = await import('node:child_process');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // spawn should not have been called for install
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should show next steps after creation', async () => {
      const { logger } = await import('../../utils/logger.js');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      expect(logger.info).toHaveBeenCalledWith('Next steps:');
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('nightcap node')
      );
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('nightcap compile')
      );
    });

    it('should support dapp template', async () => {
      const { writeFile } = await import('node:fs/promises');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-dapp',
          template: 'dapp',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should create dapp-specific files
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('src/index.ts'),
        expect.any(String),
        'utf8'
      );
    });

    it('should support library template', async () => {
      const { writeFile } = await import('node:fs/promises');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-lib',
          template: 'library',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have created files
      expect(writeFile).toHaveBeenCalled();
    });

    it('should create CLI files when --cli flag is provided', async () => {
      const { writeFile } = await import('node:fs/promises');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-dapp',
          template: 'dapp',
          cli: true,
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have created CLI file
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('src/cli.ts'),
        expect.any(String),
        'utf8'
      );
    });

    it('should create React files when --react flag is provided', async () => {
      const { writeFile } = await import('node:fs/promises');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-dapp',
          template: 'dapp',
          react: true,
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have created React files
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('web/src/App.tsx'),
        expect.any(String),
        'utf8'
      );
    });

    it('should create both CLI and React files when both flags provided', async () => {
      const { writeFile } = await import('node:fs/promises');

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-dapp',
          template: 'dapp',
          cli: true,
          react: true,
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should have created both CLI and React files
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('src/cli.ts'),
        expect.any(String),
        'utf8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('web/src/App.tsx'),
        expect.any(String),
        'utf8'
      );
    });
  });
});

describe('init helper functions', () => {
  // Testing the helper functions indirectly through the task behavior

  describe('package manager detection', () => {
    it('should default to npm when no lock file exists', async () => {
      const { existsSync } = await import('node:fs');
      const { spawn } = await import('node:child_process');

      vi.mocked(existsSync).mockReturnValue(false);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          // Don't skip install to test package manager detection
        },
        verbose: false,
      };

      await initTask.action(context);

      // spawn should be called with 'npm' for install
      expect(spawn).toHaveBeenCalledWith('npm', ['install'], expect.any(Object));
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      const { existsSync } = await import('node:fs');
      const { spawn } = await import('node:child_process');

      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('pnpm-lock.yaml')) {
          return true;
        }
        return false;
      });

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
        },
        verbose: false,
      };

      await initTask.action(context);

      expect(spawn).toHaveBeenCalledWith('pnpm', ['install'], expect.any(Object));
    });

    it('should detect yarn from yarn.lock', async () => {
      const { existsSync } = await import('node:fs');
      const { spawn } = await import('node:child_process');

      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('yarn.lock')) {
          return true;
        }
        return false;
      });

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
        },
        verbose: false,
      };

      await initTask.action(context);

      expect(spawn).toHaveBeenCalledWith('yarn', ['install'], expect.any(Object));
    });

    it('should detect npm from package-lock.json', async () => {
      const { existsSync } = await import('node:fs');
      const { spawn } = await import('node:child_process');

      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('package-lock.json')) {
          return true;
        }
        return false;
      });

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
        },
        verbose: false,
      };

      await initTask.action(context);

      expect(spawn).toHaveBeenCalledWith('npm', ['install'], expect.any(Object));
    });
  });

  describe('directory emptiness check', () => {
    it('should treat directory with only .git as empty', async () => {
      const { existsSync, readdirSync } = await import('node:fs');
      const { confirm } = await import('@inquirer/prompts');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdirSync).mockReturnValue(['.git'] as unknown as string[]);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should not prompt for confirmation
      expect(confirm).not.toHaveBeenCalled();
    });

    it('should prompt when directory has other files', async () => {
      const { existsSync, readdirSync } = await import('node:fs');
      const { confirm } = await import('@inquirer/prompts');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdirSync).mockReturnValue([
        'src',
        'package.json',
      ] as unknown as string[]);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          name: 'my-project',
          template: 'basic',
          'skip-install': true,
        },
        verbose: false,
      };

      await initTask.action(context);

      // Should prompt for confirmation
      expect(confirm).toHaveBeenCalled();
    });
  });
});
