/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { doctorTask } from './doctor.js';
import type { TaskContext } from '../types.js';

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

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn((cmd: string) => {
    if (cmd === 'docker --version') {
      return 'Docker version 24.0.0, build abc123';
    }
    if (cmd === 'docker info') {
      return 'Containers: 5\nRunning: 2';
    }
    if (cmd === 'pnpm --version') {
      return '8.15.0';
    }
    if (cmd.includes('docker image inspect')) {
      throw new Error('No such image');
    }
    throw new Error(`Unknown command: ${cmd}`);
  }),
}));

function createMockContext(overrides?: Partial<TaskContext>): TaskContext {
  return {
    config: {
      defaultNetwork: 'localnet',
      networks: {
        localnet: {
          name: 'localnet',
          nodeUrl: 'http://localhost:9944',
          indexerUrl: 'http://localhost:8080/api/v1/graphql',
          proofServerUrl: 'http://localhost:6300',
          isLocal: true,
        },
      },
    },
    network: {
      name: 'localnet',
      nodeUrl: 'http://localhost:9944',
      indexerUrl: 'http://localhost:8080/api/v1/graphql',
      proofServerUrl: 'http://localhost:6300',
      isLocal: true,
    },
    networkName: 'localnet',
    params: {},
    verbose: false,
    ...overrides,
  };
}

describe('doctorTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(doctorTask.name).toBe('doctor');
    });

    it('should have description', () => {
      expect(doctorTask.description).toBe(
        'Check system requirements and configuration'
      );
    });

    it('should have action function', () => {
      expect(typeof doctorTask.action).toBe('function');
    });
  });

  describe('action', () => {
    it('should run without throwing for valid context', async () => {
      const context = createMockContext();

      // The task may warn about missing docker images but shouldn't throw
      // because we have valid config
      await expect(doctorTask.action(context)).resolves.not.toThrow();
    });

    it('should check Node.js version', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Node.js')
      );
    });

    it('should check pnpm', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('pnpm'));
    });

    it('should check Docker', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Docker')
      );
    });

    it('should check configuration', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Configuration')
      );
    });

    it('should show warnings when Docker images are missing', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      // Should have a WARN for missing images
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
    });

    it('should report config error when network not found', async () => {
      const context = createMockContext({
        network: undefined as unknown as TaskContext['network'],
        networkName: 'nonexistent',
      });

      // This should throw because of config error
      await expect(doctorTask.action(context)).rejects.toThrow(
        'Doctor found errors'
      );
    });

    it('should show details in verbose mode', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext({ verbose: true });

      await doctorTask.action(context);

      // In verbose mode, details should be logged
      // The exact calls depend on what details are available
      expect(logger.log).toHaveBeenCalled();
    });
  });
});

describe('doctor helper functions', () => {
  // These test the exported helper functions indirectly through the task
  // For direct testing, we'd need to export them from doctor.ts

  describe('Node.js version check', () => {
    it('should pass for current Node version', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      // Current Node should pass (we require 20+)
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*Node\.js/)
      );
    });
  });

  describe('configuration check', () => {
    it('should pass for valid local network config', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*Configuration/)
      );
    });

    it('should warn for incomplete remote network config', async () => {
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext({
        network: {
          name: 'testnet',
          nodeUrl: 'http://example.com',
          // Missing indexerUrl and proofServerUrl
          isLocal: false,
        },
        networkName: 'testnet',
      });

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Configuration/)
      );
    });
  });
});
