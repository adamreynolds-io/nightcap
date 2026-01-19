# @nightcap/core

Core package for the Nightcap development environment for Midnight blockchain.

## Installation

```bash
pnpm add -D @nightcap/core
```

## Usage

```bash
# Create a new project
npx nightcap init

# Start local development network
npx nightcap node

# Compile Compact contracts
npx nightcap compile

# Deploy contracts
npx nightcap deploy
```

## Features

- CLI for Midnight development workflows
- Compact contract compilation with caching
- Local Docker-based development network
- Contract deployment with history tracking
- Plugin architecture for extensibility
- TypeScript-first with full type safety

## Configuration

Create a `nightcap.config.ts` in your project root:

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  defaultNetwork: 'localnet',
  compact: {
    version: '0.26.0',
  },
  paths: {
    artifacts: './artifacts',
    sources: './contracts',
  },
});
```

## Documentation

See the main [Nightcap documentation](../../docs/) for:

- [Getting Started](../../docs/getting-started.md)
- [Command Reference](../../docs/commands.md)
- [Configuration](../../docs/configuration.md)
- [Plugin Development](../../docs/plugins.md)
- [Troubleshooting](../../docs/troubleshooting.md)

## License

Apache-2.0
