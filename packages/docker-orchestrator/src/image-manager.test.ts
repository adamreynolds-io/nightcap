/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageManager } from './image-manager.js';
import type { DockerClient } from './docker-client.js';
import { DEFAULT_IMAGES } from './types.js';

function createMockClient(overrides?: Partial<DockerClient>): DockerClient {
  return {
    isAvailable: vi.fn().mockResolvedValue(true),
    getVersion: vi
      .fn()
      .mockResolvedValue({ version: '24.0.0', apiVersion: '1.43' }),
    imageExists: vi.fn().mockResolvedValue(true),
    pullImage: vi.fn().mockResolvedValue({ success: true }),
    listContainers: vi.fn().mockResolvedValue([]),
    startContainer: vi.fn().mockResolvedValue({ success: true }),
    stopContainer: vi.fn().mockResolvedValue({ success: true }),
    removeContainer: vi.fn().mockResolvedValue({ success: true }),
    getContainerLogs: vi.fn().mockResolvedValue(''),
    ...overrides,
  } as unknown as DockerClient;
}

describe('ImageManager', () => {
  let manager: ImageManager;
  let mockClient: DockerClient;

  beforeEach(() => {
    mockClient = createMockClient();
    manager = new ImageManager(mockClient);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(manager).toBeInstanceOf(ImageManager);
    });
  });

  describe('getRequiredImages', () => {
    it('should return all default images', () => {
      const images = manager.getRequiredImages();
      expect(images).toContain(DEFAULT_IMAGES.node);
      expect(images).toContain(DEFAULT_IMAGES.indexer);
      expect(images).toContain(DEFAULT_IMAGES.proofServer);
    });

    it('should return correct number of images', () => {
      const images = manager.getRequiredImages();
      expect(images).toHaveLength(3);
    });
  });

  describe('getMissingImages', () => {
    it('should return empty array when all images exist', async () => {
      const missing = await manager.getMissingImages();
      expect(missing).toEqual([]);
    });

    it('should return missing images', async () => {
      const mockClientWithMissing = createMockClient({
        imageExists: vi.fn().mockImplementation((image: string) => {
          return Promise.resolve(image !== DEFAULT_IMAGES.node);
        }),
      });
      const managerWithMissing = new ImageManager(mockClientWithMissing);

      const missing = await managerWithMissing.getMissingImages();
      expect(missing).toContain(DEFAULT_IMAGES.node);
      expect(missing).toHaveLength(1);
    });

    it('should check custom images', async () => {
      const customImages = {
        node: 'custom/node:v1',
      };

      await manager.getMissingImages(customImages);

      expect(mockClient.imageExists).toHaveBeenCalledWith('custom/node:v1');
    });
  });

  describe('hasAllImages', () => {
    it('should return true when all images exist', async () => {
      const hasAll = await manager.hasAllImages();
      expect(hasAll).toBe(true);
    });

    it('should return false when images are missing', async () => {
      const mockClientWithMissing = createMockClient({
        imageExists: vi.fn().mockResolvedValue(false),
      });
      const managerWithMissing = new ImageManager(mockClientWithMissing);

      const hasAll = await managerWithMissing.hasAllImages();
      expect(hasAll).toBe(false);
    });
  });

  describe('pullImage', () => {
    it('should pull a single image', async () => {
      const result = await manager.pullImage('test-image');
      expect(result.success).toBe(true);
      expect(mockClient.pullImage).toHaveBeenCalledWith(
        'test-image',
        expect.any(Function)
      );
    });

    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      await manager.pullImage('test-image', onProgress);

      // The mock should have called the callback
      const pullCall = vi.mocked(mockClient.pullImage).mock.calls[0];
      const progressCallback = pullCall?.[1];
      if (progressCallback) {
        progressCallback('Downloading', { current: 50, total: 100 });
      }

      expect(onProgress).toHaveBeenCalledWith({
        image: 'test-image',
        status: 'Downloading',
        progress: { current: 50, total: 100 },
      });
    });
  });

  describe('pullMissingImages', () => {
    it('should return success when no images missing', async () => {
      const result = await manager.pullMissingImages();
      expect(result.success).toBe(true);
      expect(Object.keys(result.results)).toHaveLength(0);
    });

    it('should pull only missing images', async () => {
      const mockClientWithMissing = createMockClient({
        imageExists: vi.fn().mockImplementation((image: string) => {
          return Promise.resolve(image !== DEFAULT_IMAGES.node);
        }),
        pullImage: vi.fn().mockResolvedValue({ success: true }),
      });
      const managerWithMissing = new ImageManager(mockClientWithMissing);

      const result = await managerWithMissing.pullMissingImages();

      expect(result.success).toBe(true);
      expect(result.results[DEFAULT_IMAGES.node]).toBeDefined();
      expect(mockClientWithMissing.pullImage).toHaveBeenCalledTimes(1);
    });

    it('should report failure when pull fails', async () => {
      const mockClientWithFailure = createMockClient({
        imageExists: vi.fn().mockResolvedValue(false),
        pullImage: vi
          .fn()
          .mockResolvedValue({ success: false, error: 'Pull failed' }),
      });
      const managerWithFailure = new ImageManager(mockClientWithFailure);

      const result = await managerWithFailure.pullMissingImages();

      expect(result.success).toBe(false);
    });
  });

  describe('pullAllImages', () => {
    it('should pull all images', async () => {
      const result = await manager.pullAllImages();

      expect(result.success).toBe(true);
      expect(mockClient.pullImage).toHaveBeenCalledTimes(3);
    });

    it('should include custom images', async () => {
      const customImages = {
        node: 'custom/node:v1',
      };

      await manager.pullAllImages(undefined, customImages);

      expect(mockClient.pullImage).toHaveBeenCalledWith(
        'custom/node:v1',
        expect.any(Function)
      );
    });

    it('should report failure when any pull fails', async () => {
      const mockClientWithFailure = createMockClient({
        pullImage: vi.fn().mockImplementation((image: string) => {
          if (image === DEFAULT_IMAGES.node) {
            return Promise.resolve({ success: false, error: 'Pull failed' });
          }
          return Promise.resolve({ success: true });
        }),
      });
      const managerWithFailure = new ImageManager(mockClientWithFailure);

      const result = await managerWithFailure.pullAllImages();

      expect(result.success).toBe(false);
      expect(result.results[DEFAULT_IMAGES.node]?.success).toBe(false);
    });
  });

  describe('formatProgress', () => {
    it('should format basic progress', () => {
      const formatted = ImageManager.formatProgress({
        image: 'test-image',
        status: 'Downloading',
      });

      expect(formatted).toBe('test-image: Downloading');
    });

    it('should format progress with percentage', () => {
      const formatted = ImageManager.formatProgress({
        image: 'test-image',
        status: 'Downloading',
        progress: { current: 50 * 1024 * 1024, total: 100 * 1024 * 1024 },
      });

      expect(formatted).toContain('50%');
      expect(formatted).toContain('MB');
    });

    it('should format progress with layer ID', () => {
      const formatted = ImageManager.formatProgress({
        image: 'test-image',
        status: 'Downloading',
        layerId: 'abc123',
      });

      expect(formatted).toBe('abc123: Downloading');
    });
  });
});

describe('ImageManager byte formatting', () => {
  it('should format bytes correctly', () => {
    // Test via formatProgress which uses formatBytes internally
    const kb = ImageManager.formatProgress({
      image: 'test',
      status: 'test',
      progress: { current: 1024, total: 2048 },
    });
    expect(kb).toContain('KB');

    const mb = ImageManager.formatProgress({
      image: 'test',
      status: 'test',
      progress: { current: 1024 * 1024, total: 2 * 1024 * 1024 },
    });
    expect(mb).toContain('MB');

    const gb = ImageManager.formatProgress({
      image: 'test',
      status: 'test',
      progress: { current: 1024 * 1024 * 1024, total: 2 * 1024 * 1024 * 1024 },
    });
    expect(gb).toContain('GB');
  });
});
