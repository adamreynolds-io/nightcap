## ADDED Requirements

### Requirement: CLI Entry Point
The system SHALL provide a `nightcap` command-line executable that serves as the main entry point for all development operations.

#### Scenario: Display help information
- **WHEN** user runs `nightcap --help`
- **THEN** display list of available tasks with descriptions

#### Scenario: Display version
- **WHEN** user runs `nightcap --version`
- **THEN** display current Nightcap version and toolkit version

#### Scenario: Unknown command
- **WHEN** user runs `nightcap <unknown-task>`
- **THEN** display error message with suggestion of similar tasks

#### Scenario: Shell completion
- **WHEN** user runs `nightcap completion <shell>`
- **THEN** output shell completion script for the specified shell (bash, zsh, fish)

### Requirement: Configuration Loading
The system SHALL load configuration from `nightcap.config.ts` (or `.js`, `.mjs`) in the project root directory.

#### Scenario: Load TypeScript config
- **WHEN** `nightcap.config.ts` exists in project root
- **THEN** load and parse configuration with TypeScript support

#### Scenario: Missing configuration
- **WHEN** no configuration file exists
- **THEN** use sensible defaults and display informational message

#### Scenario: Invalid configuration
- **WHEN** configuration file has syntax or validation errors
- **THEN** display clear error message with line number and fix suggestion

#### Scenario: Custom config path
- **WHEN** user runs `nightcap --config <path> <task>`
- **THEN** load configuration from the specified path

### Requirement: Network Configuration
The system SHALL support multiple network environments via configuration.

#### Scenario: Select network
- **WHEN** user runs `nightcap --network <name> <task>`
- **THEN** execute task against the specified network

#### Scenario: Default network
- **WHEN** no network is specified
- **THEN** use `localnet` or configured `defaultNetwork`

#### Scenario: Unknown network
- **WHEN** user specifies an unknown network name
- **THEN** display error with list of available networks

### Requirement: Task Execution System
The system SHALL provide a task-based execution model where each command runs a named task with optional parameters.

#### Scenario: Run built-in task
- **WHEN** user runs `nightcap <task-name>`
- **THEN** execute the registered task with default parameters

#### Scenario: Run task with parameters
- **WHEN** user runs `nightcap <task-name> --param value`
- **THEN** execute task with provided parameters overriding defaults

#### Scenario: Task dependency execution
- **WHEN** task A depends on task B
- **THEN** execute task B before task A automatically

### Requirement: Task Registration
The system SHALL allow custom tasks to be registered via configuration file and plugins.

#### Scenario: Register custom task in config
- **WHEN** configuration contains custom task definition
- **THEN** task is available via CLI with specified name

#### Scenario: Override built-in task
- **WHEN** custom task has same name as built-in task
- **THEN** custom task takes precedence with access to original via `runSuper()`

### Requirement: Built-in Tasks - Project Initialization
The system SHALL provide project scaffolding capabilities.

#### Scenario: Initialize new project
- **WHEN** user runs `nightcap init`
- **THEN** create project structure with configuration files and templates

#### Scenario: Initialize with template
- **WHEN** user runs `nightcap init --template <name>`
- **THEN** scaffold project using the specified template (cli, react)

#### Scenario: Initialize with package manager
- **WHEN** user runs `nightcap init --package-manager <pm>`
- **THEN** use specified package manager (npm, pnpm, yarn, bun)

### Requirement: Built-in Tasks - Environment Diagnostics
The system SHALL provide environment health checking.

#### Scenario: Run diagnostics
- **WHEN** user runs `nightcap doctor`
- **THEN** check Docker installation, required images, network connectivity, and system resources

#### Scenario: Diagnostics with fixes
- **WHEN** diagnostics find issues
- **THEN** display actionable fix suggestions for each problem

### Requirement: Built-in Tasks - Local Node Management
The system SHALL provide Docker-based local Midnight node management.

#### Scenario: Start local node
- **WHEN** user runs `nightcap node`
- **THEN** start the local Midnight Docker stack (node, indexer, proof-server)

#### Scenario: Start node detached
- **WHEN** user runs `nightcap node --detach`
- **THEN** start the node in background and return immediately

#### Scenario: Stop local node
- **WHEN** user runs `nightcap node:stop`
- **THEN** gracefully stop all local node containers

#### Scenario: Check node status
- **WHEN** user runs `nightcap node:status`
- **THEN** display running status of all node components

#### Scenario: View node logs
- **WHEN** user runs `nightcap node:logs`
- **THEN** stream logs from node containers

#### Scenario: View specific service logs
- **WHEN** user runs `nightcap node:logs --service <name>`
- **THEN** stream logs from the specified service only

#### Scenario: Reset node state
- **WHEN** user runs `nightcap node:reset`
- **THEN** stop containers and remove all persisted state/volumes

#### Scenario: Execute command in container
- **WHEN** user runs `nightcap node:exec --service <name> -- <command>`
- **THEN** execute the command inside the specified container

### Requirement: Built-in Tasks - Contract Compilation
The system SHALL provide Compact contract compilation capabilities.

#### Scenario: Compile contracts
- **WHEN** user runs `nightcap compile`
- **THEN** compile all Compact contracts in the configured source directory

#### Scenario: Clean build artifacts
- **WHEN** user runs `nightcap clean`
- **THEN** remove all compiled artifacts from the output directory

#### Scenario: List compiler versions
- **WHEN** user runs `nightcap compiler:list`
- **THEN** display available compactc versions (installed and remote)

#### Scenario: Install compiler
- **WHEN** user runs `nightcap compiler:install --version <version>`
- **THEN** download and install the specified compactc version

### Requirement: Toolkit Integration
The system SHALL integrate midnight-node toolkit operations through an adapter layer accessible to all tasks.

#### Scenario: Access toolkit builder
- **WHEN** task needs to perform blockchain operations
- **THEN** toolkit builder is available through task context

#### Scenario: Configure toolkit source
- **WHEN** configuration specifies network source
- **THEN** toolkit source is configured accordingly for all operations

#### Scenario: Toolkit via Docker
- **WHEN** Docker is available
- **THEN** execute toolkit operations via Docker container with volume mounts

#### Scenario: Toolkit native fallback
- **WHEN** Docker is unavailable but native toolkit binary exists
- **THEN** fall back to native binary execution

### Requirement: Output Control
The system SHALL support configurable output verbosity for different use cases.

#### Scenario: Verbose mode
- **WHEN** user runs `nightcap --verbose <task>`
- **THEN** display detailed progress and debug information

#### Scenario: Quiet mode
- **WHEN** user runs `nightcap --quiet <task>`
- **THEN** suppress non-essential output, only show errors and final result

#### Scenario: CI mode
- **WHEN** `CI=true` environment variable is set
- **THEN** disable interactive prompts and colored output

#### Scenario: Colored output
- **WHEN** running in a TTY terminal
- **THEN** display colored output with progress indicators

### Requirement: Docker Orchestration
The system SHALL manage Docker containers for local development via the `@nightcap/docker-orchestrator` package.

#### Scenario: Generate compose file
- **WHEN** starting local node
- **THEN** generate docker-compose.yml with correct image versions and configuration

#### Scenario: Pull images with progress
- **WHEN** required images are not present
- **THEN** pull images with progress reporting

#### Scenario: Container lifecycle
- **WHEN** managing containers
- **THEN** support start, stop, logs, and exec operations

#### Scenario: Version sets
- **WHEN** configuring local stack
- **THEN** use tested version sets ensuring compatibility between node, toolkit, indexer, and proof-server
