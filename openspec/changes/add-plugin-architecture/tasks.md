## 1. Plugin System Core
- [ ] 1.1 Define plugin interface and lifecycle hooks
- [ ] 1.2 Implement plugin loader from config
- [ ] 1.3 Support npm package plugins
- [ ] 1.4 Support local file plugins
- [ ] 1.5 Implement plugin dependency resolution

## 2. Plugin Capabilities
- [ ] 2.1 Allow plugins to register tasks
- [ ] 2.2 Allow plugins to extend configuration schema
- [ ] 2.3 Allow plugins to add runtime extensions
- [ ] 2.4 Allow plugins to override built-in tasks
- [ ] 2.5 Provide inter-plugin communication hooks

## 3. midnight-js Plugin
- [ ] 3.1 Create `@nightcap/plugin-midnight-js` package
- [ ] 3.2 Integrate midnight-js/contracts for contract interaction
- [ ] 3.3 Integrate midnight-js/types for type generation
- [ ] 3.4 Add indexer-public-data-provider integration
- [ ] 3.5 Add http-client-proof-provider integration
- [ ] 3.6 Add level-private-state-provider for persistent state
- [ ] 3.7 Add fetch-zk-config-provider for ZK artifacts

## 4. Contract Factory Extension
- [ ] 4.1 Extend nightcap with `getContractFactory()` from midnight-js
- [ ] 4.2 Provide typed contract instances
- [ ] 4.3 Support contract deployment with midnight-js
- [ ] 4.4 Handle private state in contract interactions

## 5. Wallet Integration (via plugin)
- [ ] 5.1 Provide wallet connection utilities
- [ ] 5.2 Support hardware wallet providers
- [ ] 5.3 Add browser wallet integration for dApp testing

## 6. Plugin Development Tools
- [ ] 6.1 Create plugin starter template
- [ ] 6.2 Document plugin development guide
- [ ] 6.3 Provide type definitions for plugin authors
- [ ] 6.4 Add plugin testing utilities

## 7. Testing
- [ ] 7.1 Unit tests for plugin loading
- [ ] 7.2 Integration tests for midnight-js plugin
- [ ] 7.3 E2E tests for plugin task extension
