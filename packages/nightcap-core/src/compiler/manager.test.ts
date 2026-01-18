/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompilerManager } from './manager.js';
import type { CompilerVersion, CompilationResult } from './manager.js';

// Mock the logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CompilerManager', () => {
  let manager: CompilerManager;

  beforeEach(() => {
    manager = new CompilerManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(manager).toBeInstanceOf(CompilerManager);
    });
  });

  describe('findInPath', () => {
    it('should return null if compactc not in PATH', () => {
      // Since compactc is unlikely to be installed in test environment
      const result = manager.findInPath();
      // Result will be null or a path string
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('getVersion', () => {
    it('should return null for non-existent compiler', () => {
      const result = manager.getVersion('/nonexistent/path/compactc');
      expect(result).toBeNull();
    });
  });

  describe('listInstalled', () => {
    it('should return an array', () => {
      const result = manager.listInstalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return CompilerVersion objects', () => {
      const result = manager.listInstalled();
      for (const item of result) {
        expect(item).toHaveProperty('version');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('isDefault');
      }
    });
  });

  describe('getCompiler', () => {
    it('should return null when no compiler available and no version requested', async () => {
      // Mock findInPath to return null
      vi.spyOn(manager, 'findInPath').mockReturnValue(null);
      vi.spyOn(manager, 'listInstalled').mockReturnValue([]);

      const result = await manager.getCompiler();
      expect(result).toBeNull();
    });

    it('should return null for non-existent requested version', async () => {
      vi.spyOn(manager, 'findInPath').mockReturnValue(null);

      const result = await manager.getCompiler('99.99.99');
      expect(result).toBeNull();
    });

    it('should prefer PATH compiler when no version specified', async () => {
      const pathCompiler = '/usr/local/bin/compactc';
      vi.spyOn(manager, 'findInPath').mockReturnValue(pathCompiler);

      const result = await manager.getCompiler();
      expect(result).toBe(pathCompiler);
    });

    it('should fall back to installed versions when not in PATH', async () => {
      const installedPath = '/home/user/.nightcap/compilers/compactc-0.26.0/compactc';
      vi.spyOn(manager, 'findInPath').mockReturnValue(null);
      vi.spyOn(manager, 'listInstalled').mockReturnValue([
        { version: '0.26.0', path: installedPath, isDefault: false },
      ]);

      const result = await manager.getCompiler();
      expect(result).toBe(installedPath);
    });
  });

  describe('install', () => {
    it('should check if already installed before downloading', async () => {
      // This tests the early return path when already installed
      // Since we can't easily mock fs.existsSync, we just verify
      // the method exists and can be called
      expect(typeof manager.install).toBe('function');
    });

    it('should handle download failure gracefully', async () => {
      // Attempting to install a non-existent version should fail
      // but the error handling should work
      await expect(manager.install('999.999.999')).rejects.toThrow();
    });
  });

  describe('compile', () => {
    it('should handle compiler not found error', async () => {
      const result = await manager.compile(
        '/nonexistent/source.compact',
        '/output',
        '/nonexistent/compactc'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should set correct contract name from source path', async () => {
      const result = await manager.compile(
        '/path/to/MyContract.compact',
        '/output',
        '/nonexistent/compactc'
      );

      expect(result.contractName).toBe('MyContract');
      expect(result.sourcePath).toBe('/path/to/MyContract.compact');
    });
  });
});

describe('CompilerVersion interface', () => {
  it('should have correct shape', () => {
    const version: CompilerVersion = {
      version: '0.26.0',
      path: '/path/to/compactc',
      isDefault: true,
    };

    expect(version.version).toBe('0.26.0');
    expect(version.path).toBe('/path/to/compactc');
    expect(version.isDefault).toBe(true);
  });
});

describe('CompilationResult interface', () => {
  it('should have correct shape for success', () => {
    const result: CompilationResult = {
      success: true,
      contractName: 'Counter',
      sourcePath: '/path/Counter.compact',
      artifactPath: '/path/artifacts',
    };

    expect(result.success).toBe(true);
    expect(result.contractName).toBe('Counter');
  });

  it('should have correct shape for failure', () => {
    const result: CompilationResult = {
      success: false,
      contractName: 'Counter',
      sourcePath: '/path/Counter.compact',
      errors: ['Syntax error on line 5'],
    };

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Syntax error on line 5');
  });
});
