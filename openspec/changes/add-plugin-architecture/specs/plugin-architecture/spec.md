## ADDED Requirements

### Requirement: Plugin Registration
The system SHALL support plugin registration through configuration file imports.

#### Scenario: Register npm plugin
- **WHEN** config imports `import "@nightcap/plugin-midnight-js"`
- **THEN** load and register the plugin

#### Scenario: Register local plugin
- **WHEN** config imports `import "./plugins/my-plugin"`
- **THEN** load and register the local plugin file

#### Scenario: Plugin load order
- **WHEN** multiple plugins are imported
- **THEN** load plugins in import order

### Requirement: Plugin Lifecycle
The system SHALL invoke plugin lifecycle hooks at appropriate times.

#### Scenario: Plugin setup
- **WHEN** Nightcap initializes
- **THEN** call `setup()` on each registered plugin

#### Scenario: Plugin dependencies
- **WHEN** plugin A depends on plugin B
- **THEN** load plugin B before plugin A
- **THEN** error if dependency not satisfied

### Requirement: Task Extension
The system SHALL allow plugins to add and override tasks.

#### Scenario: Add new task
- **WHEN** plugin defines new task
- **THEN** task is available via CLI

#### Scenario: Override existing task
- **WHEN** plugin overrides built-in task
- **THEN** plugin task executes instead of built-in
- **THEN** plugin can call `runSuper()` to invoke original

#### Scenario: Task dependencies from plugin
- **WHEN** plugin task depends on built-in task
- **THEN** dependency is resolved and executed

### Requirement: Configuration Extension
The system SHALL allow plugins to extend the configuration schema.

#### Scenario: Add config section
- **WHEN** plugin extends config with new section
- **THEN** new section is available in config file
- **THEN** new section is type-checked

#### Scenario: Validate plugin config
- **WHEN** plugin config section has validation rules
- **THEN** validate config values at load time
- **THEN** error with clear message if validation fails

### Requirement: Runtime Extension
The system SHALL allow plugins to extend the runtime environment.

#### Scenario: Add runtime property
- **WHEN** plugin adds property to runtime
- **THEN** property is accessible in tasks and scripts

#### Scenario: midnight-js runtime extensions
- **WHEN** midnight-js plugin is loaded
- **THEN** `nightcap.midnight` namespace is available
- **THEN** contains contract factories, providers, and utilities

### Requirement: midnight-js Contract Integration
The midnight-js plugin SHALL provide typed contract interaction.

#### Scenario: Get contract factory
- **WHEN** code calls `nightcap.midnight.getContractFactory("Counter")`
- **THEN** return typed factory for compiled Counter contract

#### Scenario: Deploy contract via plugin
- **WHEN** code calls `factory.deploy(args)`
- **THEN** deploy contract using midnight-js
- **THEN** return typed contract instance

#### Scenario: Connect to existing contract
- **WHEN** code calls `nightcap.midnight.getContractAt("Counter", address)`
- **THEN** return typed contract instance connected to address

### Requirement: midnight-js Provider Integration
The midnight-js plugin SHALL configure and expose midnight-js providers.

#### Scenario: Indexer provider
- **WHEN** midnight-js plugin is loaded
- **THEN** `nightcap.midnight.indexer` provides blockchain query access

#### Scenario: Proof server provider
- **WHEN** midnight-js plugin is loaded
- **THEN** `nightcap.midnight.proofServer` provides ZK proof generation

#### Scenario: Private state provider
- **WHEN** midnight-js plugin is loaded
- **THEN** `nightcap.midnight.privateState` provides encrypted state storage

#### Scenario: ZK config provider
- **WHEN** midnight-js plugin is loaded
- **THEN** `nightcap.midnight.zkConfig` provides circuit artifact retrieval

### Requirement: Plugin Type Augmentation
The system SHALL support TypeScript type augmentation for plugins.

#### Scenario: Augment config types
- **WHEN** plugin provides type definitions
- **THEN** configuration file has autocomplete for plugin options

#### Scenario: Augment runtime types
- **WHEN** plugin extends runtime
- **THEN** TypeScript recognizes plugin additions on runtime object

### Requirement: Plugin Development Support
The system SHALL provide utilities for plugin development.

#### Scenario: Plugin template
- **WHEN** developer runs `nightcap init --template plugin`
- **THEN** generate plugin project scaffold

#### Scenario: Plugin type exports
- **WHEN** developer creates plugin
- **THEN** can import `NightcapPlugin`, `TaskDefinition` types from core

### Requirement: Plugin Error Handling
The system SHALL handle plugin errors gracefully.

#### Scenario: Plugin load failure
- **WHEN** plugin fails to load
- **THEN** display error with plugin name and cause
- **THEN** suggest checking plugin installation

#### Scenario: Plugin runtime error
- **WHEN** plugin throws error during execution
- **THEN** include plugin name in error stack trace
- **THEN** continue execution of other plugins if possible
