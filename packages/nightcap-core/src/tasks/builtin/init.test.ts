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
  checkbox: vi.fn().mockResolvedValue([]),
}));

// Mock fs operations
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readdirSync: vi.fn().mockReturnValue([]),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  cp: vi.fn().mockResolvedValue(undefined),
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

// Mock contract-loader
vi.mock('../../compiler/contract-loader.js', () => ({
  loadCompiledContract: vi.fn().mockResolvedValue({
    name: 'TestContract',
    circuits: [
      { name: 'increment', isImpure: true, parameters: [] },
      { name: 'decrement', isImpure: true, parameters: [] },
      { name: 'getValue', isImpure: false, parameters: [] },
    ],
    modulePath: '/mock/path/contract/index.cjs',
  }),
  isCompiledContract: vi.fn().mockReturnValue(true),
  toCamelCase: vi.fn((str: string) => str.charAt(0).toLowerCase() + str.slice(1)),
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

describe('init --from-contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have from-contract param defined', () => {
    expect(initTask.params?.['from-contract']).toBeDefined();
    expect(initTask.params?.['from-contract']?.type).toBe('string');
  });

  it('should create project from compiled contract', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { writeFile, mkdir, cp } = await import('node:fs/promises');
    const { logger } = await import('../../utils/logger.js');
    const { loadCompiledContract, isCompiledContract } = await import(
      '../../compiler/contract-loader.js'
    );

    // existsSync returns true only for contract path check, false for directory/file checks
    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      const p = String(path);
      // Return true for contract path validation
      if (p.includes('TestContract')) return true;
      // Return false for all other paths (file exists check)
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(true);
    vi.mocked(loadCompiledContract).mockResolvedValue({
      name: 'TestContract',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
        { name: 'decrement', isImpure: true, parameters: [] },
        { name: 'getValue', isImpure: false, parameters: [] },
      ],
      modulePath: '/mock/path/contract/index.cjs',
    });

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/path/to/TestContract',
        'skip-install': true,
      },
      verbose: false,
    };

    await initTask.action(context);

    // Should have loaded the contract
    expect(loadCompiledContract).toHaveBeenCalledWith(
      expect.stringContaining('TestContract')
    );

    // Should have created files
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();

    // Should have copied contract artifacts
    expect(cp).toHaveBeenCalled();

    // Should show success message
    expect(logger.success).toHaveBeenCalledWith('Project created successfully!');
  });

  it('should use provided name when --name is specified', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { writeFile } = await import('node:fs/promises');
    const { isCompiledContract, loadCompiledContract } = await import('../../compiler/contract-loader.js');

    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      const p = String(path);
      if (p.includes('TestContract')) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(true);
    vi.mocked(loadCompiledContract).mockResolvedValue({
      name: 'TestContract',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
      ],
      modulePath: '/mock/path/contract/index.cjs',
    });

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/path/to/TestContract',
        name: 'my-custom-name',
        'skip-install': true,
      },
      verbose: false,
    };

    await initTask.action(context);

    // Should have used the custom name in package.json
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      expect.stringContaining('my-custom-name'),
      'utf8'
    );
  });

  it('should throw error if contract path does not exist', async () => {
    const { existsSync, readdirSync } = await import('node:fs');

    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readdirSync).mockReturnValue([]);

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/nonexistent/path',
        'skip-install': true,
      },
      verbose: false,
    };

    await expect(initTask.action(context)).rejects.toThrow(
      'Contract path does not exist'
    );
  });

  it('should throw error if path is not a valid compiled contract', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { isCompiledContract } = await import('../../compiler/contract-loader.js');

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(false);

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/invalid/contract',
        'skip-install': true,
      },
      verbose: false,
    };

    await expect(initTask.action(context)).rejects.toThrow(
      'No valid compiled contract found'
    );
  });

  it('should generate circuit handler files', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { writeFile } = await import('node:fs/promises');
    const { isCompiledContract, loadCompiledContract } = await import('../../compiler/contract-loader.js');

    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      const p = String(path);
      if (p.includes('TestContract')) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(true);
    vi.mocked(loadCompiledContract).mockResolvedValue({
      name: 'TestContract',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
        { name: 'decrement', isImpure: true, parameters: [] },
        { name: 'getValue', isImpure: false, parameters: [] },
      ],
      modulePath: '/mock/path/contract/index.cjs',
    });

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/path/to/TestContract',
        'skip-install': true,
      },
      verbose: false,
    };

    await initTask.action(context);

    // Should have created circuit handler files for impure circuits
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('src/circuits/increment.ts'),
      expect.any(String),
      'utf8'
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('src/circuits/decrement.ts'),
      expect.any(String),
      'utf8'
    );
  });

  it('should generate contract wrapper file', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { writeFile } = await import('node:fs/promises');
    const { isCompiledContract, loadCompiledContract } = await import('../../compiler/contract-loader.js');

    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      const p = String(path);
      if (p.includes('TestContract')) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(true);
    vi.mocked(loadCompiledContract).mockResolvedValue({
      name: 'TestContract',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
      ],
      modulePath: '/mock/path/contract/index.cjs',
    });

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/path/to/TestContract',
        'skip-install': true,
      },
      verbose: false,
    };

    await initTask.action(context);

    // Should have created contract wrapper
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('src/contract.ts'),
      expect.any(String),
      'utf8'
    );
  });

  it('should show circuit information in logs', async () => {
    const { existsSync, readdirSync } = await import('node:fs');
    const { logger } = await import('../../utils/logger.js');
    const { isCompiledContract, loadCompiledContract } = await import('../../compiler/contract-loader.js');

    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      const p = String(path);
      if (p.includes('TestContract')) return true;
      return false;
    });
    vi.mocked(readdirSync).mockReturnValue([]);
    vi.mocked(isCompiledContract).mockReturnValue(true);
    vi.mocked(loadCompiledContract).mockResolvedValue({
      name: 'TestContract',
      circuits: [
        { name: 'increment', isImpure: true, parameters: [] },
        { name: 'decrement', isImpure: true, parameters: [] },
        { name: 'getValue', isImpure: false, parameters: [] },
      ],
      modulePath: '/mock/path/contract/index.cjs',
    });

    const context = {
      config: {},
      network: { name: 'localnet' },
      networkName: 'localnet',
      params: {
        'from-contract': '/path/to/TestContract',
        'skip-install': true,
      },
      verbose: false,
    };

    await initTask.action(context);

    // Should log the found contract
    expect(logger.success).toHaveBeenCalledWith('Found contract: TestContract');

    // Should log the circuits
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('increment')
    );
  });
});
