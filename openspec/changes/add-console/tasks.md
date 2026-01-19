## 1. Core Console Implementation
- [x] 1.1 Create `nightcap console` task
- [x] 1.2 Initialize Node.js REPL with custom context
- [x] 1.3 Load Nightcap config and connect to network
- [x] 1.4 Expose config and network in REPL context
- [x] 1.5 Support `--network` flag for network selection

## 2. Contract Utilities
- [x] 2.1 Load compiled contract artifacts into context
- [x] 2.2 Provide `getContract(name)` helper for contract access
- [x] 2.3 Provide `deployContract(name, args)` helper (placeholder)
- [x] 2.4 Provide `getContractAt(name, address)` helper (placeholder)
- [ ] 2.5 Support typed contract instances from artifacts

## 3. Network Utilities
- [x] 3.1 Expose indexer client for blockchain queries (placeholder)
- [x] 3.2 Expose proof server client (placeholder)
- [x] 3.3 Provide `getBalance(address)` helper (placeholder)
- [x] 3.4 Provide `getBlock()` and `getTransaction()` helpers (placeholder)

## 4. REPL Enhancements
- [x] 4.1 Add command history persistence (~/.nightcap/console_history)
- [ ] 4.2 Add auto-completion for contract names and methods
- [x] 4.3 Add `.help` command showing available utilities
- [x] 4.4 Add `.clear` command to reset context
- [x] 4.5 Support top-level await for async operations

## 5. Output Formatting
- [ ] 5.1 Pretty-print contract call results
- [ ] 5.2 Format transaction receipts readably
- [ ] 5.3 Display proof generation progress
- [x] 5.4 Color-code errors and warnings

## 6. Testing
- [x] 6.1 Unit tests for console context setup
- [x] 6.2 Unit tests for contract helpers
- [ ] 6.3 Integration tests for REPL functionality
