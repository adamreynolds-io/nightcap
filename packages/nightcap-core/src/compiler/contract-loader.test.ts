/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isCompiledContract,
  toPascalCase,
  toCamelCase,
} from './contract-loader.js';

// Mock fs
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('contract-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isCompiledContract', () => {
    it('should return true if contract/index.cjs exists', async () => {
      const { existsSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('contract/index.cjs')) {
          return true;
        }
        return false;
      });

      const result = isCompiledContract('/path/to/Contract');
      expect(result).toBe(true);
    });

    it('should return true if contract/index.js exists', async () => {
      const { existsSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('contract/index.js')) {
          return true;
        }
        return false;
      });

      const result = isCompiledContract('/path/to/Contract');
      expect(result).toBe(true);
    });

    it('should return true if index.cjs exists at root', async () => {
      const { existsSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.endsWith('index.cjs') && !path.includes('contract/')) {
          return true;
        }
        return false;
      });

      const result = isCompiledContract('/path/to/Contract');
      expect(result).toBe(true);
    });

    it('should return false if no contract module exists', async () => {
      const { existsSync } = await import('node:fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const result = isCompiledContract('/path/to/Contract');
      expect(result).toBe(false);
    });
  });

  describe('toPascalCase', () => {
    it('should convert simple string to PascalCase', () => {
      expect(toPascalCase('counter')).toBe('Counter');
    });

    it('should convert hyphenated string to PascalCase', () => {
      expect(toPascalCase('my-counter')).toBe('MyCounter');
    });

    it('should convert underscored string to PascalCase', () => {
      expect(toPascalCase('my_counter')).toBe('MyCounter');
    });

    it('should handle already PascalCase string', () => {
      expect(toPascalCase('MyCounter')).toBe('MyCounter');
    });

    it('should handle mixed case with hyphens', () => {
      expect(toPascalCase('my-Contract-Name')).toBe('MyContractName');
    });
  });

  describe('toCamelCase', () => {
    it('should convert simple string to camelCase', () => {
      expect(toCamelCase('Counter')).toBe('counter');
    });

    it('should convert hyphenated string to camelCase', () => {
      expect(toCamelCase('my-counter')).toBe('myCounter');
    });

    it('should convert underscored string to camelCase', () => {
      expect(toCamelCase('my_counter')).toBe('myCounter');
    });

    it('should handle already camelCase string', () => {
      expect(toCamelCase('myCounter')).toBe('myCounter');
    });

    it('should convert PascalCase to camelCase', () => {
      expect(toCamelCase('MyCounter')).toBe('myCounter');
    });
  });
});

describe('loadCompiledContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error if path does not exist', async () => {
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockReturnValue(false);

    const { loadCompiledContract } = await import('./contract-loader.js');

    await expect(loadCompiledContract('/nonexistent/path')).rejects.toThrow(
      'No valid contract module found'
    );
  });

  it('should throw error if no valid contract module found', async () => {
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockImplementation((path: unknown) => {
      // Directory exists but no module files
      if (typeof path === 'string' && !path.includes('index')) {
        return true;
      }
      return false;
    });

    const { loadCompiledContract } = await import('./contract-loader.js');

    await expect(loadCompiledContract('/path/to/Contract')).rejects.toThrow(
      'No valid contract module found'
    );
  });
});
