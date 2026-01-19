/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { HookManager, ConfigValidationError } from './hook-manager.js';
import type {
  NightcapPlugin,
  NightcapUserConfig,
  NightcapContext,
  NightcapRuntimeEnvironment,
} from './types.js';

function createPlugin(
  id: string,
  handlers?: NightcapPlugin['hookHandlers']
): NightcapPlugin {
  return {
    id,
    hookHandlers: handlers,
  };
}

describe('HookManager', () => {
  describe('registerPlugin', () => {
    it('should register config handlers', () => {
      const manager = new HookManager();
      const plugin = createPlugin('test', {
        config: {
          extendUserConfig: (c) => c,
        },
      });

      manager.registerPlugin(plugin);
      expect(manager.configHandlerCount).toBe(1);
    });

    it('should register runtime handlers', () => {
      const manager = new HookManager();
      const plugin = createPlugin('test', {
        runtime: {
          created: async () => {},
        },
      });

      manager.registerPlugin(plugin);
      expect(manager.runtimeHandlerCount).toBe(1);
    });

    it('should register both handler types', () => {
      const manager = new HookManager();
      const plugin = createPlugin('test', {
        config: { extendUserConfig: (c) => c },
        runtime: { created: async () => {} },
      });

      manager.registerPlugin(plugin);
      expect(manager.configHandlerCount).toBe(1);
      expect(manager.runtimeHandlerCount).toBe(1);
    });

    it('should not register plugin without handlers', () => {
      const manager = new HookManager();
      const plugin = createPlugin('test');

      manager.registerPlugin(plugin);
      expect(manager.configHandlerCount).toBe(0);
      expect(manager.runtimeHandlerCount).toBe(0);
    });
  });

  describe('runConfigHooks', () => {
    describe('extendUserConfig', () => {
      it('should call extendUserConfig for each plugin', async () => {
        const manager = new HookManager();
        const extend1 = vi.fn((c: NightcapUserConfig) => ({
          ...c,
          extended1: true,
        }));
        const extend2 = vi.fn((c: NightcapUserConfig) => ({
          ...c,
          extended2: true,
        }));

        manager.registerPlugin(
          createPlugin('p1', { config: { extendUserConfig: extend1 } })
        );
        manager.registerPlugin(
          createPlugin('p2', { config: { extendUserConfig: extend2 } })
        );

        const result = await manager.runConfigHooks({}, []);

        expect(extend1).toHaveBeenCalled();
        expect(extend2).toHaveBeenCalled();
      });

      it('should pass config through chain', async () => {
        const manager = new HookManager();

        manager.registerPlugin(
          createPlugin('p1', {
            config: {
              extendUserConfig: (c) => ({ ...c, step1: true } as NightcapUserConfig),
            },
          })
        );
        manager.registerPlugin(
          createPlugin('p2', {
            config: {
              extendUserConfig: (c) => ({ ...c, step2: true } as NightcapUserConfig),
            },
          })
        );

        const result = await manager.runConfigHooks({}, []);

        expect((result as Record<string, unknown>).step1).toBe(true);
        expect((result as Record<string, unknown>).step2).toBe(true);
      });
    });

    describe('validateUserConfig', () => {
      it('should collect errors from all plugins', async () => {
        const manager = new HookManager();

        manager.registerPlugin(
          createPlugin('p1', {
            config: { validateUserConfig: () => ['Error from p1'] },
          })
        );
        manager.registerPlugin(
          createPlugin('p2', {
            config: { validateUserConfig: () => ['Error from p2'] },
          })
        );

        await expect(manager.runConfigHooks({}, [])).rejects.toThrow(
          ConfigValidationError
        );
      });

      it('should include plugin id in error messages', async () => {
        const manager = new HookManager();

        manager.registerPlugin(
          createPlugin('my-plugin', {
            config: { validateUserConfig: () => ['Something is wrong'] },
          })
        );

        try {
          await manager.runConfigHooks({}, []);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigValidationError);
          const valError = error as ConfigValidationError;
          expect(valError.errors[0]).toContain('my-plugin');
        }
      });

      it('should pass if no validation errors', async () => {
        const manager = new HookManager();

        manager.registerPlugin(
          createPlugin('p1', {
            config: { validateUserConfig: () => [] },
          })
        );

        await expect(manager.runConfigHooks({}, [])).resolves.toBeDefined();
      });
    });

    describe('resolveUserConfig', () => {
      it('should create resolved config with plugins array', async () => {
        const manager = new HookManager();
        const plugins = [createPlugin('p1'), createPlugin('p2')];

        const result = await manager.runConfigHooks({}, plugins);

        expect(result.plugins).toEqual(plugins);
      });

      it('should strip plugins from user config', async () => {
        const manager = new HookManager();
        const userPlugins = [createPlugin('user-plugin')];
        const resolvedPlugins = [createPlugin('resolved-plugin')];

        const result = await manager.runConfigHooks(
          { plugins: userPlugins },
          resolvedPlugins
        );

        expect(result.plugins).toEqual(resolvedPlugins);
        expect(result.plugins).not.toContain(userPlugins[0]);
      });

      it('should call resolveUserConfig handlers in chain', async () => {
        const manager = new HookManager();
        const calls: string[] = [];

        manager.registerPlugin(
          createPlugin('p1', {
            config: {
              resolveUserConfig: async (user, resolved, next) => {
                calls.push('p1-start');
                const result = await next(user);
                calls.push('p1-end');
                return result;
              },
            },
          })
        );
        manager.registerPlugin(
          createPlugin('p2', {
            config: {
              resolveUserConfig: async (user, resolved, next) => {
                calls.push('p2-start');
                const result = await next(user);
                calls.push('p2-end');
                return result;
              },
            },
          })
        );

        await manager.runConfigHooks({}, []);

        // Middleware chain: first registered starts first, ends last
        expect(calls).toEqual(['p1-start', 'p2-start', 'p2-end', 'p1-end']);
      });

      it('should allow modifying resolved config', async () => {
        const manager = new HookManager();

        manager.registerPlugin(
          createPlugin('p1', {
            config: {
              resolveUserConfig: async (user, resolved, next) => {
                const result = await next(user);
                return {
                  ...result,
                  defaultNetwork: 'testnet',
                };
              },
            },
          })
        );

        const result = await manager.runConfigHooks({}, []);

        expect(result.defaultNetwork).toBe('testnet');
      });
    });
  });

  describe('runExtendEnvironmentHooks', () => {
    it('should call extendEnvironment hook for each plugin', async () => {
      const manager = new HookManager();
      const extend1 = vi.fn();
      const extend2 = vi.fn();

      manager.registerPlugin(
        createPlugin('p1', { runtime: { extendEnvironment: extend1 } })
      );
      manager.registerPlugin(
        createPlugin('p2', { runtime: { extendEnvironment: extend2 } })
      );

      const env: NightcapRuntimeEnvironment = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runExtendEnvironmentHooks(env);

      expect(extend1).toHaveBeenCalledWith(env);
      expect(extend2).toHaveBeenCalledWith(env);
    });

    it('should call hooks in plugin order', async () => {
      const manager = new HookManager();
      const calls: string[] = [];

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            extendEnvironment: () => {
              calls.push('p1');
            },
          },
        })
      );
      manager.registerPlugin(
        createPlugin('p2', {
          runtime: {
            extendEnvironment: () => {
              calls.push('p2');
            },
          },
        })
      );

      const env: NightcapRuntimeEnvironment = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runExtendEnvironmentHooks(env);

      expect(calls).toEqual(['p1', 'p2']);
    });

    it('should allow plugins to add properties to env', async () => {
      const manager = new HookManager();

      manager.registerPlugin(
        createPlugin('my-plugin', {
          runtime: {
            extendEnvironment: (env) => {
              (env as NightcapRuntimeEnvironment & { myPlugin: { foo: string } }).myPlugin = {
                foo: 'bar',
              };
            },
          },
        })
      );

      const env: NightcapRuntimeEnvironment = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runExtendEnvironmentHooks(env);

      expect((env as NightcapRuntimeEnvironment & { myPlugin: { foo: string } }).myPlugin).toEqual({
        foo: 'bar',
      });
    });

    it('should handle async extendEnvironment hooks', async () => {
      const manager = new HookManager();
      let completed = false;

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            extendEnvironment: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              completed = true;
            },
          },
        })
      );

      const env: NightcapRuntimeEnvironment = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runExtendEnvironmentHooks(env);

      expect(completed).toBe(true);
    });

    it('should propagate hook errors', async () => {
      const manager = new HookManager();

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            extendEnvironment: () => {
              throw new Error('Extension failed');
            },
          },
        })
      );

      const env: NightcapRuntimeEnvironment = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await expect(manager.runExtendEnvironmentHooks(env)).rejects.toThrow(
        'Extension failed'
      );
    });
  });

  describe('runRuntimeCreatedHooks', () => {
    it('should call created hook for each plugin', async () => {
      const manager = new HookManager();
      const created1 = vi.fn();
      const created2 = vi.fn();

      manager.registerPlugin(
        createPlugin('p1', { runtime: { created: created1 } })
      );
      manager.registerPlugin(
        createPlugin('p2', { runtime: { created: created2 } })
      );

      const ctx: NightcapContext = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runRuntimeCreatedHooks(ctx);

      expect(created1).toHaveBeenCalledWith(ctx);
      expect(created2).toHaveBeenCalledWith(ctx);
    });

    it('should call hooks in order', async () => {
      const manager = new HookManager();
      const calls: string[] = [];

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            created: async () => {
              calls.push('p1');
            },
          },
        })
      );
      manager.registerPlugin(
        createPlugin('p2', {
          runtime: {
            created: async () => {
              calls.push('p2');
            },
          },
        })
      );

      const ctx: NightcapContext = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runRuntimeCreatedHooks(ctx);

      expect(calls).toEqual(['p1', 'p2']);
    });

    it('should handle async hooks', async () => {
      const manager = new HookManager();
      let completed = false;

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            created: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              completed = true;
            },
          },
        })
      );

      const ctx: NightcapContext = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await manager.runRuntimeCreatedHooks(ctx);

      expect(completed).toBe(true);
    });

    it('should propagate hook errors', async () => {
      const manager = new HookManager();

      manager.registerPlugin(
        createPlugin('p1', {
          runtime: {
            created: async () => {
              throw new Error('Hook failed');
            },
          },
        })
      );

      const ctx: NightcapContext = {
        config: { plugins: [] },
        runTask: async () => {},
      };

      await expect(manager.runRuntimeCreatedHooks(ctx)).rejects.toThrow(
        'Hook failed'
      );
    });
  });

  describe('handler counts', () => {
    it('should track config handler count', () => {
      const manager = new HookManager();

      expect(manager.configHandlerCount).toBe(0);

      manager.registerPlugin(
        createPlugin('p1', { config: { extendUserConfig: (c) => c } })
      );
      expect(manager.configHandlerCount).toBe(1);

      manager.registerPlugin(
        createPlugin('p2', { config: { validateUserConfig: () => [] } })
      );
      expect(manager.configHandlerCount).toBe(2);
    });

    it('should track runtime handler count', () => {
      const manager = new HookManager();

      expect(manager.runtimeHandlerCount).toBe(0);

      manager.registerPlugin(
        createPlugin('p1', { runtime: { created: async () => {} } })
      );
      expect(manager.runtimeHandlerCount).toBe(1);

      manager.registerPlugin(
        createPlugin('p2', { runtime: { created: async () => {} } })
      );
      expect(manager.runtimeHandlerCount).toBe(2);
    });
  });
});
