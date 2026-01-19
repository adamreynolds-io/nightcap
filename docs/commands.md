# Command Reference

This document covers all Nightcap CLI commands and their options.

## Global Options

These options are available for all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `--network <name>` | Network to use | `localnet` |
| `--verbose` | Enable verbose output | `false` |
| `--quiet` | Suppress non-essential output | `false` |
| `--config <path>` | Path to config file | Auto-detected |
| `-v, --version` | Output version number | - |
| `--help` | Display help | - |

## Project Commands

### init

Create a new Nightcap project.

```bash
nightcap init [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--template <type>` | string | Project template (`basic`, `dapp`, `library`) | Interactive |
| `--name <name>` | string | Project name | Interactive |
| `--force` | boolean | Overwrite existing files | `false` |
| `--skip-install` | boolean | Skip dependency installation | `false` |
| `--cli` | boolean | Include CLI interface (dapp template) | `false` |
| `--react` | boolean | Include React web app (dapp template) | `false` |
| `--from-contract <path>` | string | Path to compiled contract to scaffold from | - |

**Examples:**

```bash
# Interactive mode
nightcap init

# Create a basic project
nightcap init --template basic --name my-project

# Create a dApp with CLI and React
nightcap init --template dapp --name my-dapp --cli --react

# Scaffold from existing compiled contract
nightcap init --from-contract ./artifacts/MyContract
```

### doctor

Check system requirements and configuration.

```bash
nightcap doctor
```

Checks include:
- Node.js version (requires 20+)
- Docker installation and daemon status
- Required Docker images
- pnpm availability
- System memory (recommends 8+ GB)
- Disk space (recommends 20+ GB free)
- Registry connectivity
- Configuration validity

**Example output:**

```
Running Nightcap diagnostics...

[OK] Node.js: Node.js v20.10.0 installed
[OK] pnpm: pnpm 8.14.0 installed
[OK] Docker: Docker 24.0.7 installed and running
[WARN] Docker Images: 2 of 3 images missing
[OK] Configuration: Configuration valid, using network 'localnet'
[OK] System Memory: 16.0 GB total (8.2 GB available)
[OK] Disk Space: 156.3 GB available of 500.0 GB
[OK] Registry Connectivity: Container registries are reachable
```

## Network Commands

### node

Start the local Midnight development network.

```bash
nightcap node [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--pull` | boolean | Pull latest images before starting | `false` |
| `--reset` | boolean | Reset data volumes before starting | `false` |
| `--detach` | boolean | Run in background (detached mode) | `false` |

**Examples:**

```bash
# Start in foreground (Ctrl+C to stop)
nightcap node

# Start in background
nightcap node --detach

# Pull latest images and start fresh
nightcap node --pull --reset
```

### node:stop

Stop the local Midnight development network.

```bash
nightcap node:stop
```

### node:status

Show status of the local Midnight network.

```bash
nightcap node:status
```

**Example output:**

```
Midnight stack is running

Services:
  [OK] Node         running    http://localhost:9944
  [OK] Indexer      running    http://localhost:8088
  [OK] Proof Server running    http://localhost:6300
```

### node:logs

View logs from the local Midnight network.

```bash
nightcap node:logs [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--service <name>` | string | Service to show logs for (`node`, `indexer`, `proof-server`) | All services |
| `--follow` | boolean | Follow log output | `false` |
| `--tail <lines>` | number | Number of lines to show | `100` |

**Examples:**

```bash
# View last 100 lines from all services
nightcap node:logs

# Follow logs from the node service
nightcap node:logs --service node --follow

# View last 50 lines from indexer
nightcap node:logs --service indexer --tail 50
```

### node:reset

Reset local Midnight network data.

```bash
nightcap node:reset
```

This stops the network (if running) and removes all data volumes, giving you a fresh state.

### node:exec

Execute a command in a service container.

```bash
nightcap node:exec --service <name> --command <cmd>
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--service <name>` | string | Service to run command in (`node`, `indexer`, `proof-server`) | Yes |
| `--command <cmd>` | string | Command to execute | Yes |

**Examples:**

```bash
# Check node version
nightcap node:exec --service node --command "midnight-node --version"

# List files in container
nightcap node:exec --service indexer --command "ls -la"
```

> **Note:** Shell features like pipes, redirects, and command substitution are not supported. Commands are executed directly without a shell.

### node:snapshot

Create a snapshot of the local network state.

```bash
nightcap node:snapshot --name <snapshot-name>
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--name <name>` | string | Name for the snapshot | Yes |

**Example:**

```bash
nightcap node:snapshot --name before-test
```

### node:restore

Restore local network state from a snapshot.

```bash
nightcap node:restore --name <snapshot-name>
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--name <name>` | string | Name of the snapshot to restore | Yes |

**Example:**

```bash
nightcap node:restore --name before-test
nightcap node  # Start with restored state
```

### node:snapshots

List available state snapshots.

```bash
nightcap node:snapshots
```

**Example output:**

```
Found 2 snapshot(s):

  before-test          1/15/2025, 10:30:00 AM
  clean-state          1/14/2025, 3:45:00 PM
```

### node:snapshot:delete

Delete a state snapshot.

```bash
nightcap node:snapshot:delete --name <snapshot-name>
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--name <name>` | string | Name of the snapshot to delete | Yes |

## Proof Server Commands

For working with remote networks (devnet, testnet, mainnet), you need a local proof server. The proof server MUST run locally because it processes private transaction inputs. See [Architecture](./architecture.md) for details.

### proof-server

Start a local proof server for remote networks.

```bash
nightcap proof-server [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--node-url <url>` | string | WebSocket URL of node (overrides network config) | From network config |
| `--detach` | boolean | Run in background | `false` |
| `--image <image>` | string | Docker image to use | Latest proof-server image |
| `--port <number>` | number | Local port to expose | `6300` |

**Examples:**

```bash
# Connect to devnet
nightcap proof-server --network devnet

# Connect to custom node
nightcap proof-server --node-url wss://my-node.example.com

# Run in background
nightcap proof-server --network devnet --detach
```

### proof-server:stop

Stop the local proof server.

```bash
nightcap proof-server:stop
```

### proof-server:status

Show proof server status and health.

```bash
nightcap proof-server:status
```

**Example output:**

```
Proof server is running
URL: http://localhost:6300
Health: OK
```

### proof-server:logs

View proof server logs.

```bash
nightcap proof-server:logs [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--follow` | boolean | Follow log output | `false` |
| `--tail <lines>` | number | Number of lines to show | `100` |

**Examples:**

```bash
# View recent logs
nightcap proof-server:logs

# Follow log output
nightcap proof-server:logs --follow
```

## Compilation Commands

### compile

Compile Compact contracts.

```bash
nightcap compile [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--force` | boolean | Force recompilation, ignoring cache | `false` |
| `--generate-types` | boolean | Generate TypeScript factory helpers | `false` |
| `--error-format <format>` | string | Error output format (`human`, `gcc`, `json`, `vscode`) | `human` |

**Examples:**

```bash
# Compile with caching
nightcap compile

# Force recompilation
nightcap compile --force

# Generate TypeScript types
nightcap compile --generate-types

# Use VS Code-friendly error format
nightcap compile --error-format vscode
```

### clean

Remove compiled artifacts and cache.

```bash
nightcap clean [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--force` | boolean | Skip confirmation prompt | `false` |

**Example:**

```bash
nightcap clean --force
```

### compiler:list

List installed Compact compiler versions.

```bash
nightcap compiler:list
```

**Example output:**

```
Installed compilers:
  0.26.0 (default)
    /home/user/.nightcap/compilers/0.26.0/compactc
  0.25.0
    /home/user/.nightcap/compilers/0.25.0/compactc
```

### compiler:install

Install a Compact compiler version.

```bash
nightcap compiler:install --compiler-version <version> [options]
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--compiler-version <version>` | string | Compiler version to install (e.g., `0.26.0`) | Yes |
| `--prerelease` | boolean | Install from prerelease channel | `false` |

**Example:**

```bash
nightcap compiler:install --compiler-version 0.26.0
```

## Testing Commands

### test

Run contract tests using Vitest.

```bash
nightcap test [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--watch` | boolean | Run in watch mode | `false` |
| `--bail` | boolean | Stop on first test failure | `false` |
| `--grep <pattern>` | string | Filter tests by name pattern | - |
| `--reporter <format>` | string | Reporter format (`default`, `verbose`, `json`, `junit`) | `default` |
| `--coverage` | boolean | Enable code coverage | `false` |
| `--no-compile` | boolean | Skip contract compilation before testing | `false` |
| `--parallel` | boolean | Run tests in parallel | `true` |
| `--workers <count>` | number | Number of parallel workers | Auto |
| `--update` | boolean | Update snapshots | `false` |

**Examples:**

```bash
# Run all tests
nightcap test

# Run tests in watch mode
nightcap test --watch

# Run specific tests by name
nightcap test --grep "transfer"

# Run with coverage report
nightcap test --coverage

# Stop on first failure
nightcap test --bail

# Skip compilation (faster for iterating on tests)
nightcap test --no-compile
```

### coverage

Run tests with code coverage enabled.

```bash
nightcap coverage [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--threshold <percent>` | number | Minimum coverage threshold percentage | - |
| `--reporter <format>` | string | Coverage reporter (`text`, `lcov`, `html`, `json`) | `text` |

**Examples:**

```bash
# Run with coverage
nightcap coverage

# Require 80% coverage
nightcap coverage --threshold 80

# Generate HTML coverage report
nightcap coverage --reporter html
```

## Deployment Commands

### deploy

Deploy contracts to a network.

```bash
nightcap deploy [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--module <path>` | string | Path to deployment module | Auto-discovered |
| `--dry-run` | boolean | Preview deployment without executing | `false` |
| `--reset` | boolean | Ignore deployment history and redeploy all | `false` |
| `--confirm-mainnet` | boolean | Confirm deployment to mainnet | `false` |

**Examples:**

```bash
# Deploy to local network
nightcap deploy

# Deploy to devnet
nightcap deploy --network devnet

# Preview deployment
nightcap deploy --dry-run

# Force redeploy all contracts
nightcap deploy --reset

# Deploy to mainnet (with confirmation)
nightcap deploy --network mainnet --confirm-mainnet
```

### deployments

List deployed contracts for a network.

```bash
nightcap deployments [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--contract <name>` | string | Show details for a specific contract | All contracts |

**Examples:**

```bash
# List all deployments on current network
nightcap deployments

# List deployments on devnet
nightcap deployments --network devnet

# Show specific contract details
nightcap deployments --contract Counter
```

**Example output:**

```
Deployments on localnet:

  Counter
    Address:  0x1234567890abcdef...
    Deployed: 2025-01-15T10:30:00.000Z

  Token
    Address:  0xfedcba0987654321...
    Deployed: 2025-01-15T10:31:00.000Z
```

## Interactive Commands

### console

Open an interactive console for contract exploration and debugging.

```bash
nightcap console [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--network <name>` | string | Network to connect to | `localnet` |

**Examples:**

```bash
# Start console with default network
nightcap console

# Connect to devnet
nightcap console --network devnet
```

**Available in console:**

| Object/Function | Description |
|-----------------|-------------|
| `config` | Nightcap configuration object |
| `network` | Current network configuration |
| `networkName` | Name of the connected network |
| `contracts` | List of compiled contract names |
| `getContract(name)` | Get contract artifact by name |
| `listContracts()` | List all compiled contracts |
| `deployContract(name, args)` | Deploy a contract |
| `getContractAt(name, address)` | Connect to deployed contract |
| `getBalance(address)` | Get account balance |
| `getBlock(number?)` | Get block information |
| `help()` | Show available commands |

**REPL Commands:**

| Command | Description |
|---------|-------------|
| `.help` | Show REPL commands |
| `.exit` | Exit the console |
| `.clear` | Clear the screen |
| `.contracts` | List compiled contracts |
| `.network` | Show network info |

**Example session:**

```javascript
nightcap:localnet> contracts
['Counter', 'Token']

nightcap:localnet> const counter = getContract('Counter')
nightcap:localnet> await deployContract('Counter', [])
Deploying Counter... done
Contract deployed at: 0x1234...

nightcap:localnet> .network
Network: localnet
  Node URL: http://localhost:9944
  Indexer URL: http://localhost:8088/api/v1/graphql
  Proof Server: http://localhost:6300
  Local: true

nightcap:localnet> .exit
Goodbye!
```

> **Note:** Some helpers like `deployContract`, `getContractAt`, and `getBalance` require the midnight-js plugin for full functionality.

### run

Execute a standalone script with Nightcap context.

```bash
nightcap run --script <path> [options]
```

**Options:**

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `--script <path>` | string | Path to the script to execute | Yes |
| `--network <name>` | string | Network to use | No (default: `localnet`) |

**Examples:**

```bash
# Run a deployment script
nightcap run --script scripts/deploy.ts

# Run a script on devnet
nightcap run --script scripts/setup.ts --network devnet
```

**Script Context:**

Scripts can access Nightcap context in two ways:

1. **Export a default/main function** (recommended):
```typescript
// scripts/deploy.ts
export default async function(nightcap) {
  console.log(`Network: ${nightcap.networkName}`);
  console.log(`Node URL: ${nightcap.network.nodeUrl}`);

  // Get deployed contract address
  const tokenAddress = nightcap.getDeployedAddress('Token');
}
```

2. **Access global context**:
```typescript
// scripts/query.ts
const { config, network, networkName } = globalThis.nightcap;
console.log(`Connected to ${networkName}`);
```

**Available Context:**

| Property | Type | Description |
|----------|------|-------------|
| `config` | NightcapConfig | Full Nightcap configuration |
| `network` | NetworkConfig | Current network configuration |
| `networkName` | string | Name of the current network |
| `getDeployedAddress(name)` | function | Get deployed contract address |
| `log` | Logger | Logger instance for output |

## Shell Commands

### completion

Generate shell completion scripts.

```bash
nightcap completion <shell>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `shell` | Shell type: `bash`, `zsh`, `fish` |

**Installation:**

```bash
# Bash (add to ~/.bashrc)
nightcap completion bash >> ~/.bashrc

# Zsh (add to ~/.zshrc)
nightcap completion zsh >> ~/.zshrc

# Fish
nightcap completion fish > ~/.config/fish/completions/nightcap.fish
```
