# Project Context

## Purpose
Nightcap is a Midnight blockchain development environment by the Midnight Foundation, inspired by Ethereum's Hardhat. It simplifies building, testing, and deploying smart contracts and dApps on the Midnight blockchain.

**Proposed features include:**
- Local Midnight node simulation for rapid contract development and testing of Compact Contracts
- Automated contract compilation, deployment, and verification workflows
- Plugin architecture for extending functionality with Midnight-specific use cases
- Scriptable tasks for common developer operations (including TypeScript dApp scaffolding)
- Integration with Midnight's security and compliance tooling

**Status:** Early-stage, work-in-progress open-source project.

## Tech Stack
- **Languages:** TypeScript, Rust
- **Package Managers:** npm, Cargo
- **CI/CD:** GitHub Actions
- **Security:** Checkmarx (SAST, IaC, SCA, API Security, Container Security, Supply Chain Scans)
- **Dependency Management:** Dependabot (npm daily, Cargo daily, GitHub Actions weekly)
- **Environment:** direnv for environment management

## Project Conventions

### Code Style
- All source files must include Apache 2.0 license header:
  ```
  // This file is part of NIGHTCAP.
  // Copyright (C) 2025 Midnight Foundation
  // SPDX-License-Identifier: Apache-2.0
  ```
- Clear, concise code with descriptive naming
- Include unit tests and integration tests with all changes
- Documentation updates required for new features

### Architecture Patterns
- Plugin-based architecture for extensibility
- OpenSpec specification-driven development for major changes
- Change proposals required for: new features, breaking changes, architecture shifts, performance/security work

### Testing Strategy
- Unit tests required for all new functionality
- Integration tests for system-level features
- Security scanning via Checkmarx on all PRs

### Git Workflow
- **Branch naming:** Contributor-prefixed branches (e.g., `jill-my-feature`)
- **Commits:** Clear, concise, descriptive messages; GPG signing required
- **Force pushes prohibited** on shared branches
- **Code review required** for all PRs
- **Main branch:** `main`

## Domain Context
Midnight is a blockchain platform focused on data protection and compliance. Key concepts:
- **Compact Contracts:** Midnight's smart contract language
- **Data protection:** Privacy-preserving blockchain operations
- **Compliance tooling:** Built-in regulatory compliance features

Nightcap aims to be the primary developer toolchain for the Midnight ecosystem, similar to how Hardhat serves Ethereum developers.

## Network Environments
Nightcap supports deployment to all Midnight network environments:

| Network | Type | Description |
|---------|------|-------------|
| `localnet` | Local | Docker-based local development stack |
| `devnet` | Internal | Internal development network |
| `qanet` | Internal | Internal QA testing network |
| `preview` | Public | Public testnet for early testing |
| `preprod` | Public | Public pre-production network |
| `mainnet` | Public | Production network (not yet available) |

**Deployment safety:**
- `localnet`: No confirmation required
- `devnet`, `qanet`: Confirmation prompt
- `preview`, `preprod`: Confirmation prompt with network name
- `mainnet`: Requires explicit `--confirm-mainnet` flag

## Important Constraints
- **License:** Apache 2.0 - all contributions must comply
- **CLA:** Contributors must sign the Contributor License Agreement
- **Security:** All code undergoes Checkmarx security scanning
- **GPG signing:** Required for all commits and tags

## External Dependencies
- **Midnight blockchain:** Target deployment platform
- **GitHub:** Source control, CI/CD, security scanning integration
- **Checkmarx One:** Application security platform
- **Community channels:** Discord, Telegram, X for support
- **Jira/GitHub sync:** Unito integration for project management

## Docker Images
Nightcap orchestrates official Midnight Docker images:

| Image | Registry | Purpose |
|-------|----------|---------|
| `midnightntwrk/midnight-node` | Docker Hub | Blockchain node |
| `midnightntwrk/midnight-node-toolkit` | Docker Hub | CLI operations (deploy, wallet, tx) |
| `midnightnetwork/proof-server` | Docker Hub | ZK proof generation |
| `midnightntwrk/indexer-standalone` | Docker Hub | Combined indexer + SQLite |
| `midnightntwrk/indexer-api` | Docker Hub | GraphQL API |
| `midnightntwrk/wallet-indexer` | Docker Hub | Wallet transaction tracking |

Note: Proof-server uses `midnightnetwork` org, others use `midnightntwrk`.

## Native Binaries
The Compact compiler is distributed as a native binary (not Docker):

| Binary | Source | Purpose |
|--------|--------|---------|
| `compactc` | github.com/midnightntwrk/compact | Compact contract compiler |

Platforms: macOS (arm64, x86_64), Linux (x86_64)

**Releases:**
- Stable: GitHub releases (e.g., `compactc-v0.26.0`)
- Prerelease: `github.com/midnightntwrk/compact/tree/main/prerelease`

Install (stable): `curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh`

**Version Compatibility:**
- Node, toolkit, indexer, and proof-server versions are **coupled**
- Nightcap ships tested version sets for localnet (e.g., "0.20.x stack")
- The toolkit can run independently for remote network operations

**Usage by Network:**

| Network | Images Required |
|---------|-----------------|
| `localnet` | Full stack: node + toolkit + indexer + proof-server |
| `devnet`, `qanet`, `preview`, `preprod`, `mainnet` | Toolkit only (connects to remote infra) |

## Reference Examples

| Repository | Purpose |
|------------|---------|
| [example-counter](https://github.com/midnightntwrk/example-counter) | Reference dApp with Compact contract, CLI tool, and basic project structure |
| [example-bboard](https://github.com/midnightntwrk/example-bboard) | Bulletin board dApp with Compact contract, CLI, and React web UI |
| [midnight-js/testkit-js](https://github.com/midnightntwrk/midnight-js/tree/main/testkit-js) | Official Docker stack configuration for local development |

These repositories demonstrate:
- Valid Compact contract syntax (compatible with compactc 0.25.0+)
- Standard project structure for Midnight dApps
- CLI implementation for contract interaction
- Web UI integration with Lace wallet (example-bboard)
- Zero-knowledge proof generation patterns
- Docker stack configuration with compatible versions (testkit-js)
