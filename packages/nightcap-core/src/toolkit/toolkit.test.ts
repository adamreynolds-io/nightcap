/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Toolkit } from './toolkit.js';
import { ToolkitDockerBridge } from './docker-bridge.js';
import { ToolkitNativeBridge } from './native-bridge.js';
import { DEFAULT_TOOLKIT_IMAGE, TOOLKIT_ERROR_CODES } from './types.js';
import type { ToolkitEndpoint } from './types.js';

// Mock the logger
vi.mock('../utils/logger.js', () => ({
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
  spawn: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 10);
      }
    }),
    stdout: {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('{}'));
        }
      }),
    },
    stderr: {
      on: vi.fn(),
    },
    kill: vi.fn(),
  })),
}));

describe('Toolkit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const toolkit = new Toolkit();
      expect(toolkit).toBeDefined();
    });

    it('should create with custom config', () => {
      const toolkit = new Toolkit({
        image: 'custom/image:latest',
        workDir: '/custom/dir',
      });
      expect(toolkit).toBeDefined();
    });
  });

  describe('fromConfig', () => {
    it('should create Toolkit from NightcapConfig', () => {
      const config = {
        docker: {
          images: {
            toolkit: 'custom/toolkit:v1',
          },
        },
      };
      const network = { name: 'localnet' };

      const toolkit = Toolkit.fromConfig(config, network);
      expect(toolkit).toBeInstanceOf(Toolkit);
    });
  });

  describe('getEndpoint', () => {
    it('should create endpoint from network config', () => {
      const network = {
        name: 'localnet',
        nodeUrl: 'http://localhost:9933',
        indexerUrl: 'http://localhost:8088',
        proofServerUrl: 'http://localhost:6300',
      };

      const endpoint = Toolkit.getEndpoint(network);

      expect(endpoint.nodeUrl).toBe('http://localhost:9933');
      expect(endpoint.indexerUrl).toBe('http://localhost:8088');
      expect(endpoint.proofServerUrl).toBe('http://localhost:6300');
    });

    it('should use defaults for missing URLs', () => {
      const network = { name: 'localnet' };

      const endpoint = Toolkit.getEndpoint(network);

      expect(endpoint.nodeUrl).toBe('http://localhost:9933');
      expect(endpoint.indexerUrl).toBe('http://localhost:8088');
      expect(endpoint.proofServerUrl).toBe('http://localhost:6300');
    });
  });

  describe('getMode', () => {
    it('should return null before detection', () => {
      const toolkit = new Toolkit();
      expect(toolkit.getMode()).toBeNull();
    });
  });
});

describe('ToolkitDockerBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default image', () => {
      const bridge = new ToolkitDockerBridge();
      expect(bridge.getImage()).toBe(DEFAULT_TOOLKIT_IMAGE);
    });

    it('should use custom image', () => {
      const bridge = new ToolkitDockerBridge({ image: 'custom:latest' });
      expect(bridge.getImage()).toBe('custom:latest');
    });
  });

  describe('buildEndpointArgs', () => {
    it('should build source endpoint args', () => {
      const bridge = new ToolkitDockerBridge();
      const endpoint: ToolkitEndpoint = {
        nodeUrl: 'http://node:9933',
        indexerUrl: 'http://indexer:8088',
        proofServerUrl: 'http://prover:6300',
      };

      const args = bridge.buildEndpointArgs(endpoint, 'source');

      expect(args).toContain('--source');
      expect(args).toContain('chain:http://node:9933');
      expect(args).toContain('--prover');
      expect(args).toContain('http://prover:6300');
      expect(args).toContain('--indexer');
      expect(args).toContain('http://indexer:8088');
    });

    it('should build destination endpoint args', () => {
      const bridge = new ToolkitDockerBridge();
      const endpoint: ToolkitEndpoint = {
        nodeUrl: 'http://node:9933',
        indexerUrl: 'http://indexer:8088',
        proofServerUrl: 'http://prover:6300',
      };

      const args = bridge.buildEndpointArgs(endpoint, 'destination');

      expect(args).toContain('--destination');
      expect(args).toContain('chain:http://node:9933');
    });
  });
});

describe('ToolkitNativeBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildEndpointArgs', () => {
    it('should build source endpoint args', () => {
      const bridge = new ToolkitNativeBridge();
      const endpoint: ToolkitEndpoint = {
        nodeUrl: 'http://localhost:9933',
        indexerUrl: 'http://localhost:8088',
        proofServerUrl: 'http://localhost:6300',
      };

      const args = bridge.buildEndpointArgs(endpoint, 'source');

      expect(args).toContain('--source');
      expect(args).toContain('chain:http://localhost:9933');
      expect(args).toContain('--prover');
      expect(args).toContain('http://localhost:6300');
    });
  });
});

describe('TOOLKIT_ERROR_CODES', () => {
  it('should have all expected error codes', () => {
    expect(TOOLKIT_ERROR_CODES.CONNECTION_FAILED).toBe('CONNECTION_FAILED');
    expect(TOOLKIT_ERROR_CODES.INVALID_ARTIFACT).toBe('INVALID_ARTIFACT');
    expect(TOOLKIT_ERROR_CODES.INSUFFICIENT_FUNDS).toBe('INSUFFICIENT_FUNDS');
    expect(TOOLKIT_ERROR_CODES.CONTRACT_NOT_FOUND).toBe('CONTRACT_NOT_FOUND');
    expect(TOOLKIT_ERROR_CODES.PROOF_GENERATION_FAILED).toBe('PROOF_GENERATION_FAILED');
    expect(TOOLKIT_ERROR_CODES.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
    expect(TOOLKIT_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
    expect(TOOLKIT_ERROR_CODES.UNKNOWN).toBe('UNKNOWN');
  });
});

describe('DEFAULT_TOOLKIT_IMAGE', () => {
  it('should be the official midnight toolkit image', () => {
    expect(DEFAULT_TOOLKIT_IMAGE).toContain('midnight-node-toolkit');
  });
});
