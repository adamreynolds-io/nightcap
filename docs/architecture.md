# Architecture

This document explains the key architectural concepts of Midnight and how Nightcap interacts with network components.

## Network Components

A Midnight network consists of three main services:

| Component | Purpose | Default Port |
|-----------|---------|--------------|
| **Node** | Blockchain node (RPC/WebSocket) | 9944 (RPC), 9933 (WS) |
| **Indexer** | GraphQL API for blockchain queries | 8088 |
| **Proof Server** | ZK proof generation | 6300 |

## Proof Server: Local-Only Requirement

**The proof server MUST always run locally.** This is a fundamental privacy requirement of the Midnight architecture.

### Why?

When you submit a transaction on Midnight, the proof server:

1. Receives your **private transaction inputs** (balances, contract state, etc.)
2. Generates a **zero-knowledge proof** that validates the transaction
3. Returns the proof to be submitted on-chain

If you sent your private inputs to a remote proof server, that server would see all your private data, completely defeating the privacy guarantees of Midnight.

### Network Configurations

For **local development** (`localnet`):
```bash
nightcap node  # Starts node, indexer, AND proof server together
```

For **remote networks** (devnet, testnet, mainnet):
```bash
nightcap proof-server --network devnet  # Starts local proof server only
```

The proof server connects to the remote node but runs locally on your machine.

### Default Configuration

All networks are configured with `proofServerUrl: 'http://localhost:6300'` because the proof server is always local:

```typescript
// nightcap.config.ts
export default {
  networks: {
    devnet: {
      nodeUrl: 'https://rpc.devnet.midnight.network',      // Remote
      indexerUrl: 'https://indexer.devnet.midnight.network', // Remote
      proofServerUrl: 'http://localhost:6300',              // Always local
    },
  },
};
```

## Working with Remote Networks

### Step 1: Start the local proof server

```bash
# Connect to devnet
nightcap proof-server --network devnet

# Or specify a custom node URL
nightcap proof-server --node-url wss://rpc.devnet.midnight.network
```

### Step 2: Run your commands

With the proof server running, you can deploy and interact with contracts:

```bash
nightcap deploy --network devnet
nightcap console --network devnet
```

### Step 3: Stop the proof server when done

```bash
nightcap proof-server:stop
```

## Proof Server Commands

| Command | Description |
|---------|-------------|
| `nightcap proof-server` | Start local proof server for remote networks |
| `nightcap proof-server:stop` | Stop the local proof server |
| `nightcap proof-server:status` | Show proof server status |
| `nightcap proof-server:logs` | View proof server logs |

### Options

```bash
nightcap proof-server [options]

Options:
  --network <name>     Network to connect to (uses nodeUrl from config)
  --node-url <url>     WebSocket URL of node (overrides network config)
  --detach             Run in background
  --port <number>      Local port to expose (default: 6300)
  --image <image>      Docker image to use
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Machine                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │   Your dApp     │    │      Proof Server            │   │
│  │                 │───▶│  (localhost:6300)            │   │
│  │  - nightcap cli │    │  - Receives private inputs   │   │
│  │  - scripts      │    │  - Generates ZK proofs       │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│           │                          │                      │
└───────────┼──────────────────────────┼──────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Remote Network                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │     Indexer     │    │          Node                │   │
│  │  (GraphQL API)  │    │  (RPC/WebSocket)             │   │
│  └─────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **Never configure a remote proof server URL** - Your private data would be exposed
2. **Keep your proof server updated** - Use the latest Docker image for security patches
3. **Don't expose proof server to the network** - It should only be accessible from localhost

## Troubleshooting

### "Proof server is not available"

The proof server isn't running. Start it with:

```bash
# For localnet (starts everything)
nightcap node

# For remote networks (starts proof server only)
nightcap proof-server --network <network>
```

### "Connection refused to localhost:6300"

Docker may not be running, or the proof server failed to start. Check:

```bash
docker ps  # Is Docker running?
nightcap proof-server:logs  # What do the logs say?
```

### Proof server takes too long to start

The proof server needs to sync with the blockchain node. For remote networks, this can take longer. The default timeout is 60 seconds. Check the logs for progress:

```bash
nightcap proof-server:logs --follow
```
