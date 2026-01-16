# Change: Add Testing Framework for Compact Contracts

## Why
Developers need a robust testing framework to verify contract behavior before deployment. Like Hardhat's Mocha/Chai integration, Nightcap should provide TypeScript-first testing with Midnight-specific assertions, fixture management, and integration with the local network. The midnight-js library provides contract interaction primitives that tests will use.

## What Changes
- Add `nightcap test` task to run contract tests
- Provide Midnight-specific Chai matchers (balance assertions, event checks, ZK proof validation)
- Implement test fixtures for efficient state management
- Support parallel test execution
- Add gas/DUST reporting for tests
- Integrate with coverage tools

## Impact
- Affected specs: `testing-framework` (new capability)
- Affected code: New `packages/nightcap-test` package
- Dependencies: Mocha, Chai, midnight-js
