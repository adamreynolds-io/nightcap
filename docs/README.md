# Nightcap Documentation

Nightcap is a development environment for the [Midnight blockchain](https://midnight.network), designed to simplify building, testing, and deploying Compact smart contracts and dApps. Inspired by Ethereum's Hardhat, Nightcap provides a flexible environment for Midnight developers.

## Table of Contents

- [Getting Started](./getting-started.md) - Installation and your first project
- [Command Reference](./commands.md) - All CLI commands and options
- [Configuration](./configuration.md) - Config file reference
- [Plugin Development](./plugins.md) - Creating Nightcap plugins
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Quick Links

### Installation

```bash
pnpm add -D @nightcap/core
```

### Create a Project

```bash
npx nightcap init
```

### Start Local Network

```bash
npx nightcap node
```

### Compile Contracts

```bash
npx nightcap compile
```

### Deploy Contracts

```bash
npx nightcap deploy
```

## Features

- **Local Midnight node simulation** for rapid development and testing of Compact contracts
- **Automated contract compilation, deployment, and verification** workflows
- **Plugin architecture** to extend functionality for Midnight-specific use cases
- **Scriptable tasks** for common developer operations
- **TypeScript-first** with full type safety
- **Docker-based** local network with snapshot/restore capability

## Requirements

- Node.js 20 or higher
- Docker (for local network)
- pnpm (recommended)

## Getting Help

- Run `nightcap --help` for command help
- Run `nightcap doctor` to check your environment
- See [Troubleshooting](./troubleshooting.md) for common issues
