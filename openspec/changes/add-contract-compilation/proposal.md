# Change: Add Compact Contract Compilation

## Why
Developers need to compile Compact contracts into deployable artifacts. Like Hardhat's `compile` task for Solidity, Nightcap should provide seamless contract compilation with dependency resolution, caching, and TypeScript type generation for type-safe contract interactions.

## What Changes
- Add `nightcap compile` task for Compact contract compilation
- Integrate `compactc` compiler (native binary from github.com/midnightntwrk/compact)
- Auto-download compiler binary if not installed (or prompt for installation)
- Implement compilation caching for faster rebuilds
- Generate TypeScript declaration files from compiled contracts
- Support multiple compiler versions (pin via config)
- Integrate with midnight-js for type-safe contract bindings
- Add compilation error formatting with source locations

## Impact
- Affected specs: `contract-compilation` (new capability)
- Affected code: New `packages/nightcap-core/src/tasks/compile.ts`
- Dependencies: `compactc` binary (macOS/Linux), midnight-js types package
