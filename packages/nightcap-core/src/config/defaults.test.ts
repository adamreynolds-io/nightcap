/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NETWORKS,
  DEFAULT_PATHS,
  createDefaultConfig,
} from './defaults.js';

describe('DEFAULT_NETWORKS', () => {
  it('should have all expected networks', () => {
    expect(DEFAULT_NETWORKS).toHaveProperty('localnet');
    expect(DEFAULT_NETWORKS).toHaveProperty('devnet');
    expect(DEFAULT_NETWORKS).toHaveProperty('preview');
    expect(DEFAULT_NETWORKS).toHaveProperty('preprod');
    expect(DEFAULT_NETWORKS).toHaveProperty('mainnet');
  });

  describe('localnet', () => {
    it('should be configured as local', () => {
      expect(DEFAULT_NETWORKS.localnet.isLocal).toBe(true);
    });

    it('should use localhost URLs', () => {
      expect(DEFAULT_NETWORKS.localnet.nodeUrl).toContain('localhost');
      expect(DEFAULT_NETWORKS.localnet.indexerUrl).toContain('localhost');
      expect(DEFAULT_NETWORKS.localnet.proofServerUrl).toContain('localhost');
    });
  });

  describe('devnet', () => {
    it('should not be local', () => {
      expect(DEFAULT_NETWORKS.devnet.isLocal).toBe(false);
    });

    it('should use devnet URLs', () => {
      expect(DEFAULT_NETWORKS.devnet.nodeUrl).toContain('devnet.midnight.network');
    });
  });

  describe('mainnet', () => {
    it('should not be local', () => {
      expect(DEFAULT_NETWORKS.mainnet.isLocal).toBe(false);
    });

    it('should use production URLs', () => {
      expect(DEFAULT_NETWORKS.mainnet.nodeUrl).toBe('https://rpc.midnight.network');
      expect(DEFAULT_NETWORKS.mainnet.indexerUrl).toContain('indexer.midnight.network');
    });
  });

  it('all networks should have required fields', () => {
    for (const [name, network] of Object.entries(DEFAULT_NETWORKS)) {
      expect(network.name).toBe(name);
      expect(network.nodeUrl).toBeDefined();
      expect(network.indexerUrl).toBeDefined();
      expect(network.proofServerUrl).toBeDefined();
      expect(typeof network.isLocal).toBe('boolean');
    }
  });
});

describe('DEFAULT_PATHS', () => {
  it('should have expected paths', () => {
    expect(DEFAULT_PATHS.artifacts).toBe('./artifacts');
    expect(DEFAULT_PATHS.sources).toBe('./contracts');
    expect(DEFAULT_PATHS.deploy).toBe('./deploy');
  });
});

describe('createDefaultConfig', () => {
  it('should return a config object', () => {
    const config = createDefaultConfig();
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should default to localnet', () => {
    const config = createDefaultConfig();
    expect(config.defaultNetwork).toBe('localnet');
  });

  it('should include all networks', () => {
    const config = createDefaultConfig();
    expect(config.networks).toHaveProperty('localnet');
    expect(config.networks).toHaveProperty('devnet');
    expect(config.networks).toHaveProperty('preview');
    expect(config.networks).toHaveProperty('preprod');
    expect(config.networks).toHaveProperty('mainnet');
  });

  it('should enable docker by default', () => {
    const config = createDefaultConfig();
    expect(config.docker?.enabled).toBe(true);
  });

  it('should include default paths', () => {
    const config = createDefaultConfig();
    expect(config.paths?.artifacts).toBe('./artifacts');
    expect(config.paths?.sources).toBe('./contracts');
    expect(config.paths?.deploy).toBe('./deploy');
  });

  it('should return new object each time (not shared reference)', () => {
    const config1 = createDefaultConfig();
    const config2 = createDefaultConfig();

    expect(config1).not.toBe(config2);
    expect(config1.networks).not.toBe(config2.networks);
    expect(config1.paths).not.toBe(config2.paths);
  });
});
