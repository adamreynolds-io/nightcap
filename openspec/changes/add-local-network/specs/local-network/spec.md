## ADDED Requirements

### Requirement: Node Command
The system SHALL provide a `nightcap node` command that starts a local Midnight Docker stack for development.

#### Scenario: Start local stack
- **WHEN** user runs `nightcap node`
- **THEN** pull required Docker images if not present
- **THEN** start midnight-node, proof-server, indexer containers
- **THEN** display service URLs (RPC, GraphQL, proof server)
- **THEN** display pre-funded account addresses

#### Scenario: Custom ports
- **WHEN** user runs `nightcap node --rpc-port 9933 --indexer-port 8080`
- **THEN** start stack with specified port mappings

#### Scenario: Stack already running
- **WHEN** user runs `nightcap node` and containers are already running
- **THEN** display status of running services
- **THEN** offer to restart or attach to logs

#### Scenario: Docker not available
- **WHEN** Docker is not installed or not running
- **THEN** display clear error with installation instructions

### Requirement: Docker Stack Management
The system SHALL orchestrate multiple Docker containers as a unified development environment.

#### Scenario: Container orchestration
- **WHEN** `nightcap node` starts
- **THEN** create shared Docker network `nightcap-network`
- **THEN** start containers in dependency order (node first, then indexer)

#### Scenario: Stop stack
- **WHEN** user runs `nightcap node stop`
- **THEN** gracefully stop all Nightcap containers
- **THEN** preserve data volumes for next startup

#### Scenario: View logs
- **WHEN** user runs `nightcap node logs`
- **THEN** tail combined logs from all services
- **WHEN** user runs `nightcap node logs node`
- **THEN** tail logs from only the specified service

#### Scenario: Stack status
- **WHEN** user runs `nightcap node status`
- **THEN** display running/stopped state of each service
- **THEN** display port mappings and resource usage

### Requirement: Development Accounts
The system SHALL provide pre-funded accounts for development and testing.

#### Scenario: Default accounts
- **WHEN** local network starts
- **THEN** create 10 accounts with known private keys
- **THEN** fund each with shielded and unshielded DUST tokens

#### Scenario: Display account info
- **WHEN** local network starts
- **THEN** display account addresses and private keys
- **THEN** warn that these keys are for development only

#### Scenario: Custom account configuration
- **WHEN** configuration specifies custom accounts
- **THEN** use configured accounts instead of defaults

### Requirement: State Snapshots
The system SHALL support saving and restoring network state.

#### Scenario: Create snapshot
- **WHEN** user calls snapshot API or task
- **THEN** capture current network state
- **THEN** return snapshot identifier

#### Scenario: Revert to snapshot
- **WHEN** user calls revert with snapshot ID
- **THEN** restore network to state at snapshot time
- **THEN** invalidate later snapshots

#### Scenario: Reset to genesis
- **WHEN** user calls reset API or runs `nightcap node --reset`
- **THEN** restore network to initial genesis state

### Requirement: Network Forking
The system SHALL support forking from live networks for testing against real state.

#### Scenario: Fork from testnet
- **WHEN** user runs `nightcap node --fork testnet`
- **THEN** start local network with state forked from testnet

#### Scenario: Fork at specific block
- **WHEN** user runs `nightcap node --fork testnet --fork-block 12345`
- **THEN** fork state as of specified block number

#### Scenario: Cache forked state
- **WHEN** fork mode is active
- **THEN** cache fetched remote state locally
- **THEN** reuse cache on subsequent requests

### Requirement: Local Proof Server
The system SHALL provide integrated proof generation for local development.

#### Scenario: Auto-start proof server
- **WHEN** local network starts
- **THEN** start local proof server automatically
- **THEN** configure toolkit to use local prover

#### Scenario: Fast proof mode
- **WHEN** running in development mode
- **THEN** use faster (less secure) proof parameters
- **THEN** warn that proofs are not production-grade

### Requirement: RPC Interface
The system SHALL expose a JSON-RPC interface compatible with Midnight tooling.

#### Scenario: Standard RPC methods
- **WHEN** local network is running
- **THEN** respond to standard Midnight RPC methods

#### Scenario: Development RPC methods
- **WHEN** local network is running
- **THEN** provide additional methods: `nightcap_snapshot`, `nightcap_revert`, `nightcap_reset`, `nightcap_mine`

### Requirement: Transaction Logging
The system SHALL provide detailed logging for debugging transactions.

#### Scenario: Log transactions
- **WHEN** transaction is submitted
- **THEN** log transaction details including sender, contract, and method

#### Scenario: Verbose mode
- **WHEN** node started with `--verbose`
- **THEN** log ZK proof generation progress
- **THEN** log state transitions and storage changes

#### Scenario: Log to file
- **WHEN** node started with `--log-file path`
- **THEN** write logs to specified file
