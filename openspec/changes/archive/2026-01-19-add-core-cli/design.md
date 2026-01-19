**Status:** ✅ Implemented

## Context
Nightcap needs a CLI framework that balances simplicity with extensibility. The midnight-node toolkit already provides comprehensive blockchain operations (transactions, wallets, contracts, proofs), but lacks a developer-friendly interface for iterative development workflows.

**Stakeholders:** Midnight dApp developers, contract authors, integration testers

## Goals / Non-Goals

**Goals:**
- Provide intuitive CLI for common development tasks
- Enable task composition and customization
- Leverage toolkit's proven transaction/contract infrastructure
- Support TypeScript-first configuration

**Non-Goals:**
- Replace toolkit for production operations
- Build a full IDE or GUI
- Support non-TypeScript configurations initially

## Decisions

### Decision: Task-based Architecture (like Hardhat)
Every CLI command is a task. Tasks can depend on other tasks, be overridden by plugins, and composed into workflows.

**Alternatives considered:**
- Simple command pattern: Less flexible, harder to extend
- Make-style build system: Overkill, unfamiliar to JS developers

### Decision: Use midnight-node toolkit as execution engine
The toolkit provides battle-tested operations for transactions, contracts, wallets, and proofs. Nightcap wraps these with developer-friendly defaults and simplified configuration.

**Alternatives considered:**
- Build from scratch: Duplicates effort, higher maintenance burden
- Thin wrapper only: Insufficient abstraction for development workflows

### Decision: Docker-First Toolkit Integration

The toolkit and Midnight infrastructure are available as official Docker images:

| Image | Purpose |
|-------|---------|
| `midnightntwrk/midnight-node` | Blockchain node |
| `midnightntwrk/midnight-node-toolkit` | CLI operations |
| `midnightnetwork/proof-server` | ZK proof generation |
| `midnightntwrk/indexer-standalone` | Combined indexer + SQLite |
| `midnightntwrk/indexer-api` | GraphQL API |
| `midnightntwrk/wallet-indexer` | Wallet transaction tracking |

**Version Compatibility:**
- Node, toolkit, indexer, and proof-server versions are coupled
- A compatible version set must be used together for localnet
- Nightcap will define and ship tested version sets (e.g., "0.20.0 stack")

**Toolkit Independence:**
- The toolkit can operate without local node/indexer/proof-server images
- For remote networks (devnet, qanet, preview, preprod, mainnet), only the toolkit container is needed
- The toolkit connects to remote infrastructure via configured URLs

```
Localnet:    toolkit + node + indexer + proof-server (Docker stack)
Remote:      toolkit only ──▶ remote node/indexer/proof-server
```

**Integration options considered:**

| Approach | Pros | Cons |
|----------|------|------|
| **Docker containers** | No install, consistent env, official images | Requires Docker, container overhead |
| **Subprocess (native)** | No Docker dependency | Install complexity, platform issues |
| **NAPI bindings** | Native speed | Requires Rust work, build complexity |

**Decision: Docker-first with native fallback**

```
┌────────────────────────────────────────────────────────────────┐
│                      Nightcap CLI (TypeScript)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              @nightcap/docker-orchestrator                │  │
│  │            (dockerode for Docker API control)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────────────┘
                     │ Docker API / docker-compose
┌────────────────────▼───────────────────────────────────────────┐
│                 Midnight Development Stack                      │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ midnight-node│ │ proof-server │ │ midnight-node-toolkit  │  │
│  │   :9933      │ │    :6300     │ │   (exec for commands)  │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
│  ┌──────────────────────────┐ ┌──────────────────────────┐     │
│  │   indexer-standalone     │ │     wallet-indexer       │     │
│  │   :8080 (GraphQL)        │ │                          │     │
│  └──────────────────────────┘ └──────────────────────────┘     │
│                         shared volume: ./data                   │
└────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Zero installation beyond Docker
- Official images maintained by Midnight team
- Consistent environment across all developer machines
- `nightcap node` starts entire stack with one command
- Toolkit commands via `docker exec` or ephemeral containers

**Toolkit execution via Docker:**
```typescript
// packages/nightcap-core/src/toolkit/docker-bridge.ts
import Docker from 'dockerode';

const docker = new Docker();

export async function deployContract(
  artifact: ContractArtifact,
  network: NetworkConfig
): Promise<DeployResult> {
  const container = await docker.createContainer({
    Image: 'midnightntwrk/midnight-node-toolkit:latest',
    Cmd: [
      'contract-simple', 'deploy',
      '--source', `chain:${network.url}`,
      '--destination', `chain:${network.url}`,
      '--prover', network.prover,
      '--output', 'json'
    ],
    HostConfig: {
      Binds: [`${artifact.dir}:/artifacts:ro`],
      NetworkMode: 'nightcap-network'  // shared Docker network
    }
  });

  await container.start();
  const output = await container.wait();
  const logs = await container.logs({ stdout: true });
  await container.remove();

  return JSON.parse(logs.toString()) as DeployResult;
}
```

**Generated docker-compose.yml for `nightcap node`:**
```yaml
# Generated by Nightcap
version: '3.8'
services:
  node:
    image: midnightntwrk/midnight-node:latest
    ports: ["9933:9933", "9944:9944"]
    volumes: ["./data/node:/data"]

  proof-server:
    image: midnightnetwork/proof-server:latest
    ports: ["6300:6300"]

  indexer:
    image: midnightntwrk/indexer-standalone:latest
    ports: ["8080:8080"]
    depends_on: [node]
    environment:
      NODE_URL: ws://node:9944

  toolkit:
    image: midnightntwrk/midnight-node-toolkit:latest
    volumes: ["./artifacts:/artifacts", "./data:/data"]
    profiles: ["tools"]  # only started on-demand

networks:
  default:
    name: nightcap-network
```

**Fallback for environments without Docker:**
- Detect Docker availability at startup
- If unavailable, fall back to native binary subprocess
- Provide `nightcap doctor` command to diagnose setup issues

### Decision: TypeScript configuration files
Configuration in `nightcap.config.ts` allows type checking, IDE support, and dynamic configuration.

**Alternatives considered:**
- JSON/YAML: Less flexible, no type safety
- JavaScript: Possible but TypeScript preferred for consistency

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Nightcap CLI                    │
│  ┌─────────────────────────────────────────┐    │
│  │           Task Runner                    │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │ compile │ │  test   │ │ deploy  │   │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘   │    │
│  └───────┼───────────┼───────────┼────────┘    │
│          │           │           │              │
│  ┌───────▼───────────▼───────────▼────────┐    │
│  │         Toolkit Adapter Layer           │    │
│  └───────────────────┬────────────────────┘    │
└──────────────────────┼─────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────┐
│            midnight-node/toolkit                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Builder │ │  Source │ │ Prover  │          │
│  └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────┘
```

## Configuration Schema

```typescript
// nightcap.config.ts
import { NightcapConfig } from '@nightcap/core';

const config: NightcapConfig = {
  compact: {
    version: "1.0",
    sources: ["./contracts"],
    artifacts: "./artifacts"
  },
  networks: {
    // Local Docker stack (nightcap node)
    localnet: {
      url: "http://localhost:9933",
      prover: "http://localhost:6300",
      indexer: "http://localhost:8080/graphql"
    },
    // Internal development networks
    devnet: {
      url: "https://rpc.devnet.midnight.network",
      prover: "https://prover.devnet.midnight.network",
      indexer: "https://indexer.devnet.midnight.network/graphql"
    },
    qanet: {
      url: "https://rpc.qanet.midnight.network",
      prover: "https://prover.qanet.midnight.network",
      indexer: "https://indexer.qanet.midnight.network/graphql"
    },
    // Public networks
    preview: {
      url: "https://rpc.preview.midnight.network",
      prover: "https://prover.preview.midnight.network",
      indexer: "https://indexer.preview.midnight.network/graphql"
    },
    preprod: {
      url: "https://rpc.preprod.midnight.network",
      prover: "https://prover.preprod.midnight.network",
      indexer: "https://indexer.preprod.midnight.network/graphql"
    },
    mainnet: {
      url: "https://rpc.midnight.network",
      prover: "https://prover.midnight.network",
      indexer: "https://indexer.midnight.network/graphql"
    }
  },
  defaultNetwork: "localnet",
  tasks: {
    // Custom task definitions
  }
};

export default config;
```

## Risks / Trade-offs

- **Risk:** Toolkit API changes break Nightcap
  - *Mitigation:* Pin toolkit version, adapter layer isolates changes

- **Risk:** Task system complexity overwhelming for simple projects
  - *Mitigation:* Sensible defaults, minimal config for basic usage

## Open Questions (Resolved)
- ✅ Should we support `nightcap.config.js` for non-TypeScript projects?
  - **Yes:** Implemented support for `.ts`, `.js`, and `.mjs` config files
- ✅ What's the minimum toolkit version to support?
  - **Resolved:** Using version sets - Nightcap ships tested compatible versions (node, toolkit, indexer, proof-server)
