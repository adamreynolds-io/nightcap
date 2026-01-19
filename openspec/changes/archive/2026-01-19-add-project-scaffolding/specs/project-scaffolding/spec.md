## Reference

Reference dApps for template structure:
- [example-counter](https://github.com/midnightntwrk/example-counter) - Basic dApp with contract and CLI
- [example-bboard](https://github.com/midnightntwrk/example-bboard) - Full dApp with contract, CLI, and React web UI

## ADDED Requirements

### Requirement: Project Initialization Command
The system SHALL provide a `nightcap init` command that creates a new Nightcap project with proper structure and configuration.

#### Scenario: Interactive initialization
- **WHEN** user runs `nightcap init` in empty directory
- **THEN** prompt for project name, template selection, and configuration options
- **THEN** generate project files based on selections

#### Scenario: Initialize with template flag
- **WHEN** user runs `nightcap init --template basic`
- **THEN** create project using basic template without interactive prompts

#### Scenario: Initialize in non-empty directory
- **WHEN** user runs `nightcap init` in directory with existing files
- **THEN** warn about existing files and prompt for confirmation
- **THEN** proceed only with explicit user consent

#### Scenario: Force initialization
- **WHEN** user runs `nightcap init --force`
- **THEN** overwrite existing files without confirmation prompt

### Requirement: Project Templates
The system SHALL provide multiple project templates for different use cases.

#### Scenario: Basic template
- **WHEN** user selects "basic" template
- **THEN** generate minimal project with single sample contract and test

#### Scenario: DApp template
- **WHEN** user selects "dapp" template
- **THEN** generate project with contract, tests, and TypeScript dApp scaffold
- **THEN** include midnight-js integration setup
- **THEN** prompt for interface selection (CLI, React, or both)

#### Scenario: DApp with CLI interface
- **WHEN** user selects "dapp" template with CLI interface
- **THEN** generate `src/cli.ts` with Commander.js scaffold
- **THEN** include commands for contract interaction (status, increment, decrement)
- **THEN** add `commander` dependency and `bin` entry in package.json

#### Scenario: DApp with React interface
- **WHEN** user selects "dapp" template with React interface
- **THEN** generate `web/` directory with Vite + React setup
- **THEN** include `web/src/App.tsx` with counter UI and wallet connection placeholder
- **THEN** add `npm run dev` and `npm run build:web` scripts

#### Scenario: DApp interface flags
- **WHEN** user runs `nightcap init --template dapp --cli`
- **THEN** generate dApp with CLI interface without prompting
- **WHEN** user runs `nightcap init --template dapp --react`
- **THEN** generate dApp with React interface without prompting
- **WHEN** user runs `nightcap init --template dapp --cli --react`
- **THEN** generate dApp with both interfaces without prompting

#### Scenario: Library template
- **WHEN** user selects "library" template
- **THEN** generate project structured for publishing reusable contracts
- **THEN** include package.json configured for npm publishing

### Requirement: Configuration File Generation
The system SHALL generate a properly configured `nightcap.config.ts` file.

#### Scenario: Generate config with defaults
- **WHEN** project is initialized
- **THEN** create `nightcap.config.ts` with local network and default compiler settings

#### Scenario: Include testnet configuration
- **WHEN** project is initialized
- **THEN** include commented testnet network configuration as example

### Requirement: Sample Contract Generation
The system SHALL generate sample Compact contracts appropriate to the selected template.

#### Scenario: Generate counter contract
- **WHEN** basic or dapp template is selected
- **THEN** generate `contracts/Counter.compact` with increment/decrement/get operations

#### Scenario: Generate contract with token example
- **WHEN** dapp template is selected
- **THEN** generate additional token contract example demonstrating shielded transfers

### Requirement: Test File Generation
The system SHALL generate sample test files that demonstrate testing patterns.

#### Scenario: Generate basic tests
- **WHEN** project is initialized
- **THEN** generate `test/Counter.test.ts` with example test cases

#### Scenario: Tests use local network
- **WHEN** sample tests are generated
- **THEN** tests are configured to run against local Nightcap network

### Requirement: Dependency Management
The system SHALL handle project dependency installation.

#### Scenario: Auto-detect package manager
- **WHEN** project is initialized
- **THEN** detect if yarn.lock, pnpm-lock.yaml, or package-lock.json exists in parent directories
- **THEN** use corresponding package manager, defaulting to npm

#### Scenario: Install dependencies
- **WHEN** project files are generated
- **THEN** automatically run package manager install

#### Scenario: Skip installation
- **WHEN** user runs `nightcap init --skip-install`
- **THEN** generate files but do not run dependency installation

### Requirement: Contract-Based Scaffolding
The system SHALL support scaffolding a new project from an existing compiled contract.

#### Scenario: Initialize from compiled contract
- **WHEN** user runs `nightcap init --from-contract <path>`
- **THEN** load the compiled contract from the specified path
- **THEN** extract circuit information from the contract
- **THEN** generate project with contract-aware scaffolding
- **THEN** copy compiled artifacts to the new project

#### Scenario: Generate circuit handlers
- **WHEN** initializing from a compiled contract
- **THEN** generate `src/circuits/{circuitName}.ts` for each impure circuit
- **THEN** include typed interface placeholders for parameters and results
- **THEN** generate `src/circuits/index.ts` that re-exports all handlers

#### Scenario: Generate contract wrapper
- **WHEN** initializing from a compiled contract
- **THEN** generate `src/contract.ts` with typed contract wrapper
- **THEN** include connection utilities and type definitions
- **THEN** re-export the compiled contract module

#### Scenario: Derive project name from contract
- **WHEN** user runs `nightcap init --from-contract <path>` without `--name`
- **THEN** derive project name from contract name in camelCase
- **WHEN** user provides `--name` flag
- **THEN** use the provided name instead

#### Scenario: Invalid contract path
- **WHEN** user runs `nightcap init --from-contract <invalid-path>`
- **THEN** display error message indicating path does not contain valid compiled contract
- **THEN** suggest expected structure (index.cjs in contract/ subdirectory)

### Requirement: Project Documentation
The system SHALL generate helpful documentation files.

#### Scenario: Generate README
- **WHEN** project is initialized
- **THEN** generate README.md with project description, quickstart commands, and links to documentation

#### Scenario: Generate gitignore
- **WHEN** project is initialized
- **THEN** generate .gitignore excluding node_modules, artifacts, cache, and environment files
