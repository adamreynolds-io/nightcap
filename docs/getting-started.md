# Getting Started

This guide will walk you through installing Nightcap, creating your first project, and deploying a contract to a local development network.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20 or higher** - [Download Node.js](https://nodejs.org/)
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **pnpm** (recommended) - Install with `npm install -g pnpm`

You can verify your environment by running:

```bash
npx nightcap doctor
```

This will check all requirements and report any issues.

## Installation

Install Nightcap as a development dependency in your project:

```bash
# Using pnpm (recommended)
pnpm add -D @nightcap/core

# Using npm
npm install --save-dev @nightcap/core

# Using yarn
yarn add -D @nightcap/core
```

## Creating a New Project

Create a new Nightcap project using the init command:

```bash
npx nightcap init
```

This will start an interactive wizard that asks for:

1. **Project name** - The name of your project
2. **Template** - Choose from:
   - `basic` - Simple contract project
   - `dapp` - Full dApp with optional CLI and React interfaces
   - `library` - Reusable contract library
3. **Description** (optional) - A brief description of your project

### Non-Interactive Mode

You can also create a project non-interactively:

```bash
npx nightcap init --template basic --name my-project
```

For dApp projects with specific interfaces:

```bash
npx nightcap init --template dapp --name my-dapp --cli --react
```

### Project Structure

After initialization, your project will have this structure:

```
my-project/
├── contracts/           # Compact contract source files
│   └── Counter.compact  # Example contract
├── artifacts/           # Compiled contract artifacts (generated)
├── deployments/         # Deployment history per network
├── nightcap.config.ts   # Nightcap configuration
├── package.json
└── tsconfig.json
```

### Initialize from Compiled Contract

If you have an existing compiled contract, you can scaffold a project around it:

```bash
npx nightcap init --from-contract ./path/to/compiled/contract
```

This will:
- Detect the contract's circuits and witnesses
- Generate typed TypeScript helpers
- Set up the project structure for your contract

## Starting the Local Network

Start the local Midnight development network:

```bash
npx nightcap node
```

This will:

1. Pull the required Docker images (first time only)
2. Start the Midnight node, indexer, and proof server
3. Display service URLs when ready

The services will be available at:

| Service | URL |
|---------|-----|
| Node RPC | http://localhost:9944 |
| Node WebSocket | http://localhost:9945 |
| Indexer GraphQL | http://localhost:8088/api/v1/graphql |
| Proof Server | http://localhost:6300 |

### Running in Background

To run the network in the background:

```bash
npx nightcap node --detach
```

Then use these commands to manage it:

```bash
npx nightcap node:status   # Check status
npx nightcap node:logs     # View logs
npx nightcap node:stop     # Stop the network
```

## Compiling Contracts

Compile your Compact contracts:

```bash
npx nightcap compile
```

This will:

1. Find all `.compact` files in your `contracts/` directory
2. Resolve dependencies between contracts
3. Compile them in the correct order
4. Output artifacts to `artifacts/`

### Compilation Options

```bash
# Force recompilation (ignore cache)
npx nightcap compile --force

# Generate TypeScript factory helpers
npx nightcap compile --generate-types
```

### Installing the Compact Compiler

If you don't have the Compact compiler installed, Nightcap will attempt to install it automatically. You can also install it manually:

```bash
npx nightcap compiler:install --compiler-version 0.26.0
```

List installed compilers:

```bash
npx nightcap compiler:list
```

## Deploying Contracts

Deploy your compiled contracts to a network:

```bash
# Deploy to local network
npx nightcap deploy

# Deploy to a specific network
npx nightcap deploy --network devnet
```

### Deployment Options

```bash
# Preview deployment without executing
npx nightcap deploy --dry-run

# Redeploy all contracts (ignore history)
npx nightcap deploy --reset
```

### Viewing Deployments

List deployed contracts:

```bash
npx nightcap deployments

# View specific contract
npx nightcap deployments --contract MyContract
```

## Hello World Walkthrough

Let's create a complete project from scratch:

### 1. Create the Project

```bash
mkdir my-counter
cd my-counter
pnpm init
pnpm add -D @nightcap/core
npx nightcap init --template basic --name my-counter --skip-install
```

### 2. Write a Contract

Edit `contracts/Counter.compact`:

```compact
pragma language_version = 0.26.0;

contract Counter {
  state {
    value: Integer;
  }

  constructor() {
    self.value = 0;
  }

  circuit increment() {
    self.value = self.value + 1;
  }

  circuit get_value() -> Integer {
    return self.value;
  }
}
```

### 3. Start the Network

```bash
npx nightcap node --detach
```

Wait for all services to start (check with `nightcap node:status`).

### 4. Compile the Contract

```bash
npx nightcap compile
```

### 5. Deploy the Contract

```bash
npx nightcap deploy
```

### 6. Verify Deployment

```bash
npx nightcap deployments
```

You should see your Counter contract listed with its address.

### 7. Clean Up

When you're done:

```bash
npx nightcap node:stop
```

## Next Steps

- Read the [Command Reference](./commands.md) for all available commands
- Learn about [Configuration](./configuration.md) options
- Explore [Plugin Development](./plugins.md) to extend Nightcap
- Check [Troubleshooting](./troubleshooting.md) if you encounter issues
