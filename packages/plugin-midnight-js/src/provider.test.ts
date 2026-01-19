/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import { createMidnightProvider, listAvailableContracts, clearArtifactsCache } from './provider.js';

// Mock fs module
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

describe('provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearArtifactsCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMidnightProvider', () => {
    it('should create provider with all sub-providers', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'localnet' },
        networkName: 'localnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      expect(provider).toBeDefined();
      expect(provider.indexer).toBeDefined();
      expect(provider.proofServer).toBeDefined();
      expect(provider.privateState).toBeDefined();
      expect(provider.zkConfig).toBeDefined();
      expect(provider.getContractFactory).toBeInstanceOf(Function);
      expect(provider.getContractAt).toBeInstanceOf(Function);
    });

    it('should set correct network ID for localnet', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'localnet' },
        networkName: 'localnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      expect(provider.networkId).toBe('undeployed');
    });

    it('should set correct network ID for devnet', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'devnet' },
        networkName: 'devnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      expect(provider.networkId).toBe('devnet');
    });

    it('should set correct network ID for testnet', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'testnet' },
        networkName: 'testnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      expect(provider.networkId).toBe('testnet');
    });

    it('should set correct network ID for mainnet', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'mainnet' },
        networkName: 'mainnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      expect(provider.networkId).toBe('mainnet');
    });
  });

  describe('listAvailableContracts', () => {
    it('should return empty array when artifacts dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const contracts = listAvailableContracts('/test/artifacts');

      expect(contracts).toEqual([]);
    });

    it('should list contracts with index.cjs files', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === '/test/artifacts') return true;
        if (pathStr.includes('Counter/contract/index.cjs')) return true;
        if (pathStr.includes('Token/contract/index.cjs')) return true;
        return false;
      });

      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'Counter', isDirectory: () => true },
        { name: 'Token', isDirectory: () => true },
        { name: '.cache', isDirectory: () => false },
      ] as unknown as ReturnType<typeof fs.readdirSync>);

      const contracts = listAvailableContracts('/test/artifacts');

      expect(contracts).toContain('Counter');
      expect(contracts).toContain('Token');
      expect(contracts).not.toContain('.cache');
    });
  });

  describe('getContractFactory', () => {
    it('should throw error for non-existent contract', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const provider = await createMidnightProvider({
        network: { name: 'localnet' },
        networkName: 'localnet',
        config: {},
        artifactsDir: '/test/artifacts',
      });

      await expect(provider.getContractFactory('NonExistent')).rejects.toThrow(
        'Contract artifact not found'
      );
    });
  });
});
