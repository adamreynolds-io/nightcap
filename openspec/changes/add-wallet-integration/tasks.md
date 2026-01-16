## 1. Account Commands
- [ ] 1.1 Implement `nightcap accounts` task to list accounts
- [ ] 1.2 Implement `nightcap accounts new` to generate new account
- [ ] 1.3 Implement `nightcap accounts import` to import from private key
- [ ] 1.4 Implement `nightcap accounts export` to export private key
- [ ] 1.5 Add `--network` flag to show network-specific addresses

## 2. Balance Commands
- [ ] 2.1 Implement `nightcap balance <address>` task
- [ ] 2.2 Show both shielded and unshielded balances
- [ ] 2.3 Support multiple token types
- [ ] 2.4 Add `--watch` flag for continuous monitoring

## 3. Toolkit Integration
- [ ] 3.1 Integrate toolkit wallet state fetching
- [ ] 3.2 Use toolkit for address generation (shielded/unshielded)
- [ ] 3.3 Implement DUST balance calculation
- [ ] 3.4 Support wallet synchronization

## 4. Key Storage
- [ ] 4.1 Implement encrypted keystore (like Ethereum keystore)
- [ ] 4.2 Support password-protected key storage
- [ ] 4.3 Store keys in `~/.nightcap/keystore/`
- [ ] 4.4 Support environment variable keys for CI

## 5. Hardware Wallet Support
- [ ] 5.1 Add hardware wallet provider interface
- [ ] 5.2 Implement Ledger support
- [ ] 5.3 Add `--ledger` flag to deployment commands
- [ ] 5.4 Support HD wallet derivation paths

## 6. DUST Registration
- [ ] 6.1 Implement DUST registration workflow
- [ ] 6.2 Add `nightcap faucet` task for testnet tokens
- [ ] 6.3 Display registration status

## 7. Configuration
- [ ] 7.1 Support accounts in config file
- [ ] 7.2 Add named account aliases
- [ ] 7.3 Support mnemonic-based account derivation
- [ ] 7.4 Add account security warnings

## 8. Testing
- [ ] 8.1 Unit tests for key storage
- [ ] 8.2 Integration tests for balance queries
- [ ] 8.3 E2E tests for account management
