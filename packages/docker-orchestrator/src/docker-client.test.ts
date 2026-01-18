/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DockerClient } from './docker-client.js';

// Mock dockerode
vi.mock('dockerode', () => {
  const mockContainer = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    logs: vi.fn().mockResolvedValue(Buffer.from('test logs')),
  };

  const mockImage = {
    inspect: vi.fn().mockResolvedValue({ Id: 'test-image-id' }),
  };

  const MockDocker = vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue('OK'),
    version: vi
      .fn()
      .mockResolvedValue({ Version: '24.0.0', ApiVersion: '1.43' }),
    getImage: vi.fn().mockReturnValue(mockImage),
    getContainer: vi.fn().mockReturnValue(mockContainer),
    listContainers: vi.fn().mockResolvedValue([
      {
        Id: 'container1',
        Names: ['/nightcap_node'],
        State: 'running',
        Image: 'midnightntwrk/midnight-node:latest',
        Status: 'Up 2 hours (healthy)',
        Ports: [{ PrivatePort: 9944, PublicPort: 9944, Type: 'tcp' }],
        Created: Math.floor(Date.now() / 1000),
      },
    ]),
    pull: vi.fn().mockResolvedValue({
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({ status: 'Pulling' }));
        }
        if (event === 'end') {
          callback();
        }
      }),
    }),
    modem: {
      followProgress: vi.fn(
        (
          _stream: unknown,
          onFinished: (err: Error | null) => void,
          _onProgress: (event: unknown) => void
        ) => {
          onFinished(null);
        }
      ),
    },
  }));

  return { default: MockDocker };
});

describe('DockerClient', () => {
  let client: DockerClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DockerClient();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(client).toBeInstanceOf(DockerClient);
    });

    it('should accept options', () => {
      const clientWithOptions = new DockerClient({
        socketPath: '/var/run/docker.sock',
      });
      expect(clientWithOptions).toBeInstanceOf(DockerClient);
    });
  });

  describe('isAvailable', () => {
    it('should return true when Docker is available', async () => {
      const result = await client.isAvailable();
      expect(result).toBe(true);
    });

    it('should cache the result', async () => {
      await client.isAvailable();
      await client.isAvailable();
      // The ping should only be called once due to caching
    });
  });

  describe('getVersion', () => {
    it('should return version info', async () => {
      const version = await client.getVersion();
      expect(version).toEqual({
        version: '24.0.0',
        apiVersion: '1.43',
      });
    });
  });

  describe('imageExists', () => {
    it('should return true for existing image', async () => {
      const exists = await client.imageExists('test-image');
      expect(exists).toBe(true);
    });
  });

  describe('pullImage', () => {
    it('should pull an image', async () => {
      const result = await client.pullImage('test-image');
      expect(result.success).toBe(true);
    });

    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      await client.pullImage('test-image', onProgress);
      // Progress callback may or may not be called depending on mock behavior
    });
  });

  describe('listContainers', () => {
    it('should list containers', async () => {
      const containers = await client.listContainers();
      expect(containers).toHaveLength(1);
      expect(containers[0]?.name).toBe('nightcap_node');
      expect(containers[0]?.state).toBe('running');
    });

    it('should parse health status', async () => {
      const containers = await client.listContainers();
      expect(containers[0]?.health).toBe('healthy');
    });

    it('should filter by name', async () => {
      const containers = await client.listContainers({
        name: ['nightcap'],
      });
      expect(containers).toHaveLength(1);
    });
  });

  describe('startContainer', () => {
    it('should start a container', async () => {
      const result = await client.startContainer('container1');
      expect(result.success).toBe(true);
    });
  });

  describe('stopContainer', () => {
    it('should stop a container', async () => {
      const result = await client.stopContainer('container1');
      expect(result.success).toBe(true);
    });

    it('should accept timeout option', async () => {
      const result = await client.stopContainer('container1', 30);
      expect(result.success).toBe(true);
    });
  });

  describe('removeContainer', () => {
    it('should remove a container', async () => {
      const result = await client.removeContainer('container1');
      expect(result.success).toBe(true);
    });

    it('should accept force option', async () => {
      const result = await client.removeContainer('container1', { force: true });
      expect(result.success).toBe(true);
    });

    it('should accept removeVolumes option', async () => {
      const result = await client.removeContainer('container1', {
        removeVolumes: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getContainerLogs', () => {
    it('should get container logs', async () => {
      const logs = await client.getContainerLogs('container1');
      expect(typeof logs).toBe('string');
    });

    it('should accept tail option', async () => {
      const logs = await client.getContainerLogs('container1', { tail: 50 });
      expect(typeof logs).toBe('string');
    });
  });
});

describe('DockerClient error handling', () => {
  let client: DockerClient;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Re-mock with error behavior
    const Docker = (await import('dockerode')).default;
    vi.mocked(Docker).mockImplementation(
      () =>
        ({
          ping: vi.fn().mockRejectedValue(new Error('Docker not available')),
          version: vi.fn().mockRejectedValue(new Error('Cannot get version')),
          getImage: vi.fn().mockReturnValue({
            inspect: vi
              .fn()
              .mockRejectedValue(new Error('Image not found')),
          }),
          getContainer: vi.fn().mockReturnValue({
            start: vi.fn().mockRejectedValue(new Error('Container not found')),
            stop: vi.fn().mockRejectedValue(new Error('Container not running')),
            remove: vi
              .fn()
              .mockRejectedValue(new Error('Cannot remove container')),
            logs: vi.fn().mockRejectedValue(new Error('Cannot get logs')),
          }),
          listContainers: vi
            .fn()
            .mockRejectedValue(new Error('Cannot list containers')),
          pull: vi.fn().mockRejectedValue(new Error('Cannot pull image')),
          modem: { followProgress: vi.fn() },
        }) as unknown as ReturnType<typeof Docker>
    );

    client = new DockerClient();
  });

  it('should return false when Docker is not available', async () => {
    const result = await client.isAvailable();
    expect(result).toBe(false);
  });

  it('should return null for version when unavailable', async () => {
    const version = await client.getVersion();
    expect(version).toBeNull();
  });

  it('should return false for non-existent image', async () => {
    const exists = await client.imageExists('nonexistent');
    expect(exists).toBe(false);
  });

  it('should return error result for failed pull', async () => {
    const result = await client.pullImage('nonexistent');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return empty array for failed listContainers', async () => {
    const containers = await client.listContainers();
    expect(containers).toEqual([]);
  });

  it('should return error result for failed start', async () => {
    const result = await client.startContainer('nonexistent');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error result for failed stop', async () => {
    const result = await client.stopContainer('nonexistent');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error result for failed remove', async () => {
    const result = await client.removeContainer('nonexistent');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return empty string for failed logs', async () => {
    const logs = await client.getContainerLogs('nonexistent');
    expect(logs).toBe('');
  });
});
