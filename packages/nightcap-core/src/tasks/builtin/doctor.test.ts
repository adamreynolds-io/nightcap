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

// Mock child_process - using spawnSync for security
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn((cmd: string, args: string[]) => {
    if (cmd === 'docker' && args[0] === '--version') {
      return { status: 0, stdout: 'Docker version 24.0.0, build abc123', stderr: '' };
    }
    if (cmd === 'docker' && args[0] === 'info') {
      return { status: 0, stdout: 'Containers: 5\nRunning: 2', stderr: '' };
    }
    if (cmd === 'docker' && args[0] === 'image' && args[1] === 'inspect') {
      // Images not found
      return { status: 1, stdout: '', stderr: 'No such image' };
    }
    if (cmd === 'pnpm' && args[0] === '--version') {
      return { status: 0, stdout: '8.15.0', stderr: '' };
    }
    return { status: 1, stdout: '', stderr: `Unknown command: ${cmd} ${args.join(' ')}` };
  }),
}));

// Mock node:os for memory checks
const mockTotalmem = vi.fn();
const mockFreemem = vi.fn();
vi.mock('node:os', () => ({
  totalmem: () => mockTotalmem(),
  freemem: () => mockFreemem(),
}));

// Mock node:fs/promises for disk space checks
const mockStatfs = vi.fn();
vi.mock('node:fs/promises', () => ({
  statfs: () => mockStatfs(),
}));

// Mock global fetch for registry connectivity checks
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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
    // Default: registry is reachable (ghcr.io returns 401 for unauthenticated)
    mockFetch.mockResolvedValue({ status: 401 });
    // Default: 16 GB total memory, 8 GB free
    mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024);
    mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024);
    // Default: 100 GB total disk, 50 GB available
    mockStatfs.mockResolvedValue({
      bsize: 4096,
      blocks: 25 * 1024 * 1024, // ~100 GB total
      bfree: 12.5 * 1024 * 1024, // ~50 GB available
    });
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

  describe('registry connectivity check', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should pass when registry returns 401 (unauthenticated but reachable)', async () => {
      mockFetch.mockResolvedValue({ status: 401 });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*Registry Connectivity/)
      );
    });

    it('should pass when registry returns 200', async () => {
      mockFetch.mockResolvedValue({ status: 200 });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*Registry Connectivity/)
      );
    });

    it('should warn when registry is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('ENOTFOUND'));
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Registry Connectivity/)
      );
    });

    it('should warn when connection times out', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Registry Connectivity/)
      );
    });

    it('should warn when registry returns unexpected status', async () => {
      mockFetch.mockResolvedValue({ status: 500 });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Registry Connectivity/)
      );
    });
  });

  describe('memory check', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockFetch.mockResolvedValue({ status: 401 });
      mockStatfs.mockResolvedValue({
        bsize: 4096,
        blocks: 25 * 1024 * 1024,
        bfree: 12.5 * 1024 * 1024,
      });
    });

    it('should pass when system has sufficient memory (>= 8 GB)', async () => {
      mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16 GB
      mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024);
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*System Memory/)
      );
    });

    it('should warn when system has low memory (< 8 GB)', async () => {
      mockTotalmem.mockReturnValue(4 * 1024 * 1024 * 1024); // 4 GB
      mockFreemem.mockReturnValue(2 * 1024 * 1024 * 1024);
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*System Memory/)
      );
    });
  });

  describe('disk space check', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockFetch.mockResolvedValue({ status: 401 });
      mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024);
      mockFreemem.mockReturnValue(8 * 1024 * 1024 * 1024);
    });

    it('should pass when disk has sufficient space (>= 20 GB)', async () => {
      mockStatfs.mockResolvedValue({
        bsize: 4096,
        blocks: 50 * 1024 * 1024, // ~200 GB total
        bfree: 25 * 1024 * 1024, // ~100 GB available
      });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OK\].*Disk Space/)
      );
    });

    it('should warn when disk space is getting low (10-20 GB)', async () => {
      mockStatfs.mockResolvedValue({
        bsize: 4096,
        blocks: 25 * 1024 * 1024, // ~100 GB total
        bfree: 3.5 * 1024 * 1024, // ~14 GB available
      });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Disk Space/)
      );
    });

    it('should error when disk space is critically low (< 10 GB)', async () => {
      mockStatfs.mockResolvedValue({
        bsize: 4096,
        blocks: 25 * 1024 * 1024, // ~100 GB total
        bfree: 1 * 1024 * 1024, // ~4 GB available
      });
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      // This should throw because of the disk space error
      await expect(doctorTask.action(context)).rejects.toThrow('Doctor found errors');
    });

    it('should warn when statfs fails', async () => {
      mockStatfs.mockRejectedValue(new Error('ENOENT'));
      const { logger } = await import('../../utils/logger.js');
      const context = createMockContext();

      await doctorTask.action(context);

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Disk Space/)
      );
    });
  });
});
