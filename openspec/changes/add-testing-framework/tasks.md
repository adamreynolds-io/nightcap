## 1. Test Task
- [x] 1.1 Implement `nightcap test` task
- [x] 1.2 Integrate Vitest test runner (aligned with project tooling)
- [x] 1.3 Auto-compile contracts before testing
- [x] 1.4 Support glob patterns for test selection
- [x] 1.5 Add `--grep` flag for filtering tests

## 2. Midnight Vitest Matchers
- [x] 2.1 Create `@nightcap/test` package with matchers
- [x] 2.2 Implement `toChangeBalance()` for DUST assertions
- [x] 2.3 Implement `toEmitEvent()` for event assertions
- [x] 2.4 Implement `toBeReverted()` for failure assertions
- [x] 2.5 Implement `toBeValidProof()` for ZK proof assertions

## 3. Test Fixtures
- [x] 3.1 Implement `loadFixture()` for state snapshots
- [x] 3.2 Support async fixture setup
- [x] 3.3 Automatic state revert between tests
- [x] 3.4 Named fixtures for complex scenarios

## 4. Test Helpers
- [x] 4.1 Provide `getSigners()` for account access
- [x] 4.2 Implement `deployContract()` helper
- [x] 4.3 Add time manipulation helpers (advance block, set timestamp)
- [x] 4.4 Provide `expectRevert()` utility (via toBeReverted matcher)

## 5. Contract Interaction
- [ ] 5.1 Integrate midnight-js for contract calls
- [ ] 5.2 Support typed contract instances from compilation
- [ ] 5.3 Handle shielded and unshielded operations
- [ ] 5.4 Provide transaction receipt helpers

## 6. Reporting
- [ ] 6.1 Add DUST usage reporting per test
- [ ] 6.2 Implement proof generation time reporting
- [x] 6.3 Support multiple reporter formats (default, verbose, json, junit)
- [x] 6.4 Add `--bail` flag to stop on first failure

## 7. Coverage
- [ ] 7.1 Implement contract coverage instrumentation
- [x] 7.2 Generate coverage reports (lcov, html, text, json)
- [x] 7.3 Add `nightcap coverage` task
- [x] 7.4 Support coverage thresholds

## 8. Parallel Execution
- [x] 8.1 Support parallel test file execution
- [ ] 8.2 Isolate network state per worker
- [x] 8.3 Add `--parallel` flag with worker count

## 9. Testing
- [x] 9.1 Unit tests for Vitest matchers
- [ ] 9.2 Integration tests with sample contracts
- [ ] 9.3 E2E tests for coverage reporting
