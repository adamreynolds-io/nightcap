# Plugin Development Guide

Nightcap's plugin architecture allows you to extend functionality with custom tasks, configuration hooks, and runtime integrations. This guide covers creating and using plugins.

## Plugin Architecture Overview

Nightcap plugins follow a pattern inspired by Hardhat 3:

- **Explicit registration** - Plugins are listed in the config file, no auto-discovery
- **Dependency management** - Plugins can depend on other plugins via dynamic imports
- **Hook system** - Plugins can hook into config resolution and runtime events
- **Task registration** - Plugins can add or override CLI tasks

## Plugin Interface

A Nightcap plugin implements the `NightcapPlugin` interface:

```typescript
interface NightcapPlugin {
  // Unique plugin identifier (required)
  id: string;

  // npm package name for error messages (optional)
  npmPackage?: string;

  // Plugin dependencies as dynamic imports (optional)
  dependencies?: (() => Promise<{ default: NightcapPlugin }>)[];

  // Hook handlers for config and runtime events (optional)
  hookHandlers?: Partial<NightcapHookHandlers>;

  // Tasks the plugin defines or overrides (optional)
  tasks?: TaskDefinition[];
}
```

## Creating a Basic Plugin

### Simple Plugin

Create a file `my-plugin.ts`:

```typescript
import type { NightcapPlugin } from '@nightcap/core';

const myPlugin: NightcapPlugin = {
  id: 'my-plugin',
};

export default myPlugin;
```

### Using the Plugin

In your `nightcap.config.ts`:

```typescript
import { defineConfig } from '@nightcap/core';
import myPlugin from './my-plugin';

export default defineConfig({
  plugins: [myPlugin],
});
```

## Adding Custom Tasks

Plugins can register new CLI commands:

```typescript
import type { NightcapPlugin, TaskDefinition } from '@nightcap/core';

const helloTask: TaskDefinition = {
  name: 'hello',
  description: 'Say hello',
  params: {
    name: {
      type: 'string',
      description: 'Name to greet',
      default: 'World',
    },
  },
  async action(context) {
    const name = context.params.name as string;
    console.log(`Hello, ${name}!`);
  },
};

const greetingPlugin: NightcapPlugin = {
  id: 'greeting-plugin',
  tasks: [helloTask],
};

export default greetingPlugin;
```

Now you can run:

```bash
nightcap hello --name Developer
# Output: Hello, Developer!
```

## Hook Handlers

Plugins can hook into various lifecycle events.

### Hook Handler Interface

```typescript
interface NightcapHookHandlers {
  config: ConfigHookHandlers;
  runtime: RuntimeHookHandlers;
}

interface ConfigHookHandlers {
  // Extend config before validation
  extendUserConfig?: (config: NightcapUserConfig) => NightcapUserConfig;

  // Validate config (return error messages)
  validateUserConfig?: (config: NightcapUserConfig) => string[];

  // Resolve config with middleware chain
  resolveUserConfig?: (
    userConfig: NightcapUserConfig,
    resolvedConfig: ResolvedNightcapConfig,
    next: (config: NightcapUserConfig) => Promise<ResolvedNightcapConfig>
  ) => Promise<ResolvedNightcapConfig>;
}

interface RuntimeHookHandlers {
  // Called after runtime is created
  created?: (ctx: NightcapContext) => void | Promise<void>;
}
```

### Config Extension Hook

Use `extendUserConfig` to add default values:

```typescript
const defaultsPlugin: NightcapPlugin = {
  id: 'defaults-plugin',
  hookHandlers: {
    config: {
      extendUserConfig(config) {
        return {
          ...config,
          // Add default paths if not specified
          paths: {
            artifacts: './build',
            sources: './src/contracts',
            ...config.paths,
          },
        };
      },
    },
  },
};
```

### Config Validation Hook

Use `validateUserConfig` to validate configuration:

```typescript
const validationPlugin: NightcapPlugin = {
  id: 'validation-plugin',
  hookHandlers: {
    config: {
      validateUserConfig(config) {
        const errors: string[] = [];

        if (config.defaultNetwork === 'mainnet') {
          if (!config.networks?.mainnet?.nodeUrl) {
            errors.push('Mainnet nodeUrl is required when using mainnet');
          }
        }

        return errors;
      },
    },
  },
};
```

### Runtime Created Hook

Use `runtime.created` for initialization:

```typescript
const loggingPlugin: NightcapPlugin = {
  id: 'logging-plugin',
  hookHandlers: {
    runtime: {
      created(ctx) {
        console.log(`Nightcap started with network: ${ctx.config.defaultNetwork}`);
      },
    },
  },
};
```

## Plugin Dependencies

Plugins can depend on other plugins using dynamic imports:

```typescript
import type { NightcapPlugin } from '@nightcap/core';

const advancedPlugin: NightcapPlugin = {
  id: 'advanced-plugin',
  dependencies: [
    // Dependencies are loaded dynamically
    () => import('nightcap-base-plugin'),
    () => import('nightcap-utils-plugin'),
  ],
  // ... rest of plugin
};

export default advancedPlugin;
```

Dependencies are:
- Resolved using topological sort (DFS)
- Loaded before the dependent plugin
- Validated for circular dependencies

## Overriding Built-in Tasks

Plugins can override existing tasks while calling the original:

```typescript
import type { NightcapPlugin, TaskDefinition } from '@nightcap/core';

const compileOverride: TaskDefinition = {
  name: 'compile', // Same name as built-in task
  description: 'Compile with custom preprocessing',
  params: {
    force: {
      type: 'boolean',
      description: 'Force recompilation',
      default: false,
    },
  },
  async action(context) {
    console.log('Running pre-compilation steps...');

    // Call the original compile task
    if (context.runSuper) {
      await context.runSuper();
    }

    console.log('Running post-compilation steps...');
  },
};

const preprocessPlugin: NightcapPlugin = {
  id: 'preprocess-plugin',
  tasks: [compileOverride],
};
```

## Example: Gas Reporter Plugin

A complete example of a plugin that reports gas usage after compilation:

```typescript
import type { NightcapPlugin, TaskDefinition, TaskContext } from '@nightcap/core';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

interface GasReport {
  contract: string;
  circuits: Array<{
    name: string;
    estimatedGas: number;
  }>;
}

function analyzeArtifacts(artifactsDir: string): GasReport[] {
  const reports: GasReport[] = [];

  const files = readdirSync(artifactsDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const artifact = JSON.parse(
      readFileSync(join(artifactsDir, file), 'utf8')
    );

    // Analyze artifact for gas estimates
    // (Implementation depends on artifact format)
    reports.push({
      contract: file.replace('.json', ''),
      circuits: [],
    });
  }

  return reports;
}

const gasReportTask: TaskDefinition = {
  name: 'gas-report',
  description: 'Generate gas usage report for compiled contracts',
  async action(context: TaskContext) {
    const artifactsDir = join(
      process.cwd(),
      context.config.paths?.artifacts ?? 'artifacts'
    );

    const reports = analyzeArtifacts(artifactsDir);

    console.log('\nGas Report');
    console.log('==========\n');

    for (const report of reports) {
      console.log(`Contract: ${report.contract}`);
      for (const circuit of report.circuits) {
        console.log(`  ${circuit.name}: ${circuit.estimatedGas} gas`);
      }
      console.log();
    }
  },
};

const compileWithReport: TaskDefinition = {
  name: 'compile',
  description: 'Compile contracts with gas reporting',
  params: {
    force: {
      type: 'boolean',
      description: 'Force recompilation',
      default: false,
    },
    'gas-report': {
      type: 'boolean',
      description: 'Show gas report after compilation',
      default: true,
    },
  },
  async action(context: TaskContext) {
    // Run original compile
    if (context.runSuper) {
      await context.runSuper();
    }

    // Show gas report if enabled
    if (context.params['gasReport'] !== false) {
      const artifactsDir = join(
        process.cwd(),
        context.config.paths?.artifacts ?? 'artifacts'
      );
      const reports = analyzeArtifacts(artifactsDir);

      console.log('\n--- Gas Report ---');
      for (const report of reports) {
        console.log(`${report.contract}:`);
        for (const circuit of report.circuits) {
          console.log(`  ${circuit.name}: ${circuit.estimatedGas} gas`);
        }
      }
    }
  },
};

const gasReporterPlugin: NightcapPlugin = {
  id: 'gas-reporter',
  npmPackage: 'nightcap-gas-reporter',
  tasks: [gasReportTask, compileWithReport],
};

export default gasReporterPlugin;
```

## Publishing Plugins

To publish a plugin to npm:

1. Create a new package:

```bash
mkdir nightcap-my-plugin
cd nightcap-my-plugin
pnpm init
```

2. Set up the package.json:

```json
{
  "name": "nightcap-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "@nightcap/core": "^0.0.1"
  }
}
```

3. Export your plugin as the default export:

```typescript
// src/index.ts
import type { NightcapPlugin } from '@nightcap/core';

const myPlugin: NightcapPlugin = {
  id: 'my-plugin',
  npmPackage: 'nightcap-my-plugin',
  // ...
};

export default myPlugin;
```

4. Publish:

```bash
pnpm build
pnpm publish
```

## Best Practices

1. **Unique IDs** - Use a unique, descriptive plugin ID
2. **npm package name** - Set `npmPackage` for better error messages
3. **Validate early** - Use `validateUserConfig` to catch config errors
4. **Call runSuper** - When overriding tasks, call `context.runSuper()` unless you want to fully replace the behavior
5. **Document dependencies** - Clearly document any plugin dependencies
6. **Type safety** - Use TypeScript for full type checking
7. **Error handling** - Provide helpful error messages

## TypeScript Types

Import types from `@nightcap/core`:

```typescript
import type {
  NightcapPlugin,
  NightcapUserConfig,
  ResolvedNightcapConfig,
  NightcapContext,
  NightcapHookHandlers,
  ConfigHookHandlers,
  RuntimeHookHandlers,
  TaskDefinition,
  TaskContext,
  TaskParamDefinition,
} from '@nightcap/core';
```
