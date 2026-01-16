# Change: Add Plugin Architecture with midnight-js Integration

## Why
Nightcap needs an extensible plugin system that allows the community to add functionality without modifying core code. Like Hardhat's plugin ecosystem, plugins should be able to add tasks, extend configuration, and provide runtime extensions. The `midnight-js` library is the first plugin candidate, providing dApp developers with type-safe contract interactions, wallet connectivity, and ZK proof utilities.

## What Changes
- Implement plugin loading and registration system
- Define plugin API for extending tasks, config, and runtime
- Create `@nightcap/plugin-midnight-js` as reference plugin
- Enable plugin dependencies and composition
- Support task overriding and extension via plugins
- Provide plugin development utilities and documentation

## Impact
- Affected specs: `plugin-architecture` (new capability)
- Affected code: `packages/nightcap-core` (plugin loader), new `packages/nightcap-plugin-midnight-js`
- Dependencies: midnight-js packages
