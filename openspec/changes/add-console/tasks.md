## 1. Core Console Implementation
- [ ] 1.1 Create `nightcap console` task
- [ ] 1.2 Initialize Node.js REPL with custom context
- [ ] 1.3 Load Nightcap config and connect to network
- [ ] 1.4 Expose config and network in REPL context
- [ ] 1.5 Support `--network` flag for network selection

## 2. Contract Utilities
- [ ] 2.1 Load compiled contract artifacts into context
- [ ] 2.2 Provide `getContract(name)` helper for contract access
- [ ] 2.3 Provide `deployContract(name, args)` helper
- [ ] 2.4 Provide `getContractAt(name, address)` helper
- [ ] 2.5 Support typed contract instances from artifacts

## 3. Network Utilities
- [ ] 3.1 Expose indexer client for blockchain queries
- [ ] 3.2 Expose proof server client
- [ ] 3.3 Provide `getBalance(address)` helper
- [ ] 3.4 Provide `getBlock()` and `getTransaction()` helpers

## 4. REPL Enhancements
- [ ] 4.1 Add command history persistence (~/.nightcap/console_history)
- [ ] 4.2 Add auto-completion for contract names and methods
- [ ] 4.3 Add `.help` command showing available utilities
- [ ] 4.4 Add `.clear` command to reset context
- [ ] 4.5 Support top-level await for async operations

## 5. Output Formatting
- [ ] 5.1 Pretty-print contract call results
- [ ] 5.2 Format transaction receipts readably
- [ ] 5.3 Display proof generation progress
- [ ] 5.4 Color-code errors and warnings

## 6. Testing
- [ ] 6.1 Unit tests for console context setup
- [ ] 6.2 Unit tests for contract helpers
- [ ] 6.3 Integration tests for REPL functionality
