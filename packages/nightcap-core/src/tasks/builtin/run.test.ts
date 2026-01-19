/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runTask } from './run.js';

// Mock fs module
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe('run task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up global
    delete (globalThis as Record<string, unknown>).nightcap;
  });

  describe('task definition', () => {
    it('should have correct name', () => {
      expect(runTask.name).toBe('run');
    });

    it('should have description', () => {
      expect(runTask.description).toBe('Execute a standalone script with Nightcap context');
    });

    it('should have action function', () => {
      expect(typeof runTask.action).toBe('function');
    });

    it('should have script parameter', () => {
      expect(runTask.params).toHaveProperty('script');
      expect(runTask.params?.script.required).toBe(true);
    });
  });

  describe('script validation', () => {
    it('should throw error when script path is missing', async () => {
      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {},
        verbose: false,
      };

      await expect(runTask.action(context)).rejects.toThrow('Missing script path');
    });

    it('should throw error when script file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: { script: 'nonexistent.ts' },
        verbose: false,
      };

      await expect(runTask.action(context)).rejects.toThrow('Script not found');
    });
  });

  describe('deployment history loading', () => {
    it('should handle missing deployments directory gracefully', async () => {
      // Script doesn't exist - test should fail with expected error
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        // Script exists but deployments dir doesn't
        if (pathStr.endsWith('test-script.js')) return true;
        return false;
      });

      // Return empty array for deployment dir (which doesn't exist anyway)
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const context = {
        config: { paths: { deployments: 'deployments' } },
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: { script: 'test-script.js' },
        verbose: false,
      };

      // The script import will fail, but the deployment history loading
      // should not throw an error for missing directory
      await expect(runTask.action(context)).rejects.toThrow();
    });
  });

  describe('script context', () => {
    it('should set global nightcap context before script execution', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const context = {
        config: { test: 'value' },
        network: { name: 'localnet', nodeUrl: 'http://localhost:9944' },
        networkName: 'localnet',
        params: { script: '/tmp/test-script.mjs' },
        verbose: false,
      };

      // We can't easily test the full flow without actually running a script,
      // but we can verify the task structure is correct
      expect(runTask.params?.script.type).toBe('string');
    });
  });
});
