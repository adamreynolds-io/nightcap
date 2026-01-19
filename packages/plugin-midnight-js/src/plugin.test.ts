/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { midnightJsPlugin, getMidnightProvider, clearProviderCache } from './plugin.js';

describe('midnightJsPlugin', () => {
  beforeEach(() => {
    clearProviderCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('plugin definition', () => {
    it('should have correct id', () => {
      expect(midnightJsPlugin.id).toBe('midnight-js');
    });

    it('should have npm package name', () => {
      expect(midnightJsPlugin.npmPackage).toBe('@nightcap/plugin-midnight-js');
    });

    it('should have hook handlers', () => {
      expect(midnightJsPlugin.hookHandlers).toBeDefined();
      expect(midnightJsPlugin.hookHandlers?.config).toBeDefined();
      expect(midnightJsPlugin.hookHandlers?.runtime).toBeDefined();
    });
  });

  describe('config hooks', () => {
    it('should extend config with midnightJs defaults', () => {
      const config = { defaultNetwork: 'localnet' };
      const extended = midnightJsPlugin.hookHandlers?.config?.extendUserConfig?.(config as never);

      expect(extended).toHaveProperty('midnightJs');
    });

    it('should preserve existing midnightJs config', () => {
      const config = {
        defaultNetwork: 'localnet',
        midnightJs: {
          indexerUrl: 'http://custom:8088',
        },
      };
      const extended = midnightJsPlugin.hookHandlers?.config?.extendUserConfig?.(config as never);

      expect((extended as { midnightJs: { indexerUrl: string } }).midnightJs.indexerUrl).toBe('http://custom:8088');
    });

    it('should validate valid config', () => {
      const config = {
        midnightJs: {
          indexerUrl: 'http://localhost:8088',
          proofServerUrl: 'http://localhost:6300',
        },
      };
      const errors = midnightJsPlugin.hookHandlers?.config?.validateUserConfig?.(config as never);

      expect(errors).toEqual([]);
    });

    it('should report invalid URLs', () => {
      const config = {
        midnightJs: {
          indexerUrl: 'not-a-url',
        },
      };
      const errors = midnightJsPlugin.hookHandlers?.config?.validateUserConfig?.(config as never);

      expect(errors).toHaveLength(1);
      expect(errors?.[0]).toContain('indexerUrl');
    });
  });

  describe('runtime hooks', () => {
    it('should have extendEnvironment hook', () => {
      expect(midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment).toBeDefined();
    });

    it('should add midnight namespace to environment', () => {
      const env = {
        config: {
          defaultNetwork: 'localnet',
          networks: {
            localnet: {
              name: 'localnet',
              nodeUrl: 'http://localhost:9944',
            },
          },
          paths: { artifacts: 'artifacts' },
        },
        runTask: vi.fn(),
      };

      midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment?.(env as never);

      expect(env).toHaveProperty('midnight');
      const midnight = (env as typeof env & { midnight: unknown }).midnight;
      expect(midnight).toBeDefined();
    });

    it('should provide getProvider method on midnight namespace', async () => {
      const env = {
        config: {
          defaultNetwork: 'localnet',
          networks: {
            localnet: {
              name: 'localnet',
              nodeUrl: 'http://localhost:9944',
            },
          },
          paths: { artifacts: 'artifacts' },
        },
        runTask: vi.fn(),
      };

      midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment?.(env as never);

      const midnight = (env as typeof env & { midnight: { getProvider: () => Promise<unknown> } }).midnight;
      expect(midnight.getProvider).toBeDefined();

      const provider = await midnight.getProvider();
      expect(provider).toBeDefined();
    });

    it('should provide getContractFactory method on midnight namespace', async () => {
      const env = {
        config: {
          defaultNetwork: 'localnet',
          networks: {
            localnet: {
              name: 'localnet',
              nodeUrl: 'http://localhost:9944',
            },
          },
          paths: { artifacts: 'artifacts' },
        },
        runTask: vi.fn(),
      };

      midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment?.(env as never);

      const midnight = (env as typeof env & { midnight: { getContractFactory: (name: string) => Promise<unknown> } }).midnight;
      expect(midnight.getContractFactory).toBeDefined();
    });

    it('should provide listContracts method on midnight namespace', async () => {
      const env = {
        config: {
          defaultNetwork: 'localnet',
          networks: {
            localnet: {
              name: 'localnet',
            },
          },
          paths: { artifacts: 'artifacts' },
        },
        runTask: vi.fn(),
      };

      midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment?.(env as never);

      const midnight = (env as typeof env & { midnight: { listContracts: () => Promise<string[]> } }).midnight;
      expect(midnight.listContracts).toBeDefined();

      const contracts = await midnight.listContracts();
      expect(Array.isArray(contracts)).toBe(true);
    });

    it('should provide clearCache method on midnight namespace', () => {
      const env = {
        config: {
          defaultNetwork: 'localnet',
          networks: {
            localnet: {
              name: 'localnet',
            },
          },
        },
        runTask: vi.fn(),
      };

      midnightJsPlugin.hookHandlers?.runtime?.extendEnvironment?.(env as never);

      const midnight = (env as typeof env & { midnight: { clearCache: () => void } }).midnight;
      expect(midnight.clearCache).toBeDefined();
      expect(() => midnight.clearCache()).not.toThrow();
    });
  });

  describe('getMidnightProvider', () => {
    it('should create a provider', async () => {
      const network = {
        name: 'localnet',
        indexerUrl: 'http://localhost:8088',
        proofServerUrl: 'http://localhost:6300',
      };
      const config = { paths: { artifacts: 'artifacts' } };

      const provider = await getMidnightProvider('localnet', network, config);

      expect(provider).toBeDefined();
      expect(provider.networkId).toBe('undeployed');
      expect(provider.indexer).toBeDefined();
      expect(provider.proofServer).toBeDefined();
      expect(provider.privateState).toBeDefined();
      expect(provider.zkConfig).toBeDefined();
    });

    it('should cache providers by network name', async () => {
      const network = { name: 'localnet' };
      const config = { paths: { artifacts: 'artifacts' } };

      const provider1 = await getMidnightProvider('localnet', network, config);
      const provider2 = await getMidnightProvider('localnet', network, config);

      expect(provider1).toBe(provider2);
    });

    it('should create different providers for different networks', async () => {
      const config = { paths: { artifacts: 'artifacts' } };

      const local = await getMidnightProvider('localnet', { name: 'localnet' }, config);
      const devnet = await getMidnightProvider('devnet', { name: 'devnet' }, config);

      expect(local).not.toBe(devnet);
      expect(local.networkId).toBe('undeployed');
      expect(devnet.networkId).toBe('devnet');
    });
  });
});
