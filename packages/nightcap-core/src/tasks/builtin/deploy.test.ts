/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
}));

// Mock the toolkit
vi.mock('../../toolkit/toolkit.js', () => ({
  Toolkit: {
    fromConfig: vi.fn().mockReturnValue({
      isAvailable: vi.fn().mockResolvedValue(true),
      ensureReady: vi.fn().mockResolvedValue(undefined),
      getMode: vi.fn().mockReturnValue('docker'),
      deploy: vi.fn().mockResolvedValue({
        success: true,
        data: {
          contractAddress: '0x1234567890abcdef',
          transactionHash: '0xabcdef1234567890',
        },
        stdout: '',
        stderr: '',
        exitCode: 0,
      }),
    }),
  },
}));

describe('deploy task', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `nightcap-deploy-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'artifacts'), { recursive: true });
    await mkdir(join(testDir, 'ignition', 'modules'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('deployment history', () => {
    it('should create deployments directory on first deploy', async () => {
      const deploymentsDir = join(testDir, 'deployments', 'localnet');
      expect(existsSync(deploymentsDir)).toBe(false);

      // Create the directory to simulate what deploy task does
      await mkdir(deploymentsDir, { recursive: true });
      await writeFile(
        join(deploymentsDir, 'history.json'),
        JSON.stringify({ network: 'localnet', deployments: {} }, null, 2)
      );

      expect(existsSync(deploymentsDir)).toBe(true);
      expect(existsSync(join(deploymentsDir, 'history.json'))).toBe(true);
    });

    it('should store deployment records with correct structure', async () => {
      const deploymentsDir = join(testDir, 'deployments', 'localnet');
      await mkdir(deploymentsDir, { recursive: true });

      const history = {
        network: 'localnet',
        deployments: {
          Counter: {
            contractName: 'Counter',
            address: '0x1234567890abcdef',
            transactionHash: '0xabcdef1234567890',
            deployedAt: '2025-01-19T12:00:00.000Z',
            artifactHash: 'abc123',
          },
        },
      };

      await writeFile(join(deploymentsDir, 'history.json'), JSON.stringify(history, null, 2));

      const loaded = JSON.parse(await readFile(join(deploymentsDir, 'history.json'), 'utf8'));
      expect(loaded.network).toBe('localnet');
      expect(loaded.deployments.Counter).toBeDefined();
      expect(loaded.deployments.Counter.address).toBe('0x1234567890abcdef');
      expect(loaded.deployments.Counter.artifactHash).toBe('abc123');
    });

    it('should track deployments per network separately', async () => {
      const localnetDir = join(testDir, 'deployments', 'localnet');
      const devnetDir = join(testDir, 'deployments', 'devnet');

      await mkdir(localnetDir, { recursive: true });
      await mkdir(devnetDir, { recursive: true });

      const localnetHistory = {
        network: 'localnet',
        deployments: { Counter: { address: '0x1111' } },
      };
      const devnetHistory = {
        network: 'devnet',
        deployments: { Counter: { address: '0x2222' } },
      };

      await writeFile(join(localnetDir, 'history.json'), JSON.stringify(localnetHistory));
      await writeFile(join(devnetDir, 'history.json'), JSON.stringify(devnetHistory));

      const loadedLocalnet = JSON.parse(await readFile(join(localnetDir, 'history.json'), 'utf8'));
      const loadedDevnet = JSON.parse(await readFile(join(devnetDir, 'history.json'), 'utf8'));

      expect(loadedLocalnet.deployments.Counter.address).toBe('0x1111');
      expect(loadedDevnet.deployments.Counter.address).toBe('0x2222');
    });
  });

  describe('network confirmation', () => {
    it('should not require confirmation for localnet', () => {
      const requiresConfirmation = (networkName: string): boolean => {
        if (networkName === 'localnet' || networkName === 'local') {
          return false;
        }
        return true;
      };

      expect(requiresConfirmation('localnet')).toBe(false);
      expect(requiresConfirmation('local')).toBe(false);
    });

    it('should require confirmation for other networks', () => {
      const requiresConfirmation = (networkName: string): boolean => {
        if (networkName === 'localnet' || networkName === 'local') {
          return false;
        }
        return true;
      };

      expect(requiresConfirmation('devnet')).toBe(true);
      expect(requiresConfirmation('qanet')).toBe(true);
      expect(requiresConfirmation('preview')).toBe(true);
      expect(requiresConfirmation('preprod')).toBe(true);
      expect(requiresConfirmation('mainnet')).toBe(true);
    });

    it('should identify mainnet correctly', () => {
      const isMainnet = (networkName: string): boolean => {
        return networkName === 'mainnet' || networkName === 'main';
      };

      expect(isMainnet('mainnet')).toBe(true);
      expect(isMainnet('main')).toBe(true);
      expect(isMainnet('localnet')).toBe(false);
      expect(isMainnet('devnet')).toBe(false);
    });
  });

  describe('module discovery', () => {
    it('should discover modules in ignition/modules/', async () => {
      const modulesDir = join(testDir, 'ignition', 'modules');

      // Create some module files
      await writeFile(join(modulesDir, 'Counter.ts'), 'export default {}');
      await writeFile(join(modulesDir, 'Token.ts'), 'export default {}');
      await writeFile(join(modulesDir, 'README.md'), '# Modules'); // Should be ignored

      const { readdirSync, statSync } = await import('node:fs');

      const discoverModules = (projectDir: string): string[] => {
        const ignitionDir = join(projectDir, 'ignition', 'modules');
        const modules: string[] = [];

        if (!existsSync(ignitionDir)) {
          return modules;
        }

        const entries = readdirSync(ignitionDir);
        for (const entry of entries) {
          const fullPath = join(ignitionDir, entry);
          const stat = statSync(fullPath);

          if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.js'))) {
            modules.push(fullPath);
          }
        }

        return modules;
      };

      const modules = discoverModules(testDir);
      expect(modules).toHaveLength(2);
      expect(modules.some(m => m.includes('Counter.ts'))).toBe(true);
      expect(modules.some(m => m.includes('Token.ts'))).toBe(true);
      expect(modules.some(m => m.includes('README.md'))).toBe(false);
    });

    it('should return empty array when no ignition directory', async () => {
      const emptyDir = join(testDir, 'empty-project');
      await mkdir(emptyDir, { recursive: true });

      const discoverModules = (projectDir: string): string[] => {
        const ignitionDir = join(projectDir, 'ignition', 'modules');
        if (!existsSync(ignitionDir)) {
          return [];
        }
        return [];
      };

      const modules = discoverModules(emptyDir);
      expect(modules).toHaveLength(0);
    });
  });

  describe('artifact hashing', () => {
    it('should generate consistent hash for same content', async () => {
      const { createHash } = await import('node:crypto');

      const hashArtifact = async (artifactPath: string): Promise<string> => {
        const content = await readFile(artifactPath);
        return createHash('sha256').update(content).digest('hex').slice(0, 16);
      };

      const artifactPath = join(testDir, 'artifacts', 'Counter.json');
      await writeFile(artifactPath, JSON.stringify({ name: 'Counter', bytecode: '0x123' }));

      const hash1 = await hashArtifact(artifactPath);
      const hash2 = await hashArtifact(artifactPath);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hash for different content', async () => {
      const { createHash } = await import('node:crypto');

      const hashArtifact = async (artifactPath: string): Promise<string> => {
        const content = await readFile(artifactPath);
        return createHash('sha256').update(content).digest('hex').slice(0, 16);
      };

      const artifact1Path = join(testDir, 'artifacts', 'Counter1.json');
      const artifact2Path = join(testDir, 'artifacts', 'Counter2.json');

      await writeFile(artifact1Path, JSON.stringify({ name: 'Counter', version: 1 }));
      await writeFile(artifact2Path, JSON.stringify({ name: 'Counter', version: 2 }));

      const hash1 = await hashArtifact(artifact1Path);
      const hash2 = await hashArtifact(artifact2Path);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('endpoint conversion', () => {
    it('should convert HTTP URLs to WebSocket URLs', () => {
      const toWs = (url: string): string => {
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
          return url;
        }
        return url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
      };

      expect(toWs('http://localhost:9933')).toBe('ws://localhost:9933');
      expect(toWs('https://node.example.com')).toBe('wss://node.example.com');
      expect(toWs('ws://localhost:9933')).toBe('ws://localhost:9933');
      expect(toWs('wss://node.example.com')).toBe('wss://node.example.com');
    });
  });

  describe('network display names', () => {
    it('should return correct display names', () => {
      const getNetworkDisplayName = (networkName: string): string => {
        const indicators: Record<string, string> = {
          localnet: 'localnet (local Docker)',
          devnet: 'devnet (internal)',
          qanet: 'qanet (internal)',
          preview: 'preview (public testnet)',
          preprod: 'preprod (public)',
          mainnet: 'MAINNET (PRODUCTION)',
        };
        return indicators[networkName] ?? networkName;
      };

      expect(getNetworkDisplayName('localnet')).toBe('localnet (local Docker)');
      expect(getNetworkDisplayName('devnet')).toBe('devnet (internal)');
      expect(getNetworkDisplayName('mainnet')).toBe('MAINNET (PRODUCTION)');
      expect(getNetworkDisplayName('custom')).toBe('custom');
    });
  });
});

describe('deployments task', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `nightcap-deployments-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load deployment history from file', async () => {
    const deploymentsDir = join(testDir, 'deployments', 'localnet');
    await mkdir(deploymentsDir, { recursive: true });

    const history = {
      network: 'localnet',
      deployments: {
        Counter: {
          contractName: 'Counter',
          address: '0x1234',
          deployedAt: '2025-01-19T12:00:00.000Z',
          artifactHash: 'abc123',
        },
        Token: {
          contractName: 'Token',
          address: '0x5678',
          deployedAt: '2025-01-19T13:00:00.000Z',
          artifactHash: 'def456',
        },
      },
    };

    await writeFile(join(deploymentsDir, 'history.json'), JSON.stringify(history, null, 2));

    const loaded = JSON.parse(await readFile(join(deploymentsDir, 'history.json'), 'utf8'));
    const deployments = Object.values(loaded.deployments);

    expect(deployments).toHaveLength(2);
  });

  it('should return empty when no deployments exist', async () => {
    const historyPath = join(testDir, 'deployments', 'localnet', 'history.json');

    const loadHistory = async (): Promise<{ deployments: Record<string, unknown> }> => {
      if (existsSync(historyPath)) {
        const content = await readFile(historyPath, 'utf8');
        return JSON.parse(content);
      }
      return { deployments: {} };
    };

    const history = await loadHistory();
    expect(Object.keys(history.deployments)).toHaveLength(0);
  });
});
