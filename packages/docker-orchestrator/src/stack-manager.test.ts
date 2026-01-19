/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { StackManager } from './stack-manager.js';

// Mock the DockerClient
vi.mock('./docker-client.js', () => ({
  DockerClient: vi.fn().mockImplementation(() => ({
    isAvailable: vi.fn().mockResolvedValue(true),
    getVersion: vi.fn().mockResolvedValue({ version: '24.0.0', apiVersion: '1.43' }),
    listContainers: vi.fn().mockResolvedValue([]),
    getContainerLogs: vi.fn().mockResolvedValue(''),
  })),
}));

// Mock the ImageManager
vi.mock('./image-manager.js', () => ({
  ImageManager: vi.fn().mockImplementation(() => ({
    getMissingImages: vi.fn().mockResolvedValue([]),
    pullMissingImages: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe('StackManager', () => {
  describe('snapshots', () => {
    let testDir: string;
    let manager: StackManager;

    beforeEach(async () => {
      testDir = join(tmpdir(), `nightcap-snapshot-test-${Date.now()}`);
      await mkdir(testDir, { recursive: true });
      manager = new StackManager({}, testDir);
    });

    afterEach(async () => {
      await rm(testDir, { recursive: true, force: true });
      vi.clearAllMocks();
    });

    describe('createSnapshot', () => {
      it('should validate snapshot name format', async () => {
        const result = await manager.createSnapshot('invalid name!');
        expect(result.success).toBe(false);
        expect(result.error).toContain('alphanumeric');
      });

      it('should allow alphanumeric names with dashes and underscores', async () => {
        // Create data directory first
        const dataDir = join(testDir, '.nightcap', 'data');
        await mkdir(dataDir, { recursive: true });
        await writeFile(join(dataDir, 'test.txt'), 'test data');

        const result = await manager.createSnapshot('my-snapshot_1');
        expect(result.success).toBe(true);
      });

      it('should fail if no data directory exists', async () => {
        const result = await manager.createSnapshot('test');
        expect(result.success).toBe(false);
        expect(result.error).toContain('No data directory');
      });

      it('should fail if snapshot already exists', async () => {
        const dataDir = join(testDir, '.nightcap', 'data');
        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'existing');
        await mkdir(dataDir, { recursive: true });
        await mkdir(snapshotDir, { recursive: true });
        await writeFile(join(dataDir, 'test.txt'), 'test data');

        const result = await manager.createSnapshot('existing');
        expect(result.success).toBe(false);
        expect(result.error).toContain('already exists');
      });

      it('should copy data directory to snapshot', async () => {
        const dataDir = join(testDir, '.nightcap', 'data');
        await mkdir(dataDir, { recursive: true });
        await writeFile(join(dataDir, 'blockchain.db'), 'mock blockchain data');
        await writeFile(join(dataDir, 'state.json'), '{"key": "value"}');

        const result = await manager.createSnapshot('test-snapshot');
        expect(result.success).toBe(true);

        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'test-snapshot');
        expect(existsSync(snapshotDir)).toBe(true);
        expect(existsSync(join(snapshotDir, 'blockchain.db'))).toBe(true);
        expect(existsSync(join(snapshotDir, 'state.json'))).toBe(true);
      });

      it('should create snapshot metadata', async () => {
        const dataDir = join(testDir, '.nightcap', 'data');
        await mkdir(dataDir, { recursive: true });
        await writeFile(join(dataDir, 'test.txt'), 'test');

        await manager.createSnapshot('metadata-test');

        const metadataPath = join(testDir, '.nightcap', 'snapshots', 'metadata-test', 'snapshot.json');
        expect(existsSync(metadataPath)).toBe(true);

        const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
        expect(metadata.name).toBe('metadata-test');
        expect(metadata.createdAt).toBeDefined();
        expect(metadata.projectName).toBe('nightcap');
      });

      it('should return snapshot path on success', async () => {
        const dataDir = join(testDir, '.nightcap', 'data');
        await mkdir(dataDir, { recursive: true });
        await writeFile(join(dataDir, 'test.txt'), 'test');

        const result = await manager.createSnapshot('path-test');
        expect(result.success).toBe(true);
        expect(result.path).toBe(join(testDir, '.nightcap', 'snapshots', 'path-test'));
      });
    });

    describe('restoreSnapshot', () => {
      it('should fail if snapshot does not exist', async () => {
        const result = await manager.restoreSnapshot('nonexistent');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should restore snapshot to data directory', async () => {
        // Create snapshot with data
        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'restore-test');
        await mkdir(snapshotDir, { recursive: true });
        await writeFile(join(snapshotDir, 'blockchain.db'), 'snapshot data');
        await writeFile(join(snapshotDir, 'snapshot.json'), '{"name": "restore-test"}');

        const result = await manager.restoreSnapshot('restore-test');
        expect(result.success).toBe(true);

        const dataDir = join(testDir, '.nightcap', 'data');
        expect(existsSync(join(dataDir, 'blockchain.db'))).toBe(true);

        const content = await readFile(join(dataDir, 'blockchain.db'), 'utf8');
        expect(content).toBe('snapshot data');
      });

      it('should remove snapshot metadata from restored data', async () => {
        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'clean-restore');
        await mkdir(snapshotDir, { recursive: true });
        await writeFile(join(snapshotDir, 'data.txt'), 'test');
        await writeFile(join(snapshotDir, 'snapshot.json'), '{"name": "clean-restore"}');

        await manager.restoreSnapshot('clean-restore');

        const dataDir = join(testDir, '.nightcap', 'data');
        expect(existsSync(join(dataDir, 'data.txt'))).toBe(true);
        expect(existsSync(join(dataDir, 'snapshot.json'))).toBe(false);
      });

      it('should overwrite existing data directory', async () => {
        // Create existing data
        const dataDir = join(testDir, '.nightcap', 'data');
        await mkdir(dataDir, { recursive: true });
        await writeFile(join(dataDir, 'old.txt'), 'old data');

        // Create snapshot
        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'overwrite-test');
        await mkdir(snapshotDir, { recursive: true });
        await writeFile(join(snapshotDir, 'new.txt'), 'new data');

        await manager.restoreSnapshot('overwrite-test');

        expect(existsSync(join(dataDir, 'old.txt'))).toBe(false);
        expect(existsSync(join(dataDir, 'new.txt'))).toBe(true);
      });
    });

    describe('listSnapshots', () => {
      it('should return empty array if no snapshots directory', async () => {
        const snapshots = await manager.listSnapshots();
        expect(snapshots).toEqual([]);
      });

      it('should return empty array if snapshots directory is empty', async () => {
        await mkdir(join(testDir, '.nightcap', 'snapshots'), { recursive: true });
        const snapshots = await manager.listSnapshots();
        expect(snapshots).toEqual([]);
      });

      it('should list all snapshots', async () => {
        const snapshotsDir = join(testDir, '.nightcap', 'snapshots');
        await mkdir(join(snapshotsDir, 'snapshot1'), { recursive: true });
        await mkdir(join(snapshotsDir, 'snapshot2'), { recursive: true });

        await writeFile(
          join(snapshotsDir, 'snapshot1', 'snapshot.json'),
          JSON.stringify({ name: 'snapshot1', createdAt: '2025-01-01T12:00:00.000Z' })
        );
        await writeFile(
          join(snapshotsDir, 'snapshot2', 'snapshot.json'),
          JSON.stringify({ name: 'snapshot2', createdAt: '2025-01-02T12:00:00.000Z' })
        );

        const snapshots = await manager.listSnapshots();
        expect(snapshots).toHaveLength(2);
        expect(snapshots.map(s => s.name)).toContain('snapshot1');
        expect(snapshots.map(s => s.name)).toContain('snapshot2');
      });

      it('should sort snapshots by creation date (newest first)', async () => {
        const snapshotsDir = join(testDir, '.nightcap', 'snapshots');
        await mkdir(join(snapshotsDir, 'older'), { recursive: true });
        await mkdir(join(snapshotsDir, 'newer'), { recursive: true });

        await writeFile(
          join(snapshotsDir, 'older', 'snapshot.json'),
          JSON.stringify({ name: 'older', createdAt: '2025-01-01T00:00:00.000Z' })
        );
        await writeFile(
          join(snapshotsDir, 'newer', 'snapshot.json'),
          JSON.stringify({ name: 'newer', createdAt: '2025-01-15T00:00:00.000Z' })
        );

        const snapshots = await manager.listSnapshots();
        expect(snapshots[0].name).toBe('newer');
        expect(snapshots[1].name).toBe('older');
      });

      it('should handle snapshots without metadata', async () => {
        const snapshotsDir = join(testDir, '.nightcap', 'snapshots');
        await mkdir(join(snapshotsDir, 'no-meta'), { recursive: true });
        await writeFile(join(snapshotsDir, 'no-meta', 'data.txt'), 'some data');

        const snapshots = await manager.listSnapshots();
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0].name).toBe('no-meta');
        expect(snapshots[0].createdAt).toBe('unknown');
      });
    });

    describe('deleteSnapshot', () => {
      it('should fail if snapshot does not exist', async () => {
        const result = await manager.deleteSnapshot('nonexistent');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should delete snapshot directory', async () => {
        const snapshotDir = join(testDir, '.nightcap', 'snapshots', 'to-delete');
        await mkdir(snapshotDir, { recursive: true });
        await writeFile(join(snapshotDir, 'data.txt'), 'test');

        expect(existsSync(snapshotDir)).toBe(true);

        const result = await manager.deleteSnapshot('to-delete');
        expect(result.success).toBe(true);
        expect(existsSync(snapshotDir)).toBe(false);
      });
    });
  });
});
