# Change: Add Local Midnight Network via Docker

**Status:** 🟡 Core Features Complete (forking/accounts pending)

## Why
Developers need a fast, deterministic local environment for contract development and testing. Like Hardhat Network, Nightcap should provide a local Midnight stack that enables rapid iteration without connecting to public networks. Official Docker images for midnight-node, indexer, and toolkit are available from `midnightntwrk` on Docker Hub—Nightcap orchestrates these into a seamless developer experience.

## What Changed
- ✅ Added `nightcap node` command to start full Midnight Docker stack
- ✅ Orchestrated midnight-node, proof-server, indexer containers
- ✅ Generate and manage docker-compose.yml for the development stack
- ✅ Added `nightcap node:stop`, `node:status`, `node:logs`, `node:reset`, `node:exec` subcommands
- ✅ Implemented state snapshots (`node:snapshot`, `node:restore`, `node:snapshots`, `node:snapshot:delete`)
- ✅ Added graceful shutdown handling (SIGINT/SIGTERM)
- ✅ Support for detached mode (`--detach` flag)

## Remaining Work
- [ ] Pre-funded development accounts
- [ ] Network forking from testnet/mainnet
- [ ] Resource limits configuration

## Impact
- Affected specs: `local-network` (new capability)
- Affected code: Uses `@nightcap/docker-orchestrator` from core
- Dependencies: Docker, official midnightntwrk images
