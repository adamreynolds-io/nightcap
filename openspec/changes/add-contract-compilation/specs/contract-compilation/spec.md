## Reference

Reference repositories for valid Compact contract syntax (compactc 0.25.0+):
- [example-counter](https://github.com/midnightntwrk/example-counter) - Simple counter contract
- [example-bboard](https://github.com/midnightntwrk/example-bboard) - Bulletin board contract with more complex state

## ADDED Requirements

### Requirement: Compile Task
The system SHALL provide a `nightcap compile` task that compiles all Compact contracts in the project.

#### Scenario: Compile all contracts
- **WHEN** user runs `nightcap compile`
- **THEN** discover all `.compact` files in configured source directories
- **THEN** compile each contract and generate artifacts

#### Scenario: Compile with no changes
- **WHEN** user runs `nightcap compile` and no source files have changed
- **THEN** skip compilation and display "Nothing to compile" message

#### Scenario: Force recompilation
- **WHEN** user runs `nightcap compile --force`
- **THEN** recompile all contracts regardless of cache state

#### Scenario: Compile specific file
- **WHEN** user runs `nightcap compile contracts/MyContract.compact`
- **THEN** compile only the specified contract and its dependencies

### Requirement: Contract Source Discovery
The system SHALL automatically discover Compact contract sources based on configuration.

#### Scenario: Default source directory
- **WHEN** no source paths configured
- **THEN** search for `.compact` files in `./contracts` directory

#### Scenario: Custom source directories
- **WHEN** configuration specifies `compact.sources: ["./src", "./lib"]`
- **THEN** search for contracts in all specified directories

#### Scenario: Exclude patterns
- **WHEN** configuration specifies `compact.exclude: ["**/test/**"]`
- **THEN** skip matching files during discovery

### Requirement: Contract Dependency Resolution
The system SHALL resolve dependencies between contracts and compile them in correct order.

#### Scenario: Parse imports
- **WHEN** contract contains `import "path/to/other.compact";`
- **THEN** identify the import as a local dependency

#### Scenario: Parse standard library imports
- **WHEN** contract contains `import CompactStandardLibrary;`
- **THEN** recognize as standard library import (not a local file)

#### Scenario: Compile in dependency order
- **WHEN** contract A imports contract B
- **THEN** compile contract B before contract A

#### Scenario: Detect circular dependencies
- **WHEN** contracts have circular imports
- **THEN** report error with list of contracts in cycle

#### Scenario: Missing dependency
- **WHEN** contract imports non-existent file
- **THEN** report error with missing file path

### Requirement: Version Compatibility Checking
The system SHALL verify compiler version matches contract requirements.

#### Scenario: Parse pragma language_version
- **WHEN** contract contains `pragma language_version 0.19;`
- **THEN** record exact version requirement

#### Scenario: Parse minimum version pragma
- **WHEN** contract contains `pragma language_version >= 0.19;`
- **THEN** record minimum version requirement

#### Scenario: Version mismatch warning
- **WHEN** compiler version doesn't satisfy contract's language_version pragma
- **THEN** display warning with version mismatch details

#### Scenario: Missing version pragma
- **WHEN** contract has no pragma language_version
- **THEN** display warning recommending version pragma

### Requirement: Artifact Generation
The system SHALL generate compilation artifacts in a structured format.

#### Scenario: Generate contract artifacts
- **WHEN** contract compiles successfully
- **THEN** generate artifact file in `artifacts/<ContractName>.json`
- **THEN** include compiled bytecode, circuit data, and contract interface

#### Scenario: Generate ZK artifacts
- **WHEN** contract compiles successfully
- **THEN** generate zero-knowledge circuit files required for proof generation

#### Scenario: Preserve source metadata
- **WHEN** artifacts are generated
- **THEN** include source file path, compiler version, and compilation timestamp

### Requirement: TypeScript Type Generation
The system SHALL generate TypeScript declaration files for type-safe contract interaction.

#### Scenario: Generate contract types
- **WHEN** compilation succeeds
- **THEN** generate TypeScript interfaces in `artifacts/types/<ContractName>.d.ts`

#### Scenario: Generate contract factory
- **WHEN** compilation succeeds
- **THEN** generate typed factory class for contract deployment and connection

#### Scenario: Types compatible with midnight-js
- **WHEN** TypeScript types are generated
- **THEN** types are compatible with midnight-js contract interaction patterns

### Requirement: Compilation Caching
The system SHALL cache compilation results to avoid redundant work.

#### Scenario: Cache hit
- **WHEN** source file unchanged since last compilation
- **THEN** use cached artifacts instead of recompiling

#### Scenario: Cache invalidation on source change
- **WHEN** source file content changes
- **THEN** invalidate cache for that contract and dependents

#### Scenario: Cache invalidation on compiler change
- **WHEN** compiler version changes in configuration
- **THEN** invalidate entire cache and recompile all contracts

### Requirement: Compilation Error Reporting
The system SHALL provide clear, actionable error messages for compilation failures.

#### Scenario: Syntax error
- **WHEN** contract has syntax error
- **THEN** display error message with file path, line number, and column
- **THEN** show relevant source code snippet with error highlighted

#### Scenario: Type error
- **WHEN** contract has type mismatch
- **THEN** display expected type, actual type, and location

#### Scenario: Multiple errors
- **WHEN** compilation produces multiple errors
- **THEN** display all errors, not just the first one

### Requirement: Clean Task
The system SHALL provide a task to clean compilation artifacts and cache.

#### Scenario: Clean all artifacts
- **WHEN** user runs `nightcap clean`
- **THEN** remove all files from `artifacts/` directory
- **THEN** clear compilation cache

#### Scenario: Clean with confirmation
- **WHEN** user runs `nightcap clean` interactively
- **THEN** display list of directories to be cleaned
- **THEN** prompt for confirmation before deletion

### Requirement: Compiler Version Management
The system SHALL support configurable compiler versions via the `compactc` binary.

#### Scenario: Specify compiler version
- **WHEN** configuration specifies `compact.version: "0.26.0"`
- **THEN** use specified compactc version for compilation

#### Scenario: Detect installed compiler
- **WHEN** compactc is installed in PATH
- **THEN** detect and display version on `nightcap compile`

#### Scenario: Auto-download compiler
- **WHEN** specified compiler version not installed locally
- **THEN** download compactc binary from GitHub releases
- **THEN** store in `~/.nightcap/compilers/compactc-<version>`

#### Scenario: Install stable compiler
- **WHEN** user runs `nightcap compiler install 0.26.0`
- **THEN** download from GitHub releases
- **THEN** install specified compactc version

#### Scenario: Install prerelease compiler
- **WHEN** user runs `nightcap compiler install 0.27.0-rc.1 --prerelease`
- **THEN** download from prerelease directory on main branch
- **THEN** install specified prerelease compactc version

#### Scenario: List installed compilers
- **WHEN** user runs `nightcap compiler list`
- **THEN** display installed compactc versions and active version

#### Scenario: Platform support
- **WHEN** downloading compiler
- **THEN** detect platform (macOS arm64, macOS x86_64, Linux x86_64)
- **THEN** download appropriate binary for platform
