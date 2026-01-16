## ADDED Requirements

### Requirement: Test Task
The system SHALL provide a `nightcap test` task that executes contract tests.

#### Scenario: Run all tests
- **WHEN** user runs `nightcap test`
- **THEN** compile contracts if needed
- **THEN** start in-process network
- **THEN** execute all test files in `test/` directory

#### Scenario: Run specific tests
- **WHEN** user runs `nightcap test test/MyContract.test.ts`
- **THEN** execute only the specified test file

#### Scenario: Filter by name
- **WHEN** user runs `nightcap test --grep "should transfer"`
- **THEN** execute only tests matching the pattern

#### Scenario: Bail on failure
- **WHEN** user runs `nightcap test --bail`
- **THEN** stop execution after first test failure

### Requirement: Midnight Chai Matchers
The system SHALL provide Chai assertion matchers for Midnight-specific operations.

#### Scenario: Assert balance change
- **WHEN** test uses `expect(tx).to.changeBalance(account, amount)`
- **THEN** verify account balance changed by specified amount

#### Scenario: Assert shielded balance change
- **WHEN** test uses `expect(tx).to.changeShieldedBalance(account, amount)`
- **THEN** verify shielded balance changed by specified amount

#### Scenario: Assert event emission
- **WHEN** test uses `expect(tx).to.emit(contract, "EventName")`
- **THEN** verify contract emitted specified event

#### Scenario: Assert revert
- **WHEN** test uses `expect(promise).to.be.reverted`
- **THEN** verify transaction was reverted

#### Scenario: Assert revert with reason
- **WHEN** test uses `expect(promise).to.be.revertedWith("reason")`
- **THEN** verify transaction reverted with specific reason

### Requirement: Test Fixtures
The system SHALL provide fixtures for efficient test state management.

#### Scenario: Load fixture
- **WHEN** test calls `loadFixture(deployContractFixture)`
- **THEN** execute fixture function on first call
- **THEN** return snapshot of state for subsequent calls

#### Scenario: Fixture isolation
- **WHEN** test modifies state after loading fixture
- **THEN** next test loading same fixture gets clean state

#### Scenario: Nested fixtures
- **WHEN** fixture depends on another fixture
- **THEN** resolve dependencies and cache each level

### Requirement: Test Helpers
The system SHALL provide helper functions for common test operations.

#### Scenario: Get signers
- **WHEN** test calls `nightcap.getSigners()`
- **THEN** return array of funded test accounts

#### Scenario: Deploy contract
- **WHEN** test calls `nightcap.deployContract("Counter", args)`
- **THEN** compile, deploy, and return typed contract instance

#### Scenario: Time manipulation
- **WHEN** test calls `nightcap.time.increase(seconds)`
- **THEN** advance blockchain time by specified duration

#### Scenario: Mine blocks
- **WHEN** test calls `nightcap.mine(count)`
- **THEN** mine specified number of empty blocks

### Requirement: Contract Interaction
The system SHALL integrate midnight-js for type-safe contract interaction in tests.

#### Scenario: Call contract method
- **WHEN** test calls `contract.increment()`
- **THEN** execute contract method and return typed result

#### Scenario: Send transaction
- **WHEN** test calls `contract.connect(signer).transfer(to, amount)`
- **THEN** execute transaction from specified signer

#### Scenario: Query state
- **WHEN** test calls `contract.getBalance(address)`
- **THEN** query current contract state and return typed value

### Requirement: DUST Usage Reporting
The system SHALL report DUST (gas) usage for tests.

#### Scenario: Report per test
- **WHEN** test completes
- **THEN** display DUST consumed by test transactions

#### Scenario: Summary report
- **WHEN** all tests complete
- **THEN** display total DUST usage and average per test

#### Scenario: Gas reporter flag
- **WHEN** user runs `nightcap test --gas-report`
- **THEN** display detailed gas breakdown by contract method

### Requirement: Code Coverage
The system SHALL support contract code coverage measurement.

#### Scenario: Run with coverage
- **WHEN** user runs `nightcap coverage`
- **THEN** instrument contracts for coverage
- **THEN** run tests and collect coverage data
- **THEN** generate coverage report

#### Scenario: Coverage formats
- **WHEN** coverage completes
- **THEN** generate reports in lcov, html, and json formats

#### Scenario: Coverage threshold
- **WHEN** configuration specifies coverage threshold
- **THEN** fail if coverage below threshold

### Requirement: Parallel Test Execution
The system SHALL support parallel test execution for faster feedback.

#### Scenario: Run parallel
- **WHEN** user runs `nightcap test --parallel`
- **THEN** execute test files in parallel workers

#### Scenario: Worker count
- **WHEN** user runs `nightcap test --parallel 4`
- **THEN** use specified number of worker processes

#### Scenario: Isolated state
- **WHEN** tests run in parallel
- **THEN** each worker has isolated network state

### Requirement: Test Reporter
The system SHALL support multiple test output formats.

#### Scenario: Spec reporter (default)
- **WHEN** tests run without reporter flag
- **THEN** display hierarchical test results in terminal

#### Scenario: JSON reporter
- **WHEN** user runs `nightcap test --reporter json`
- **THEN** output test results as JSON

#### Scenario: JUnit reporter
- **WHEN** user runs `nightcap test --reporter junit`
- **THEN** output test results in JUnit XML format for CI integration
