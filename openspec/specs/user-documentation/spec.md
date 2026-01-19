# user-documentation Specification

## Purpose
TBD - created by archiving change add-user-documentation. Update Purpose after archive.
## Requirements
### Requirement: Documentation Structure
The project SHALL provide a `docs/` folder containing comprehensive user documentation with an index page linking to all sections.

#### Scenario: Documentation index exists
- **WHEN** a user navigates to the docs folder
- **THEN** they find a README.md with links to all documentation sections

### Requirement: Getting Started Guide
The documentation SHALL include a getting started guide covering installation, prerequisites, and a complete first project walkthrough.

#### Scenario: New user follows getting started
- **WHEN** a new user follows the getting started guide
- **THEN** they can install Nightcap, create a project, start the local network, compile contracts, and deploy

#### Scenario: Prerequisites are documented
- **WHEN** a user reads the prerequisites section
- **THEN** they see Node.js 20+, Docker, and pnpm listed with installation links

### Requirement: Command Reference
The documentation SHALL include a complete command reference documenting all CLI commands with their parameters, types, descriptions, defaults, and examples.

#### Scenario: All commands documented
- **WHEN** a user consults the command reference
- **THEN** they find documentation for all 19 CLI commands

#### Scenario: Global options documented
- **WHEN** a user looks for global options
- **THEN** they find --network, --verbose, --quiet, and --config documented

#### Scenario: Command parameters match implementation
- **WHEN** a developer compares docs to `nightcap --help`
- **THEN** the documented commands and parameters match the CLI output

### Requirement: Configuration Reference
The documentation SHALL include a configuration reference documenting all config file options with their types, defaults, and examples.

#### Scenario: Config interfaces documented
- **WHEN** a user reads the configuration reference
- **THEN** they find NightcapConfig, NetworkConfig, DockerConfig, CompactConfig, and PathsConfig documented

#### Scenario: Pre-configured networks listed
- **WHEN** a user looks for available networks
- **THEN** they find localnet, devnet, preview, preprod, and mainnet with their URLs

### Requirement: Plugin Development Guide
The documentation SHALL include a plugin development guide covering the plugin interface, hook handlers, task registration, and examples.

#### Scenario: Plugin interface documented
- **WHEN** a developer wants to create a plugin
- **THEN** they find the NightcapPlugin interface with id, dependencies, hookHandlers, and tasks fields

#### Scenario: Hook handlers explained
- **WHEN** a developer reads about hooks
- **THEN** they understand config hooks (extendUserConfig, validateUserConfig, resolveUserConfig) and runtime hooks (created)

#### Scenario: Complete plugin example provided
- **WHEN** a developer needs a reference implementation
- **THEN** they find a complete gas reporter plugin example

### Requirement: Troubleshooting Guide
The documentation SHALL include a troubleshooting guide covering common issues and their solutions.

#### Scenario: Docker issues addressed
- **WHEN** a user encounters Docker problems
- **THEN** they find solutions for daemon not running, images not found, port conflicts, and permissions

#### Scenario: Compilation issues addressed
- **WHEN** a user encounters compilation errors
- **THEN** they find solutions for compiler not found, syntax errors, and cache issues

#### Scenario: Diagnostics documented
- **WHEN** a user needs to diagnose their environment
- **THEN** they find instructions to run `nightcap doctor`

### Requirement: Package Documentation
Each package SHALL have a README documenting its purpose, installation, and basic usage with links to main documentation.

#### Scenario: nightcap-core has README
- **WHEN** a user views the nightcap-core package
- **THEN** they find a README with installation, usage, and documentation links

#### Scenario: docker-orchestrator has README
- **WHEN** a user views the docker-orchestrator package
- **THEN** they find a README with API reference for StackManager and related classes

### Requirement: Documentation Maintenance Guidelines
The project SHALL have guidelines requiring documentation updates when features are added or changed.

#### Scenario: CLAUDE.md has documentation rules
- **WHEN** a developer reads CLAUDE.md
- **THEN** they find guidelines specifying which docs to update for different types of changes

