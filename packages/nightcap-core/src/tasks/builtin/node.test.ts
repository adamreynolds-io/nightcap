/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  nodeTask,
  nodeStopTask,
  nodeStatusTask,
  nodeLogsTask,
  nodeResetTask,
  nodeExecTask,
} from './node.js';

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

// Mock the docker orchestrator
vi.mock('@nightcap/docker-orchestrator', () => ({
  StackManager: vi.fn().mockImplementation(() => ({
    isDockerAvailable: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockResolvedValue({
      running: true,
      services: {
        node: { state: 'running' },
        indexer: { state: 'running' },
        'proof-server': { state: 'running' },
      },
    }),
    getServiceUrls: vi.fn().mockReturnValue({
      nodeRpc: 'http://localhost:9933',
      nodeWs: 'ws://localhost:9944',
      indexer: 'http://localhost:8088',
      proofServer: 'http://localhost:6300',
    }),
    getMissingImages: vi.fn().mockResolvedValue([]),
    pullImages: vi.fn().mockResolvedValue(true),
    start: vi.fn().mockResolvedValue({ success: true }),
    stop: vi.fn().mockResolvedValue({ success: true }),
    getLogs: vi.fn().mockResolvedValue('mock logs'),
    followLogs: vi.fn().mockReturnValue({
      on: vi.fn(),
      kill: vi.fn(),
    }),
    resetData: vi.fn().mockResolvedValue({ success: true }),
    exec: vi.fn().mockResolvedValue({ success: true, output: 'command output' }),
  })),
  DEFAULT_PORTS: {
    nodeRpc: 9933,
    nodeWs: 9944,
    indexer: 8088,
    proofServer: 6300,
  },
}));

describe('node tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('nodeTask', () => {
    it('should have correct name and description', () => {
      expect(nodeTask.name).toBe('node');
      expect(nodeTask.description).toBe('Start local Midnight development network');
    });

    it('should have pull, reset, and detach params', () => {
      expect(nodeTask.params?.pull).toBeDefined();
      expect(nodeTask.params?.reset).toBeDefined();
      expect(nodeTask.params?.detach).toBeDefined();
    });

    it('should have detach param with correct defaults', () => {
      expect(nodeTask.params?.detach?.type).toBe('boolean');
      expect(nodeTask.params?.detach?.default).toBe(false);
      expect(nodeTask.params?.detach?.description).toContain('background');
    });

    it('should run in detached mode when --detach is passed', async () => {
      const { StackManager } = await import('@nightcap/docker-orchestrator');
      const mockStop = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(StackManager).mockImplementation(
        () =>
          ({
            isDockerAvailable: vi.fn().mockResolvedValue(true),
            getStatus: vi.fn().mockResolvedValue({
              running: false,
              services: { node: null, indexer: null, 'proof-server': null },
            }),
            getServiceUrls: vi.fn().mockReturnValue({
              nodeRpc: 'http://localhost:9933',
              nodeWs: 'ws://localhost:9944',
              indexer: 'http://localhost:8088',
              proofServer: 'http://localhost:6300',
            }),
            getMissingImages: vi.fn().mockResolvedValue([]),
            pullImages: vi.fn().mockResolvedValue(true),
            start: vi.fn().mockResolvedValue({ success: true }),
            stop: mockStop,
          }) as unknown as ReturnType<typeof StackManager>
      );

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: { detach: true },
        verbose: false,
      };

      // In detached mode, the action should complete without blocking
      await expect(nodeTask.action(context)).resolves.not.toThrow();
    });
  });

  describe('nodeStopTask', () => {
    it('should have correct name and description', () => {
      expect(nodeStopTask.name).toBe('node:stop');
      expect(nodeStopTask.description).toBe('Stop local Midnight development network');
    });
  });

  describe('nodeStatusTask', () => {
    it('should have correct name and description', () => {
      expect(nodeStatusTask.name).toBe('node:status');
      expect(nodeStatusTask.description).toBe('Show status of local Midnight network');
    });
  });

  describe('nodeLogsTask', () => {
    it('should have correct name and description', () => {
      expect(nodeLogsTask.name).toBe('node:logs');
      expect(nodeLogsTask.description).toBe('View logs from local Midnight network');
    });

    it('should have service, follow, and tail params', () => {
      expect(nodeLogsTask.params?.service).toBeDefined();
      expect(nodeLogsTask.params?.follow).toBeDefined();
      expect(nodeLogsTask.params?.tail).toBeDefined();
    });
  });

  describe('nodeResetTask', () => {
    it('should have correct name and description', () => {
      expect(nodeResetTask.name).toBe('node:reset');
      expect(nodeResetTask.description).toBe('Reset local Midnight network data');
    });
  });

  describe('nodeExecTask', () => {
    it('should have correct name and description', () => {
      expect(nodeExecTask.name).toBe('node:exec');
      expect(nodeExecTask.description).toBe('Execute a command in a service container');
    });

    it('should have service and command params as required', () => {
      expect(nodeExecTask.params?.service).toBeDefined();
      expect(nodeExecTask.params?.service?.required).toBe(true);
      expect(nodeExecTask.params?.command).toBeDefined();
      expect(nodeExecTask.params?.command?.required).toBe(true);
    });

    it('should execute command in running service', async () => {
      const { StackManager } = await import('@nightcap/docker-orchestrator');
      const mockExec = vi.fn().mockResolvedValue({ success: true, output: 'test output' });
      vi.mocked(StackManager).mockImplementation(() => ({
        isDockerAvailable: vi.fn().mockResolvedValue(true),
        getStatus: vi.fn().mockResolvedValue({
          running: true,
          services: {
            node: { state: 'running' },
            indexer: { state: 'running' },
            'proof-server': { state: 'running' },
          },
        }),
        getServiceUrls: vi.fn().mockReturnValue({}),
        exec: mockExec,
      }) as unknown as ReturnType<typeof StackManager>);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          service: 'node',
          command: 'ls -la',
        },
        verbose: false,
      };

      await nodeExecTask.action(context);

      expect(mockExec).toHaveBeenCalledWith('node', ['ls', '-la']);
    });

    it('should throw error for invalid service', async () => {
      const { StackManager } = await import('@nightcap/docker-orchestrator');
      vi.mocked(StackManager).mockImplementation(() => ({
        isDockerAvailable: vi.fn().mockResolvedValue(true),
        getStatus: vi.fn().mockResolvedValue({
          running: true,
          services: {
            node: { state: 'running' },
            indexer: { state: 'running' },
            'proof-server': { state: 'running' },
          },
        }),
        getServiceUrls: vi.fn().mockReturnValue({}),
        exec: vi.fn(),
      }) as unknown as ReturnType<typeof StackManager>);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          service: 'invalid-service',
          command: 'ls',
        },
        verbose: false,
      };

      await expect(nodeExecTask.action(context)).rejects.toThrow('Invalid service');
    });

    it('should throw error when stack is not running', async () => {
      const { StackManager } = await import('@nightcap/docker-orchestrator');
      vi.mocked(StackManager).mockImplementation(() => ({
        isDockerAvailable: vi.fn().mockResolvedValue(true),
        getStatus: vi.fn().mockResolvedValue({
          running: false,
          services: {
            node: null,
            indexer: null,
            'proof-server': null,
          },
        }),
        getServiceUrls: vi.fn().mockReturnValue({}),
        exec: vi.fn(),
      }) as unknown as ReturnType<typeof StackManager>);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          service: 'node',
          command: 'ls',
        },
        verbose: false,
      };

      await expect(nodeExecTask.action(context)).rejects.toThrow('Stack not running');
    });

    it('should parse command with quotes correctly', async () => {
      const { StackManager } = await import('@nightcap/docker-orchestrator');
      const mockExec = vi.fn().mockResolvedValue({ success: true, output: '' });
      vi.mocked(StackManager).mockImplementation(() => ({
        isDockerAvailable: vi.fn().mockResolvedValue(true),
        getStatus: vi.fn().mockResolvedValue({
          running: true,
          services: {
            node: { state: 'running' },
            indexer: { state: 'running' },
            'proof-server': { state: 'running' },
          },
        }),
        getServiceUrls: vi.fn().mockReturnValue({}),
        exec: mockExec,
      }) as unknown as ReturnType<typeof StackManager>);

      const context = {
        config: {},
        network: { name: 'localnet' },
        networkName: 'localnet',
        params: {
          service: 'node',
          command: 'echo "hello world"',
        },
        verbose: false,
      };

      await nodeExecTask.action(context);

      expect(mockExec).toHaveBeenCalledWith('node', ['echo', 'hello world']);
    });
  });
});
