# Configuration Reference

Nightcap is configured using a `nightcap.config.ts` file in your project root. This document covers all available configuration options.

## Configuration File

Nightcap looks for configuration files in the following order:

1. `nightcap.config.ts`
2. `nightcap.config.js`
3. `nightcap.config.mts`
4. `nightcap.config.mjs`

You can also specify a custom config path with `--config <path>`.

## Basic Configuration

A minimal configuration file:

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  defaultNetwork: 'localnet',
});
```

## Full Configuration Interface

```typescript
interface NightcapConfig {
  // Default network when --network is not specified
  defaultNetwork?: string;

  // Network configurations
  networks?: Record<string, NetworkConfig>;

  // Docker configuration for local development
  docker?: DockerConfig;

  // Compact compiler configuration
  compact?: CompactConfig;

  // Custom paths
  paths?: PathsConfig;

  // Task overrides
  tasks?: Record<string, Partial<TaskDefinition>>;

  // Plugins (extends NightcapUserConfig)
  plugins?: NightcapPlugin[];
}
```

## Network Configuration

Configure connections to Midnight networks:

```typescript
interface NetworkConfig {
  // Network identifier
  name: string;

  // Indexer GraphQL URL
  indexerUrl?: string;

  // Proof server URL (MUST be localhost - see note below)
  proofServerUrl?: string;

  // Node RPC URL
  nodeUrl?: string;

  // Whether this is a local development network
  isLocal?: boolean;
}
```

> **Important: Proof Server Must Be Local**
>
> The `proofServerUrl` must always point to `localhost` (default: `http://localhost:6300`). Proof servers process private transaction inputs, so sending data to a remote server would compromise privacy. For remote networks like devnet or mainnet, run a local proof server with `nightcap proof-server --network <name>`. See [Architecture](./architecture.md) for details.

### Pre-configured Networks

Nightcap includes these pre-configured networks:

| Network | Description | Indexer URL |
|---------|-------------|-------------|
| `localnet` | Local Docker network | `http://localhost:8088/api/v1/graphql` |
| `devnet` | Internal development network | `https://indexer.devnet.midnight.network/api/v1/graphql` |
| `preview` | Public testnet | `https://indexer.preview.midnight.network/api/v1/graphql` |
| `preprod` | Pre-production network | `https://indexer.preprod.midnight.network/api/v1/graphql` |
| `mainnet` | Production network | `https://indexer.midnight.network/api/v1/graphql` |

### Custom Network Example

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  defaultNetwork: 'localnet',
  networks: {
    // Override localnet ports
    localnet: {
      name: 'localnet',
      indexerUrl: 'http://localhost:9088/api/v1/graphql',
      proofServerUrl: 'http://localhost:7300',
      nodeUrl: 'http://localhost:10944',
      isLocal: true,
    },
    // Add custom network (proof server is always local)
    staging: {
      name: 'staging',
      indexerUrl: 'https://indexer.staging.example.com/api/v1/graphql',
      proofServerUrl: 'http://localhost:6300',  // Always local!
      nodeUrl: 'https://rpc.staging.example.com',
      isLocal: false,
    },
  },
});
```

## Docker Configuration

Configure the local Docker development environment:

```typescript
interface DockerConfig {
  // Whether to use Docker for local services
  enabled?: boolean;

  // Path to custom docker-compose file
  composePath?: string;

  // Docker images to use
  images?: {
    node?: string;
    indexer?: string;
    proofServer?: string;
    toolkit?: string;
  };

  // Port mappings for Docker services
  ports?: {
    nodeRpc?: number;
    nodeWs?: number;
    indexer?: number;
    proofServer?: number;
  };
}
```

### Default Ports

| Service | Default Port |
|---------|--------------|
| Node RPC | 9944 |
| Node WebSocket | 9945 |
| Indexer | 8088 |
| Proof Server | 6300 |

### Docker Configuration Example

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  docker: {
    enabled: true,
    ports: {
      nodeRpc: 19944,
      nodeWs: 19945,
      indexer: 18088,
      proofServer: 16300,
    },
    images: {
      node: 'midnightntwrk/midnight-node:v1.2.0',
      indexer: 'midnightntwrk/midnight-indexer:v1.2.0',
      proofServer: 'midnightntwrk/midnight-proof-server:v1.2.0',
    },
  },
});
```

## Compact Compiler Configuration

Configure the Compact contract compiler:

```typescript
interface CompactConfig {
  // Compiler version to use
  version?: string;

  // Source files or glob patterns to compile
  sources?: string[];

  // Files or patterns to exclude
  exclude?: string[];
}
```

### Compiler Configuration Example

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  compact: {
    version: '0.26.0',
    sources: ['contracts/**/*.compact'],
    exclude: ['contracts/test/**', 'contracts/**/*.test.compact'],
  },
});
```

## Paths Configuration

Configure project directory structure:

```typescript
interface PathsConfig {
  // Directory for compiled contract artifacts
  artifacts?: string;

  // Directory for contract source files
  sources?: string;

  // Directory for deployment scripts
  deploy?: string;

  // Directory for generated TypeScript types
  types?: string;

  // Directory for deployment history
  deployments?: string;
}
```

### Default Paths

| Path | Default |
|------|---------|
| `artifacts` | `./artifacts` |
| `sources` | `./contracts` |
| `deploy` | `./deploy` |
| `types` | `./typechain` |
| `deployments` | `./deployments` |

### Paths Configuration Example

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  paths: {
    artifacts: './build/artifacts',
    sources: './src/contracts',
    deploy: './scripts/deploy',
    types: './src/types',
  },
});
```

## Task Overrides

Override built-in task parameters:

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  tasks: {
    compile: {
      params: {
        'generate-types': {
          type: 'boolean',
          description: 'Generate TypeScript types',
          default: true, // Enable by default
        },
      },
    },
  },
});
```

## Complete Example

A comprehensive configuration example:

```typescript
import { defineConfig } from '@nightcap/core';

export default defineConfig({
  // Use localnet by default
  defaultNetwork: 'localnet',

  // Network configurations
  networks: {
    localnet: {
      name: 'localnet',
      indexerUrl: 'http://localhost:8088/api/v1/graphql',
      proofServerUrl: 'http://localhost:6300',
      nodeUrl: 'http://localhost:9944',
      isLocal: true,
    },
    preview: {
      name: 'preview',
      indexerUrl: 'https://indexer.preview.midnight.network/api/v1/graphql',
      proofServerUrl: 'http://localhost:6300',  // Always local!
      nodeUrl: 'https://rpc.preview.midnight.network',
      isLocal: false,
    },
  },

  // Docker configuration
  docker: {
    enabled: true,
    ports: {
      nodeRpc: 9944,
      nodeWs: 9945,
      indexer: 8088,
      proofServer: 6300,
    },
  },

  // Compact compiler settings
  compact: {
    version: '0.26.0',
    exclude: ['**/test/**'],
  },

  // Project paths
  paths: {
    artifacts: './artifacts',
    sources: './contracts',
    deploy: './deploy',
    types: './typechain',
  },
});
```

## Environment Variables

Nightcap respects these environment variables:

| Variable | Description |
|----------|-------------|
| `NIGHTCAP_NETWORK` | Override default network |
| `DEBUG` | Enable debug logging when set to `nightcap:*` |

## TypeScript Support

The `defineConfig` helper provides full TypeScript support with IntelliSense:

```typescript
import { defineConfig } from '@nightcap/core';

// Full type checking and autocomplete
export default defineConfig({
  // ...
});
```

You can also import the types directly:

```typescript
import type { NightcapConfig, NetworkConfig, DockerConfig } from '@nightcap/core';
```
