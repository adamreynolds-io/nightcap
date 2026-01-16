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

### Requirement: Toolkit Integration
The system SHALL integrate midnight-node toolkit operations through an adapter layer accessible to all tasks.

#### Scenario: Access toolkit builder
- **WHEN** task needs to perform blockchain operations
- **THEN** toolkit builder is available through task context

#### Scenario: Configure toolkit source
- **WHEN** configuration specifies network source
- **THEN** toolkit source is configured accordingly for all operations

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
