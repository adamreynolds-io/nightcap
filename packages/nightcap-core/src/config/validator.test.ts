/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { validateConfig, ConfigValidationError } from './validator.js';

describe('validateConfig', () => {
  describe('root validation', () => {
    it('should accept empty object', () => {
      const result = validateConfig({});
      expect(result).toEqual({});
    });

    it('should reject null', () => {
      expect(() => validateConfig(null)).toThrow(ConfigValidationError);
    });

    it('should reject non-object', () => {
      expect(() => validateConfig('string')).toThrow(ConfigValidationError);
      expect(() => validateConfig(123)).toThrow(ConfigValidationError);
    });
  });

  describe('defaultNetwork', () => {
    it('should accept valid string', () => {
      const result = validateConfig({ defaultNetwork: 'localnet' });
      expect(result.defaultNetwork).toBe('localnet');
    });

    it('should reject non-string', () => {
      expect(() => validateConfig({ defaultNetwork: 123 })).toThrow(
        ConfigValidationError
      );
    });

    it('should validate defaultNetwork exists in networks', () => {
      expect(() =>
        validateConfig({
          defaultNetwork: 'nonexistent',
          networks: { localnet: { name: 'localnet' } },
        })
      ).toThrow(/nonexistent.*is not defined in networks/);
    });
  });

  describe('networks', () => {
    it('should accept valid network config', () => {
      const result = validateConfig({
        networks: {
          localnet: {
            name: 'localnet',
            nodeUrl: 'http://localhost:8080',
            isLocal: true,
          },
        },
      });

      expect(result.networks?.localnet).toEqual({
        name: 'localnet',
        nodeUrl: 'http://localhost:8080',
        isLocal: true,
        indexerUrl: undefined,
        proofServerUrl: undefined,
      });
    });

    it('should reject non-object networks', () => {
      expect(() => validateConfig({ networks: 'invalid' })).toThrow(
        ConfigValidationError
      );
    });

    it('should reject invalid URL', () => {
      expect(() =>
        validateConfig({
          networks: {
            test: { nodeUrl: 'not-a-url' },
          },
        })
      ).toThrow(/nodeUrl must be a valid URL/);
    });

    it('should reject non-boolean isLocal', () => {
      expect(() =>
        validateConfig({
          networks: {
            test: { isLocal: 'yes' },
          },
        })
      ).toThrow(/isLocal must be a boolean/);
    });

    it('should use key as name if name not provided', () => {
      const result = validateConfig({
        networks: {
          mynet: { nodeUrl: 'http://localhost:8080' },
        },
      });

      expect(result.networks?.mynet?.name).toBe('mynet');
    });
  });

  describe('docker', () => {
    it('should accept valid docker config', () => {
      const result = validateConfig({
        docker: {
          enabled: true,
          composePath: './docker-compose.yml',
          images: {
            node: 'midnight/node:latest',
          },
        },
      });

      expect(result.docker?.enabled).toBe(true);
      expect(result.docker?.images?.node).toBe('midnight/node:latest');
    });

    it('should reject non-object docker', () => {
      expect(() => validateConfig({ docker: 'invalid' })).toThrow(
        ConfigValidationError
      );
    });

    it('should reject non-object images', () => {
      expect(() =>
        validateConfig({
          docker: { images: 'invalid' },
        })
      ).toThrow(/docker.images must be an object/);
    });
  });

  describe('paths', () => {
    it('should accept valid paths', () => {
      const result = validateConfig({
        paths: {
          sources: './contracts',
          artifacts: './artifacts',
          deploy: './deploy',
        },
      });

      expect(result.paths?.sources).toBe('./contracts');
      expect(result.paths?.artifacts).toBe('./artifacts');
      expect(result.paths?.deploy).toBe('./deploy');
    });

    it('should reject non-object paths', () => {
      expect(() => validateConfig({ paths: 'invalid' })).toThrow(
        ConfigValidationError
      );
    });
  });
});

describe('ConfigValidationError', () => {
  it('should include path and value', () => {
    const error = new ConfigValidationError('test message', 'test.path', 123);

    expect(error.message).toBe('test message');
    expect(error.path).toBe('test.path');
    expect(error.value).toBe(123);
    expect(error.name).toBe('ConfigValidationError');
  });
});
