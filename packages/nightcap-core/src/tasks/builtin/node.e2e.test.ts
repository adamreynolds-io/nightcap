/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 *
 * End-to-end tests for the node tasks.
 * These tests require Docker to be installed and running.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  nodeTask,
  nodeStopTask,
  nodeStatusTask,
  nodeResetTask,
  nodeSnapshotTask,
  nodeRestoreTask,
  nodeSnapshotsTask,
  nodeSnapshotDeleteTask,
  nodeExecTask,
} from './node.js';
import type { TaskContext, NightcapConfig } from '../types.js';

/**
 * Check if Docker is available
 */
function isDockerAvailable(): boolean {
  const result = spawnSync('docker', ['info'], { encoding: 'utf8' });
  return result.status === 0;
}

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
    docker: {
      // Use non-standard ports to avoid conflicts with any running stack
      ports: {
        nodeRpc: 19933,
        nodeWs: 19944,
        indexer: 18088,
        proofServer: 16300,
      },
      ...configOverrides.docker,
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

describe('node e2e', () => {
  let dockerAvailable: boolean;
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Check Docker availability once
    dockerAvailable = isDockerAvailable();

    if (!dockerAvailable) {
      console.warn('Docker not available. Node e2e tests will be skipped.');
      return;
    }

    // Create temp directory for tests
    testDir = join(tmpdir(), `nightcap-node-e2e-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Save original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterAll(async () => {
    if (!dockerAvailable) return;

    // Restore cwd
    process.chdir(originalCwd);

    // Make sure stack is stopped
    try {
      const context = createTestContext();
      await nodeStopTask.action(context);
    } catch {
      // Ignore errors - stack might not be running
    }

    // Clean up temp directory
    if (testDir && existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Docker availability', () => {
    it('should detect Docker availability correctly', () => {
      // This test always runs to verify our detection logic
      const result = spawnSync('docker', ['--version'], { encoding: 'utf8' });
      const expected = result.status === 0;
      expect(isDockerAvailable()).toBe(expected);
    });
  });

  describe('node:status', () => {
    it('should report status when stack is not running', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Stop any running stack first
      try {
        const stopContext = createTestContext();
        await nodeStopTask.action(stopContext);
      } catch {
        // Ignore - might not be running
      }

      const context = createTestContext();

      // Should not throw
      await expect(nodeStatusTask.action(context)).resolves.not.toThrow();
    });
  });

  describe('node start/stop lifecycle', () => {
    it('should start and stop the stack in detached mode', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Start in detached mode
      const startContext = createTestContext({ detach: true });
      await expect(nodeTask.action(startContext)).resolves.not.toThrow();

      // Check status - should be running
      const statusContext = createTestContext();
      await expect(nodeStatusTask.action(statusContext)).resolves.not.toThrow();

      // Stop the stack
      const stopContext = createTestContext();
      await expect(nodeStopTask.action(stopContext)).resolves.not.toThrow();
    }, 120000); // 2 minute timeout for Docker operations

    it('should handle start when already running', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Start first time
      const startContext1 = createTestContext({ detach: true });
      await nodeTask.action(startContext1);

      // Start again - should not throw, just report already running
      const startContext2 = createTestContext({ detach: true });
      await expect(nodeTask.action(startContext2)).resolves.not.toThrow();

      // Clean up
      const stopContext = createTestContext();
      await nodeStopTask.action(stopContext);
    }, 120000);

    it('should handle stop when not running', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Make sure stack is stopped first
      try {
        const stopContext1 = createTestContext();
        await nodeStopTask.action(stopContext1);
      } catch {
        // Ignore
      }

      // Stop again - should not throw
      const stopContext2 = createTestContext();
      await expect(nodeStopTask.action(stopContext2)).resolves.not.toThrow();
    }, 60000);
  });

  describe('node:reset', () => {
    it('should reset stack data', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Make sure stack is stopped
      try {
        const stopContext = createTestContext();
        await nodeStopTask.action(stopContext);
      } catch {
        // Ignore
      }

      const context = createTestContext();
      await expect(nodeResetTask.action(context)).resolves.not.toThrow();
    }, 60000);
  });

  describe('node:exec', () => {
    it('should fail when stack is not running', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Make sure stack is stopped
      try {
        const stopContext = createTestContext();
        await nodeStopTask.action(stopContext);
      } catch {
        // Ignore
      }

      const context = createTestContext({
        service: 'node',
        command: 'echo hello',
      });

      await expect(nodeExecTask.action(context)).rejects.toThrow('Stack not running');
    }, 60000);

    it('should reject invalid service names', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const context = createTestContext({
        service: 'invalid-service',
        command: 'echo hello',
      });

      await expect(nodeExecTask.action(context)).rejects.toThrow('Invalid service');
    });

    it('should reject shell metacharacters', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Start stack first
      const startContext = createTestContext({ detach: true });
      await nodeTask.action(startContext);

      try {
        // Try command with pipe - should fail
        const pipeContext = createTestContext({
          service: 'node',
          command: 'echo hello | cat',
        });
        await expect(nodeExecTask.action(pipeContext)).rejects.toThrow('Shell metacharacter');

        // Try command with redirect - should fail
        const redirectContext = createTestContext({
          service: 'node',
          command: 'echo hello > /tmp/test',
        });
        await expect(nodeExecTask.action(redirectContext)).rejects.toThrow('Shell metacharacter');
      } finally {
        // Clean up
        const stopContext = createTestContext();
        await nodeStopTask.action(stopContext);
      }
    }, 120000);
  });

  describe('snapshots', () => {
    beforeEach(async () => {
      if (!dockerAvailable) return;

      // Clean up any existing test snapshots
      try {
        const deleteContext = createTestContext({ name: 'test-snapshot' });
        await nodeSnapshotDeleteTask.action(deleteContext);
      } catch {
        // Ignore - snapshot might not exist
      }
    });

    it('should list snapshots (empty initially)', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const context = createTestContext();
      await expect(nodeSnapshotsTask.action(context)).resolves.not.toThrow();
    });

    it('should fail snapshot creation when no data directory exists', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      // Without starting the stack, there's no data to snapshot
      const createContext = createTestContext({ name: 'test-snapshot' });
      await expect(nodeSnapshotTask.action(createContext)).rejects.toThrow('No data directory');
    });

    it('should fail restore when snapshot does not exist', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const restoreContext = createTestContext({ name: 'nonexistent-snapshot' });
      await expect(nodeRestoreTask.action(restoreContext)).rejects.toThrow();
    });

    it('should require snapshot name for create', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const context = createTestContext({ name: '' });
      await expect(nodeSnapshotTask.action(context)).rejects.toThrow('Snapshot name required');
    });

    it('should require snapshot name for restore', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const context = createTestContext({ name: '' });
      await expect(nodeRestoreTask.action(context)).rejects.toThrow('Snapshot name required');
    });

    it('should require snapshot name for delete', async () => {
      if (!dockerAvailable) {
        console.log('Skipping test: Docker not available');
        return;
      }

      const context = createTestContext({ name: '' });
      await expect(nodeSnapshotDeleteTask.action(context)).rejects.toThrow('Snapshot name required');
    });
  });
});
