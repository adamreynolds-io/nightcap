# Change: Add Contract Deployment System

**Status:** 🟡 Core Features Complete (verification/upgrades pending)

## Why
Developers need a reliable, reproducible way to deploy contracts to different networks. Like Hardhat Ignition, Nightcap should provide declarative deployment modules, dependency resolution, and deployment tracking. The midnight-node toolkit provides the underlying contract deployment capabilities through its `generate-txs contract-simple` commands.

## What Changed
- ✅ Added deployment module discovery (`ignition/modules/` directory)
- ✅ Implemented `nightcap deploy` task with toolkit integration
- ✅ Added `--dry-run` for deployment preview
- ✅ Added `--reset` to force redeployment
- ✅ Implemented deployment history tracking (`deployments/<network>/history.json`)
- ✅ Added `nightcap deployments` task to list deployment history
- ✅ Network confirmation prompts (mainnet requires `--confirm-mainnet`)
- ✅ Integrated toolkit `generate-txs contract-simple deploy` commands
- ✅ WebSocket endpoint conversion for toolkit compatibility

## Remaining Work
- [ ] TypeScript module dynamic import support
- [ ] Module dependency resolution
- [ ] Contract verification
- [ ] Upgrade support (authority/verifier key updates)
- [ ] Standalone deployment scripts (`nightcap run`)

## Impact
- Affected specs: `deployment-system` (new capability)
- Affected code: `packages/nightcap-core/src/tasks/builtin/deploy.ts`
- Dependencies: midnight-node toolkit Docker image
