## 1. Deployment Modules
- [x] 1.1 Define deployment module format
- [x] 1.2 Implement module discovery in `ignition/` directory
- [ ] 1.3 Support TypeScript deployment modules (dynamic import)
- [ ] 1.4 Implement module dependency resolution

## 2. Deploy Task
- [x] 2.1 Implement `nightcap deploy` task
- [x] 2.2 Add `--network` flag for target selection
- [x] 2.3 Add `--dry-run` flag for deployment preview
- [x] 2.4 Implement deployment confirmation prompts

## 3. Toolkit Integration
- [x] 3.1 Integrate toolkit's generate-txs contract-simple deploy
- [x] 3.2 Configure Source/Destination for target network (WebSocket)
- [x] 3.3 Handle proof generation during deployment (via prover URL)
- [x] 3.4 Support contract initialization parameters

## 4. Deployment Tracking
- [x] 4.1 Create deployment history storage
- [x] 4.2 Record deployed contract addresses per network
- [x] 4.3 Store deployment artifacts and constructor args
- [x] 4.4 Add `nightcap deployments` task to list history

## 5. Deployment Verification
- [ ] 5.1 Implement contract verification (if applicable)
- [ ] 5.2 Add `nightcap verify` task
- [ ] 5.3 Support automatic verification after deployment

## 6. Upgrade Support
- [ ] 6.1 Implement upgrade-safe deployment patterns
- [ ] 6.2 Add authority key management
- [ ] 6.3 Support verifier key updates
- [ ] 6.4 Track upgrade history

## 7. Scripts
- [ ] 7.1 Support standalone deployment scripts
- [ ] 7.2 Implement `nightcap run` for script execution
- [ ] 7.3 Provide script context with network and signers

## 8. Testing
- [x] 8.1 Unit tests for module resolution
- [ ] 8.2 Integration tests for deployment flow
- [ ] 8.3 E2E tests for network deployments
- [x] 8.4 Tests for deployment history tracking
