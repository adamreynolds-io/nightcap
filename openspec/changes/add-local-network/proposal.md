# Change: Add Local Midnight Network via Docker

## Why
Developers need a fast, deterministic local environment for contract development and testing. Like Hardhat Network, Nightcap should provide a local Midnight stack that enables rapid iteration without connecting to public networks. Official Docker images for midnight-node, indexer, and toolkit are available from `midnightntwrk` on Docker Hub—Nightcap orchestrates these into a seamless developer experience.

## What Changes
- Add `nightcap node` command to start full Midnight Docker stack
- Orchestrate midnight-node, proof-server, indexer, and toolkit containers
- Generate and manage docker-compose.yml for the development stack
- Provide pre-funded accounts for development
- Support state snapshots and resets via container volumes
- Enable network forking from testnet/mainnet
- Add `nightcap node logs`, `nightcap node stop` subcommands

## Impact
- Affected specs: `local-network` (new capability)
- Affected code: Uses `@nightcap/docker-orchestrator` from core
- Dependencies: Docker, official midnightntwrk images
