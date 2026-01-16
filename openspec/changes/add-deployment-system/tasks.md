## 1. Deployment Modules
- [ ] 1.1 Define deployment module format
- [ ] 1.2 Implement module discovery in `ignition/` directory
- [ ] 1.3 Support TypeScript deployment modules
- [ ] 1.4 Implement module dependency resolution

## 2. Deploy Task
- [ ] 2.1 Implement `nightcap deploy` task
- [ ] 2.2 Add `--network` flag for target selection
- [ ] 2.3 Add `--dry-run` flag for deployment preview
- [ ] 2.4 Implement deployment confirmation prompts

## 3. Toolkit Integration
- [ ] 3.1 Integrate toolkit's contract-simple deploy builder
- [ ] 3.2 Configure Source/Destination for target network
- [ ] 3.3 Handle proof generation during deployment
- [ ] 3.4 Support contract initialization parameters

## 4. Deployment Tracking
- [ ] 4.1 Create deployment history storage
- [ ] 4.2 Record deployed contract addresses per network
- [ ] 4.3 Store deployment artifacts and constructor args
- [ ] 4.4 Add `nightcap deployments` task to list history

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
- [ ] 8.1 Unit tests for module resolution
- [ ] 8.2 Integration tests for deployment flow
- [ ] 8.3 E2E tests for network deployments
