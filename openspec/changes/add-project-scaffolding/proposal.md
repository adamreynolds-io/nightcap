# Change: Add Project Scaffolding and Initialization

## Why
Developers need a quick way to bootstrap new Midnight dApp projects with proper structure, configuration, and dependencies. Like Hardhat's `npx hardhat init`, Nightcap should provide interactive project initialization with templates for common use cases (simple contract, full dApp with frontend, library).

## What Changes
- Add `nightcap init` command for interactive project creation
- Implement project templates (basic, dapp, library)
- Generate `nightcap.config.ts` with sensible defaults
- Create sample Compact contracts and tests
- Set up TypeScript configuration and dependencies
- Generate `.gitignore` and other project files

## Impact
- Affected specs: `project-scaffolding` (new capability)
- Affected code: New `packages/nightcap-core/src/tasks/init.ts`
- Dependencies: inquirer (prompts), fs-extra (file operations)
