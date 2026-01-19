/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { consoleTask } from './console.js';

// Mock fs module
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// Mock repl module to avoid interactive prompts in tests
vi.mock('node:repl', () => ({
  start: vi.fn(() => ({
    context: {},
    setupHistory: vi.fn((_, cb) => cb(null)),
    defineCommand: vi.fn(),
    on: vi.fn((event, cb) => {
      // Immediately call exit to end the test
      if (event === 'exit') {
        setTimeout(cb, 10);
      }
    }),
  })),
}));

describe('console task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('task definition', () => {
    it('should have correct name', () => {
      expect(consoleTask.name).toBe('console');
    });

    it('should have description', () => {
      expect(consoleTask.description).toBe('Open an interactive console for contract interaction');
    });

    it('should have action function', () => {
      expect(typeof consoleTask.action).toBe('function');
    });
  });

  describe('artifact loading', () => {
    it('should handle missing artifacts directory', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const context = {
        config: { paths: { artifacts: 'artifacts' } },
        network: { name: 'localnet', nodeUrl: 'http://localhost:9944' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      // Should not throw
      await expect(consoleTask.action(context)).resolves.toBeUndefined();
    });

    it('should load contract artifacts from directory', async () => {
      const mockEntries = [
        { name: 'Counter', isDirectory: () => true, isFile: () => false },
        { name: 'Token', isDirectory: () => true, isFile: () => false },
      ];

      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr.includes('artifacts')) return true;
        if (pathStr.includes('contract/index.cjs')) return true;
        if (pathStr.includes('.nightcap')) return true;
        return false;
      });

      vi.mocked(fs.readdirSync).mockReturnValue(mockEntries as unknown as fs.Dirent[]);

      const context = {
        config: { paths: { artifacts: 'artifacts' } },
        network: { name: 'localnet', nodeUrl: 'http://localhost:9944' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      // Should not throw even if import fails
      await expect(consoleTask.action(context)).resolves.toBeUndefined();
    });
  });

  describe('context creation', () => {
    it('should create context with required properties', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const repl = await import('node:repl');
      let capturedContext: Record<string, unknown> = {};

      vi.mocked(repl.start).mockImplementation(() => {
        const server = {
          context: {},
          setupHistory: vi.fn((_, cb) => cb(null)),
          defineCommand: vi.fn(),
          on: vi.fn((event, cb) => {
            if (event === 'exit') {
              setTimeout(cb, 10);
            }
          }),
        };
        // Capture context when Object.assign is called
        const originalAssign = Object.assign;
        Object.assign = function (target: object, ...sources: object[]) {
          if (target === server.context) {
            capturedContext = sources[0] as Record<string, unknown>;
          }
          return originalAssign.call(this, target, ...sources);
        };
        return server as unknown as ReturnType<typeof repl.start>;
      });

      const context = {
        config: { defaultNetwork: 'localnet' },
        network: { name: 'localnet', nodeUrl: 'http://localhost:9944' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      await consoleTask.action(context);

      // Verify context has expected helpers
      expect(capturedContext).toHaveProperty('config');
      expect(capturedContext).toHaveProperty('network');
      expect(capturedContext).toHaveProperty('networkName');
      expect(capturedContext).toHaveProperty('contracts');
      expect(capturedContext).toHaveProperty('getContract');
      expect(capturedContext).toHaveProperty('listContracts');
      expect(capturedContext).toHaveProperty('deployContract');
      expect(capturedContext).toHaveProperty('getContractAt');
      expect(capturedContext).toHaveProperty('getBalance');
      expect(capturedContext).toHaveProperty('getBlock');
      expect(capturedContext).toHaveProperty('help');
    });
  });

  describe('REPL setup', () => {
    it('should define custom commands', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const repl = await import('node:repl');
      const defineCommandMock = vi.fn();

      vi.mocked(repl.start).mockImplementation(() => ({
        context: {},
        setupHistory: vi.fn((_, cb) => cb(null)),
        defineCommand: defineCommandMock,
        on: vi.fn((event, cb) => {
          if (event === 'exit') {
            setTimeout(cb, 10);
          }
        }),
      } as unknown as ReturnType<typeof repl.start>));

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      await consoleTask.action(context);

      // Should define .contracts and .network commands
      expect(defineCommandMock).toHaveBeenCalledWith('contracts', expect.any(Object));
      expect(defineCommandMock).toHaveBeenCalledWith('network', expect.any(Object));
    });

    it('should setup history', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const repl = await import('node:repl');
      const setupHistoryMock = vi.fn((_, cb) => cb(null));

      vi.mocked(repl.start).mockImplementation(() => ({
        context: {},
        setupHistory: setupHistoryMock,
        defineCommand: vi.fn(),
        on: vi.fn((event, cb) => {
          if (event === 'exit') {
            setTimeout(cb, 10);
          }
        }),
      } as unknown as ReturnType<typeof repl.start>));

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      await consoleTask.action(context);

      expect(setupHistoryMock).toHaveBeenCalled();
      const historyPath = setupHistoryMock.mock.calls[0]?.[0];
      expect(historyPath).toContain('.nightcap');
      expect(historyPath).toContain('console_history');
    });

    it('should configure auto-completion', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const repl = await import('node:repl');
      let capturedOptions: Record<string, unknown> = {};

      vi.mocked(repl.start).mockImplementation((options) => {
        capturedOptions = options as Record<string, unknown>;
        return {
          context: {},
          setupHistory: vi.fn((_, cb) => cb(null)),
          defineCommand: vi.fn(),
          on: vi.fn((event, cb) => {
            if (event === 'exit') {
              setTimeout(cb, 10);
            }
          }),
        } as unknown as ReturnType<typeof repl.start>;
      });

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      await consoleTask.action(context);

      // Verify completer is configured
      expect(capturedOptions).toHaveProperty('completer');
      expect(typeof capturedOptions.completer).toBe('function');
    });
  });
});
