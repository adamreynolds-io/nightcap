# Change: Add Project Scaffolding and Initialization

**Status:** ✅ Complete

## Why
Developers need a quick way to bootstrap new Midnight dApp projects with proper structure, configuration, and dependencies. Like Hardhat's `npx hardhat init`, Nightcap should provide interactive project initialization with templates for common use cases (simple contract, full dApp with frontend, library).

## What Changed
- Added `nightcap init` command for interactive project creation
- Implemented project templates (basic, dapp, library)
- DApp template supports optional CLI (`--cli`) and React (`--react`) interfaces
- Generates `nightcap.config.ts` with sensible defaults
- Creates sample Counter.compact contract and test file
- Sets up TypeScript configuration and dependencies
- Generates `.gitignore`, `README.md`, and other project files
- Auto-detects package manager (npm, yarn, pnpm) for dependency installation
- Supports `--force` flag to overwrite existing files
- Supports `--skip-install` flag to skip dependency installation

## Implementation
- **Task:** `packages/nightcap-core/src/tasks/builtin/init.ts`
- **Templates:** `packages/nightcap-core/src/templates/index.ts`
- **Dependencies:** @inquirer/prompts (interactive prompts)

## Templates
| Template | Description |
|----------|-------------|
| `basic` | Simple contract project with Counter.compact |
| `dapp` | Full dApp with src/, optional CLI and React web UI |
| `library` | Reusable contract library with exports |
