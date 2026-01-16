## ADDED Requirements

### Requirement: Deployment Modules
The system SHALL support declarative deployment modules that define contract deployments and their dependencies.

#### Scenario: Define deployment module
- **WHEN** developer creates `ignition/modules/MyModule.ts`
- **THEN** module exports deployment configuration
- **THEN** module is discoverable by deploy task

#### Scenario: Module with dependencies
- **WHEN** contract B depends on contract A's address
- **THEN** module expresses this dependency
- **THEN** deployment system deploys A before B

#### Scenario: Module parameters
- **WHEN** module defines configurable parameters
- **THEN** parameters can be provided via CLI or config file

### Requirement: Deploy Task
The system SHALL provide a `nightcap deploy` task for executing deployments to any configured network.

#### Scenario: Deploy to localnet (default)
- **WHEN** user runs `nightcap deploy ignition/modules/MyModule.ts`
- **THEN** deploy to localnet (Docker stack)

#### Scenario: Deploy to internal networks
- **WHEN** user runs `nightcap deploy --network devnet` or `--network qanet`
- **THEN** deploy to specified internal development network

#### Scenario: Deploy to public testnets
- **WHEN** user runs `nightcap deploy --network preview` or `--network preprod`
- **THEN** display deployment summary with network name
- **THEN** prompt for confirmation before deployment

#### Scenario: Deploy to mainnet
- **WHEN** user runs `nightcap deploy --network mainnet`
- **THEN** display prominent warning about mainnet deployment
- **THEN** require explicit `--confirm-mainnet` flag or interactive confirmation
- **THEN** verify wallet has sufficient funds before proceeding

#### Scenario: Mainnet not available
- **WHEN** user attempts mainnet deployment before mainnet launch
- **THEN** display error indicating mainnet is not yet available

#### Scenario: Dry run deployment
- **WHEN** user runs `nightcap deploy --dry-run ignition/modules/MyModule.ts`
- **THEN** simulate deployment without executing transactions
- **THEN** display deployment plan and estimated costs

#### Scenario: Deployment confirmation
- **WHEN** deploying to non-localnet network
- **THEN** display deployment summary and prompt for confirmation

### Requirement: Toolkit Contract Integration
The system SHALL use midnight-node toolkit for contract deployment operations.

#### Scenario: Deploy contract
- **WHEN** deployment module specifies contract to deploy
- **THEN** use toolkit contract-simple deploy builder
- **THEN** handle proof generation for deployment transaction

#### Scenario: Deploy to localnet
- **WHEN** deploying to localnet
- **THEN** use toolkit container connected to local Docker stack
- **THEN** use local proof-server for proof generation

#### Scenario: Deploy to remote network
- **WHEN** deploying to devnet, qanet, preview, preprod, or mainnet
- **THEN** use toolkit container only (no local node/indexer needed)
- **THEN** toolkit connects to remote node, indexer, and proof-server URLs

#### Scenario: Call contract during deployment
- **WHEN** deployment requires initialization call
- **THEN** use toolkit contract-simple call builder
- **THEN** execute initialization in same deployment flow

#### Scenario: Configure deployment authority
- **WHEN** contract requires authority keys
- **THEN** configure authority from deployment signer or config

### Requirement: Deployment History
The system SHALL track deployment history for each network.

#### Scenario: Record deployment
- **WHEN** contract is successfully deployed
- **THEN** record contract address, transaction hash, and timestamp
- **THEN** store deployment artifacts and constructor arguments

#### Scenario: List deployments
- **WHEN** user runs `nightcap deployments`
- **THEN** display deployed contracts for current network

#### Scenario: Get deployed address
- **WHEN** user runs `nightcap deployments --contract Counter`
- **THEN** display address of deployed Counter contract

#### Scenario: Deployment history file
- **WHEN** deployments are recorded
- **THEN** store in `deployments/<network>/` directory
- **THEN** files are JSON format suitable for version control

### Requirement: Idempotent Deployment
The system SHALL support idempotent deployments that skip already-deployed contracts.

#### Scenario: Skip deployed contract
- **WHEN** module includes already-deployed contract
- **THEN** skip deployment and use recorded address

#### Scenario: Force redeploy
- **WHEN** user runs `nightcap deploy --reset`
- **THEN** ignore deployment history and redeploy all contracts

#### Scenario: Detect changed contract
- **WHEN** contract bytecode differs from deployed version
- **THEN** warn user about mismatch
- **THEN** prompt for redeploy or skip

### Requirement: Contract Maintenance Operations
The system SHALL support contract maintenance through toolkit integration.

#### Scenario: Update authority
- **WHEN** user runs `nightcap maintain --update-authority <contract> <new-authority>`
- **THEN** execute authority update through toolkit

#### Scenario: Update verifier keys
- **WHEN** user runs `nightcap maintain --update-verifier <contract>`
- **THEN** update contract verifier keys through toolkit

### Requirement: Deployment Scripts
The system SHALL support imperative deployment scripts for complex scenarios.

#### Scenario: Run deployment script
- **WHEN** user runs `nightcap run scripts/deploy.ts`
- **THEN** execute script with network context and helpers

#### Scenario: Script context
- **WHEN** deployment script runs
- **THEN** provide access to signers, network config, and deployment helpers

#### Scenario: Script with arguments
- **WHEN** user runs `nightcap run scripts/deploy.ts --arg1 value`
- **THEN** pass arguments to script

### Requirement: Deployment Verification
The system SHALL support contract verification after deployment.

#### Scenario: Verify contract
- **WHEN** user runs `nightcap verify <address>`
- **THEN** verify contract source matches deployed bytecode

#### Scenario: Auto-verify
- **WHEN** configuration enables auto-verification
- **THEN** automatically verify contracts after deployment

### Requirement: Multi-Network Deployment
The system SHALL support deploying to multiple networks in sequence.

#### Scenario: Deploy to multiple networks
- **WHEN** user runs `nightcap deploy --network preview,preprod`
- **THEN** deploy to each network in order
- **THEN** track deployments separately per network

#### Scenario: Progressive deployment pipeline
- **WHEN** user runs `nightcap deploy --network devnet,qanet,preview`
- **THEN** deploy to devnet first
- **THEN** prompt for confirmation before proceeding to qanet
- **THEN** prompt for confirmation before proceeding to preview

#### Scenario: Network-specific parameters
- **WHEN** deployment parameters vary by network
- **THEN** module can specify network-specific values

### Requirement: Network Environment Support
The system SHALL support all Midnight network environments.

#### Scenario: Supported networks
- **WHEN** user configures networks
- **THEN** support localnet (Docker-based local development)
- **THEN** support devnet (internal development)
- **THEN** support qanet (internal QA testing)
- **THEN** support preview (public testnet)
- **THEN** support preprod (public pre-production)
- **THEN** support mainnet (public production, when available)

#### Scenario: Network detection
- **WHEN** connecting to a network
- **THEN** verify network ID matches expected configuration
- **THEN** warn if network ID mismatch detected

#### Scenario: Deployment history per network
- **WHEN** contracts are deployed
- **THEN** store deployment records in `deployments/<network-name>/`
- **THEN** maintain separate history for each network environment
