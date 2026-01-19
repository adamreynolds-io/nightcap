# @nightcap/docker-orchestrator

Docker orchestration package for Nightcap development environment. Manages the local Midnight development stack including node, indexer, and proof server containers.

## Installation

```bash
pnpm add @nightcap/docker-orchestrator
```

## Overview

This package provides:

- **StackManager** - High-level API for managing the complete Midnight stack
- **DockerClient** - Low-level Docker API wrapper using dockerode
- **ComposeGenerator** - Docker Compose file generation
- **ImageManager** - Docker image pulling and management

## Usage

### StackManager

The primary interface for managing the local development network:

```typescript
import { StackManager } from '@nightcap/docker-orchestrator';

const stack = new StackManager({
  projectName: 'nightcap',
  ports: {
    nodeRpc: 9944,
    nodeWs: 9945,
    indexer: 8088,
    proofServer: 6300,
  },
});

// Start the stack
await stack.start();

// Get status
const status = await stack.getStatus();
console.log(status.running); // true

// Get service URLs
const urls = stack.getServiceUrls();
console.log(urls.nodeRpc); // http://localhost:9944

// Stop the stack
await stack.stop();
```

### Snapshots

Save and restore network state:

```typescript
// Create a snapshot
await stack.createSnapshot('before-test');

// List snapshots
const snapshots = await stack.listSnapshots();

// Restore from snapshot
await stack.restoreSnapshot('before-test');

// Delete snapshot
await stack.deleteSnapshot('before-test');
```

### Container Execution

Execute commands in service containers:

```typescript
const result = await stack.exec('node', ['midnight-node', '--version']);
console.log(result.output);
```

### Image Management

```typescript
import { ImageManager } from '@nightcap/docker-orchestrator';

const manager = new ImageManager();

// Check for missing images
const missing = await manager.getMissing();

// Pull images with progress
await manager.pullAll((progress) => {
  console.log(`${progress.image}: ${progress.status}`);
});
```

## Default Configuration

### Default Ports

| Service | Port |
|---------|------|
| Node RPC | 9944 |
| Node WebSocket | 9945 |
| Indexer | 8088 |
| Proof Server | 6300 |

### Default Images

```typescript
import { DEFAULT_IMAGES } from '@nightcap/docker-orchestrator';

// {
//   node: 'midnightntwrk/midnight-node:latest',
//   indexer: 'midnightntwrk/midnight-indexer:latest',
//   proofServer: 'midnightntwrk/midnight-proof-server:latest',
// }
```

## API Reference

### StackManager

```typescript
class StackManager {
  constructor(options: StackOptions);

  // Lifecycle
  start(options?: StartOptions): Promise<{ success: boolean; error?: string }>;
  stop(): Promise<{ success: boolean; error?: string }>;
  resetData(): Promise<{ success: boolean; error?: string }>;

  // Status
  getStatus(): Promise<StackStatus>;
  getServiceUrls(): Record<string, string>;
  isDockerAvailable(): Promise<boolean>;
  getMissingImages(): Promise<string[]>;

  // Images
  pullImages(onProgress?: (progress: ImagePullProgress) => void): Promise<boolean>;

  // Logs
  getLogs(service?: ServiceName, tail?: number): Promise<string | null>;
  followLogs(service?: ServiceName): ChildProcess;

  // Execution
  exec(service: ServiceName, command: string[]): Promise<ExecResult>;

  // Snapshots
  createSnapshot(name: string): Promise<{ success: boolean; path?: string; error?: string }>;
  restoreSnapshot(name: string): Promise<{ success: boolean; error?: string }>;
  listSnapshots(): Promise<SnapshotInfo[]>;
  deleteSnapshot(name: string): Promise<{ success: boolean; error?: string }>;
}
```

### Types

```typescript
type ServiceName = 'node' | 'indexer' | 'proof-server';

interface StackStatus {
  running: boolean;
  services: Record<ServiceName, { state: string } | null>;
}

interface StartOptions {
  reset?: boolean;
}

interface ImagePullProgress {
  image: string;
  status: string;
  progress?: {
    current: number;
    total: number;
  };
}
```

## Documentation

See the main [Nightcap documentation](../../docs/) for more information.

## License

Apache-2.0
