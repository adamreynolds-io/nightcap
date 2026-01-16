# Change: Add Contract Deployment System

## Why
Developers need a reliable, reproducible way to deploy contracts to different networks. Like Hardhat Ignition, Nightcap should provide declarative deployment modules, dependency resolution, and deployment tracking. The midnight-node toolkit provides the underlying contract deployment capabilities through its `contract-simple` builder.

## What Changes
- Add deployment module system (`ignition/` directory)
- Implement `nightcap deploy` task for deployment execution
- Track deployment history per network
- Support deployment verification and upgrades
- Integrate toolkit's contract deployment builders
- Add deployment scripts for custom logic

## Impact
- Affected specs: `deployment-system` (new capability)
- Affected code: New `packages/nightcap-deploy` package
- Dependencies: midnight-node toolkit (contract-simple builder)
