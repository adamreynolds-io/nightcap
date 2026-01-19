# Change: Add Compact Contract Compilation

**Status:** ✅ Complete

## Why
Developers need to compile Compact contracts into deployable artifacts. Like Hardhat's `compile` task for Solidity, Nightcap should provide seamless contract compilation with dependency resolution, caching, and TypeScript type generation for type-safe contract interactions.

## What Changed
- ✅ Added `nightcap compile` task for Compact contract compilation
- ✅ Integrated `compactc` compiler (native binary from github.com/midnightntwrk/compact)
- ✅ Auto-download compiler binary from GitHub releases (stable and prerelease)
- ✅ Implemented compilation caching with source hash and compiler version tracking
- ✅ Added contract dependency resolution with topological sorting
- ✅ Added version compatibility checking (pragma language_version parsing)
- ✅ Support multiple compiler versions (pin via config, manage in `~/.nightcap/compilers/`)
- ✅ Added compilation error formatting with source location highlighting
- ✅ Added `nightcap clean` task for artifact and cache cleanup
- ✅ Added `nightcap compiler:list` and `nightcap compiler:install` commands
- ✅ Added TypeScript factory generation (`--generate-types` flag)
- ✅ Integrated with midnight-js types for contract interaction
- ✅ Added IDE error formats (`--error-format gcc/json/vscode`)

## Impact
- Affected specs: `contract-compilation` (new capability)
- Affected code: `packages/nightcap-core/src/tasks/builtin/compile.ts`, `packages/nightcap-core/src/compiler/`
- Dependencies: `compactc` binary (macOS arm64/x86_64, Linux x86_64)
