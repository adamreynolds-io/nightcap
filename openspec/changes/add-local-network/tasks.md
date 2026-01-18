## 1. Node Command
- [x] 1.1 Implement `nightcap node` task (start the stack)
- [x] 1.2 Generate docker-compose.yml for Midnight stack
- [x] 1.3 Pull required images with progress display
- [x] 1.4 Start containers via Docker Compose API
- [x] 1.5 Display service URLs and account info on startup
- [ ] 1.6 Implement graceful shutdown on SIGINT/SIGTERM

## 2. Docker Stack Configuration
- [x] 2.1 Configure `midnightntwrk/midnight-node` container (ports 9933, 9944)
- [x] 2.2 Configure `midnightnetwork/proof-server` container (port 6300)
- [x] 2.3 Configure `midnightntwrk/indexer-standalone` container (port 8080)
- [x] 2.4 Configure `midnightntwrk/wallet-indexer` container
- [x] 2.5 Set up shared Docker network for inter-container communication
- [x] 2.6 Configure volume mounts for persistent data

## 3. Subcommands
- [x] 3.1 Implement `nightcap node:stop` to stop stack
- [x] 3.2 Implement `nightcap node:logs [service]` to tail logs
- [x] 3.3 Implement `nightcap node:status` to show running services
- [x] 3.4 Implement `nightcap node:reset` to clear data and restart
- [x] 3.5 Implement `nightcap node:exec <service> <command>` for debugging

## 4. Development Accounts
- [ ] 4.1 Configure genesis with pre-funded development accounts
- [ ] 4.2 Support both shielded and unshielded balances
- [ ] 4.3 Display account addresses and keys on startup
- [ ] 4.4 Allow custom initial balances via config

## 5. State Management
- [ ] 5.1 Implement state snapshot via volume backup
- [ ] 5.2 Add `nightcap node:snapshot <name>` command
- [ ] 5.3 Add `nightcap node:restore <name>` command
- [ ] 5.4 Store snapshots in `.nightcap/snapshots/`

## 6. Network Forking
- [ ] 6.1 Implement `nightcap node --fork testnet` flag
- [ ] 6.2 Configure toolkit to sync state from remote network
- [ ] 6.3 Cache forked state in local volume
- [ ] 6.4 Support forking from specific block number

## 7. Configuration
- [x] 7.1 Add `networks.local` config section for Docker settings
- [x] 7.2 Support custom image tags/versions
- [x] 7.3 Allow port customization to avoid conflicts
- [ ] 7.4 Support resource limits (CPU, memory)

## 8. Testing
- [x] 8.1 Integration tests for stack startup/shutdown
- [ ] 8.2 Tests for state snapshot/restore
- [ ] 8.3 E2E tests for forking scenarios
