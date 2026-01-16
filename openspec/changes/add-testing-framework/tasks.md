## 1. Test Task
- [ ] 1.1 Implement `nightcap test` task
- [ ] 1.2 Integrate Mocha test runner
- [ ] 1.3 Auto-compile contracts before testing
- [ ] 1.4 Support glob patterns for test selection
- [ ] 1.5 Add `--grep` flag for filtering tests

## 2. Midnight Chai Matchers
- [ ] 2.1 Create `@nightcap/chai-matchers` package
- [ ] 2.2 Implement `.to.changeBalance()` for DUST assertions
- [ ] 2.3 Implement `.to.emit()` for event assertions
- [ ] 2.4 Implement `.to.beReverted()` for failure assertions
- [ ] 2.5 Implement `.to.beValidProof()` for ZK proof assertions

## 3. Test Fixtures
- [ ] 3.1 Implement `loadFixture()` for state snapshots
- [ ] 3.2 Support async fixture setup
- [ ] 3.3 Automatic state revert between tests
- [ ] 3.4 Named fixtures for complex scenarios

## 4. Test Helpers
- [ ] 4.1 Provide `getSigners()` for account access
- [ ] 4.2 Implement `deployContract()` helper
- [ ] 4.3 Add time manipulation helpers (advance block, set timestamp)
- [ ] 4.4 Provide `expectRevert()` utility

## 5. Contract Interaction
- [ ] 5.1 Integrate midnight-js for contract calls
- [ ] 5.2 Support typed contract instances from compilation
- [ ] 5.3 Handle shielded and unshielded operations
- [ ] 5.4 Provide transaction receipt helpers

## 6. Reporting
- [ ] 6.1 Add DUST usage reporting per test
- [ ] 6.2 Implement proof generation time reporting
- [ ] 6.3 Support multiple reporter formats (spec, json, junit)
- [ ] 6.4 Add `--bail` flag to stop on first failure

## 7. Coverage
- [ ] 7.1 Implement contract coverage instrumentation
- [ ] 7.2 Generate coverage reports (lcov, html)
- [ ] 7.3 Add `nightcap coverage` task
- [ ] 7.4 Support coverage thresholds

## 8. Parallel Execution
- [ ] 8.1 Support parallel test file execution
- [ ] 8.2 Isolate network state per worker
- [ ] 8.3 Add `--parallel` flag with worker count

## 9. Testing
- [ ] 9.1 Unit tests for chai matchers
- [ ] 9.2 Integration tests with sample contracts
- [ ] 9.3 E2E tests for coverage reporting
