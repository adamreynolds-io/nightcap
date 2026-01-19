## ADDED Requirements

### Requirement: Interactive Console Command
The system SHALL provide a `nightcap console` command that starts an interactive REPL for contract exploration and debugging.

#### Scenario: Start console with default network
- **WHEN** user runs `nightcap console`
- **THEN** start Node.js REPL connected to the default network
- **THEN** display welcome message with available utilities

#### Scenario: Start console with specific network
- **WHEN** user runs `nightcap console --network devnet`
- **THEN** start REPL connected to devnet
- **THEN** display connected network name

#### Scenario: Exit console
- **WHEN** user types `.exit` or presses Ctrl+D
- **THEN** gracefully close connections and exit

### Requirement: Pre-loaded Context
The console SHALL provide a pre-loaded context with Nightcap utilities and contract access.

#### Scenario: Access configuration
- **WHEN** user types `config` in console
- **THEN** display the loaded Nightcap configuration

#### Scenario: Access network info
- **WHEN** user types `network` in console
- **THEN** display current network name and URLs

#### Scenario: List available contracts
- **WHEN** user types `contracts` in console
- **THEN** display list of compiled contract names

### Requirement: Contract Interaction Helpers
The console SHALL provide helper functions for contract deployment and interaction.

#### Scenario: Get contract artifact
- **WHEN** user calls `getContract("Counter")`
- **THEN** return the compiled Counter contract artifact

#### Scenario: Deploy contract
- **WHEN** user calls `deployContract("Counter", [])`
- **THEN** deploy the contract to the connected network
- **THEN** return the deployed contract instance with address

#### Scenario: Connect to existing contract
- **WHEN** user calls `getContractAt("Counter", "0x123...")`
- **THEN** return contract instance connected to the address

### Requirement: Network Query Helpers
The console SHALL provide helpers for querying blockchain state.

#### Scenario: Query balance
- **WHEN** user calls `getBalance("0x123...")`
- **THEN** return the account balance

#### Scenario: Query block
- **WHEN** user calls `getBlock()` or `getBlock(number)`
- **THEN** return the latest or specified block information

### Requirement: Async Support
The console SHALL support top-level await for async operations.

#### Scenario: Await contract call
- **WHEN** user types `await contract.call.getValue()`
- **THEN** execute the async call and display the result

#### Scenario: Await deployment
- **WHEN** user types `const c = await deployContract("Counter", [])`
- **THEN** wait for deployment and assign result to variable

### Requirement: History and Completion
The console SHALL provide command history and auto-completion for improved usability.

#### Scenario: Command history
- **WHEN** user presses up arrow
- **THEN** cycle through previous commands

#### Scenario: History persistence
- **WHEN** user exits and restarts console
- **THEN** previous session history is available

#### Scenario: Auto-complete contract names
- **WHEN** user types `getCon` and presses Tab
- **THEN** complete to `getContract`

### Requirement: Help and Documentation
The console SHALL provide built-in help for available utilities.

#### Scenario: Display help
- **WHEN** user types `.help`
- **THEN** display list of available commands and utilities

#### Scenario: Utility documentation
- **WHEN** user types `help(deployContract)`
- **THEN** display usage information for the function
