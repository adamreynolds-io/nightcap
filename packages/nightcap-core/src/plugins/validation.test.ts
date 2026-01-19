/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { validatePlugin, PluginValidationError } from './validation.js';
import type { NightcapPlugin } from './types.js';

describe('validatePlugin', () => {
  describe('basic validation', () => {
    it('should throw for null', () => {
      expect(() => validatePlugin(null)).toThrow(PluginValidationError);
    });

    it('should throw for undefined', () => {
      expect(() => validatePlugin(undefined)).toThrow(PluginValidationError);
    });

    it('should throw for non-object', () => {
      expect(() => validatePlugin('string')).toThrow(PluginValidationError);
      expect(() => validatePlugin(123)).toThrow(PluginValidationError);
    });
  });

  describe('id validation', () => {
    it('should throw when id is missing', () => {
      expect(() => validatePlugin({})).toThrow('must have a non-empty string "id"');
    });

    it('should throw when id is not a string', () => {
      expect(() => validatePlugin({ id: 123 })).toThrow('must have a non-empty string "id"');
    });

    it('should throw when id is empty', () => {
      expect(() => validatePlugin({ id: '' })).toThrow('must have a non-empty string "id"');
      expect(() => validatePlugin({ id: '   ' })).toThrow('must have a non-empty string "id"');
    });

    it('should accept valid id', () => {
      expect(() => validatePlugin({ id: 'valid-plugin' })).not.toThrow();
    });
  });

  describe('npmPackage validation', () => {
    it('should accept undefined npmPackage', () => {
      expect(() => validatePlugin({ id: 'test' })).not.toThrow();
    });

    it('should throw when npmPackage is not a string', () => {
      expect(() => validatePlugin({ id: 'test', npmPackage: 123 })).toThrow(
        '"npmPackage" must be a string'
      );
    });

    it('should accept valid npmPackage', () => {
      expect(() =>
        validatePlugin({ id: 'test', npmPackage: '@scope/package' })
      ).not.toThrow();
    });
  });

  describe('dependencies validation', () => {
    it('should accept undefined dependencies', () => {
      expect(() => validatePlugin({ id: 'test' })).not.toThrow();
    });

    it('should throw when dependencies is not an array', () => {
      expect(() => validatePlugin({ id: 'test', dependencies: 'not-array' })).toThrow(
        '"dependencies" must be an array'
      );
    });

    it('should throw when dependency is not a function', () => {
      expect(() => validatePlugin({ id: 'test', dependencies: ['not-function'] })).toThrow(
        'dependencies[0] must be a function'
      );
    });

    it('should accept valid dependencies', () => {
      const validDep = async () => ({ default: { id: 'dep' } as NightcapPlugin });
      expect(() => validatePlugin({ id: 'test', dependencies: [validDep] })).not.toThrow();
    });
  });

  describe('hookHandlers validation', () => {
    it('should accept undefined hookHandlers', () => {
      expect(() => validatePlugin({ id: 'test' })).not.toThrow();
    });

    it('should throw when hookHandlers is not an object', () => {
      expect(() => validatePlugin({ id: 'test', hookHandlers: 'not-object' })).toThrow(
        '"hookHandlers" must be an object'
      );
    });

    describe('config hooks', () => {
      it('should throw when config is not an object', () => {
        expect(() =>
          validatePlugin({ id: 'test', hookHandlers: { config: 'not-object' } })
        ).toThrow('"hookHandlers.config" must be an object');
      });

      it('should throw when extendUserConfig is not a function', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: { config: { extendUserConfig: 'not-function' } },
          })
        ).toThrow('"hookHandlers.config.extendUserConfig" must be a function');
      });

      it('should throw when validateUserConfig is not a function', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: { config: { validateUserConfig: 123 } },
          })
        ).toThrow('"hookHandlers.config.validateUserConfig" must be a function');
      });

      it('should throw when resolveUserConfig is not a function', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: { config: { resolveUserConfig: {} } },
          })
        ).toThrow('"hookHandlers.config.resolveUserConfig" must be a function');
      });

      it('should accept valid config hooks', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: {
              config: {
                extendUserConfig: (c) => c,
                validateUserConfig: () => [],
                resolveUserConfig: async (u, r, n) => n(u),
              },
            },
          })
        ).not.toThrow();
      });
    });

    describe('runtime hooks', () => {
      it('should throw when runtime is not an object', () => {
        expect(() =>
          validatePlugin({ id: 'test', hookHandlers: { runtime: 'not-object' } })
        ).toThrow('"hookHandlers.runtime" must be an object');
      });

      it('should throw when created is not a function', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: { runtime: { created: 'not-function' } },
          })
        ).toThrow('"hookHandlers.runtime.created" must be a function');
      });

      it('should accept valid runtime hooks', () => {
        expect(() =>
          validatePlugin({
            id: 'test',
            hookHandlers: {
              runtime: {
                created: async () => {},
              },
            },
          })
        ).not.toThrow();
      });
    });
  });

  describe('tasks validation', () => {
    it('should accept undefined tasks', () => {
      expect(() => validatePlugin({ id: 'test' })).not.toThrow();
    });

    it('should throw when tasks is not an array', () => {
      expect(() => validatePlugin({ id: 'test', tasks: 'not-array' })).toThrow(
        '"tasks" must be an array'
      );
    });

    it('should throw when task is not an object', () => {
      expect(() => validatePlugin({ id: 'test', tasks: ['not-object'] })).toThrow(
        'tasks[0] must be an object'
      );
    });

    it('should throw when task.name is missing', () => {
      expect(() => validatePlugin({ id: 'test', tasks: [{}] })).toThrow(
        'tasks[0] must have a non-empty string "name"'
      );
    });

    it('should throw when task.description is missing', () => {
      expect(() => validatePlugin({ id: 'test', tasks: [{ name: 'task' }] })).toThrow(
        'tasks[0] must have a string "description"'
      );
    });

    it('should throw when task.action is missing', () => {
      expect(() =>
        validatePlugin({ id: 'test', tasks: [{ name: 'task', description: 'desc' }] })
      ).toThrow('tasks[0] must have a function "action"');
    });

    it('should accept valid tasks', () => {
      expect(() =>
        validatePlugin({
          id: 'test',
          tasks: [
            {
              name: 'task',
              description: 'A task',
              action: async () => {},
            },
          ],
        })
      ).not.toThrow();
    });
  });

  describe('complete plugin', () => {
    it('should validate a complete plugin', () => {
      const plugin: NightcapPlugin = {
        id: 'complete-plugin',
        npmPackage: 'complete-plugin-npm',
        dependencies: [async () => ({ default: { id: 'dep' } as NightcapPlugin })],
        hookHandlers: {
          config: {
            extendUserConfig: (c) => c,
            validateUserConfig: () => [],
          },
          runtime: {
            created: async () => {},
          },
        },
        tasks: [
          {
            name: 'my-task',
            description: 'My task',
            action: async () => {},
          },
        ],
      };

      expect(() => validatePlugin(plugin)).not.toThrow();
    });
  });
});
