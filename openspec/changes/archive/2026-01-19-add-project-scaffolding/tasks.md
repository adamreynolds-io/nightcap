## 1. Init Command
- [x] 1.1 Implement `nightcap init` task
- [x] 1.2 Add interactive prompts for project configuration
- [x] 1.3 Support `--template` flag for non-interactive initialization
- [x] 1.4 Implement `--force` flag to overwrite existing files

## 2. Project Templates
- [x] 2.1 Create "basic" template (single contract, basic tests)
- [x] 2.2 Create "dapp" template (contract + TypeScript frontend scaffolding)
- [x] 2.3 Create "library" template (reusable contract library structure)
- [x] 2.4 Add template metadata and descriptions

## 3. File Generation
- [x] 3.1 Generate `nightcap.config.ts` with network and compiler settings
- [x] 3.2 Generate `package.json` with required dependencies
- [x] 3.3 Generate `tsconfig.json` for TypeScript projects
- [x] 3.4 Generate `.gitignore` with common exclusions
- [x] 3.5 Generate sample contract in `contracts/` directory
- [x] 3.6 Generate sample test in `test/` directory
- [x] 3.7 Generate README.md with quickstart instructions

## 4. Dependency Installation
- [x] 4.1 Detect package manager (npm, yarn, pnpm)
- [x] 4.2 Run dependency installation after scaffolding
- [x] 4.3 Add `--skip-install` flag to defer installation

## 5. DApp Interface Options
- [x] 5.1 Add interactive checkbox prompt for interface selection
- [x] 5.2 Add `--cli` flag for CLI interface generation
- [x] 5.3 Add `--react` flag for React interface generation
- [x] 5.4 Generate CLI scaffold with Commander.js
- [x] 5.5 Generate React scaffold with Vite + React
- [x] 5.6 Update package.json with interface-specific dependencies

## 6. Testing
- [x] 6.1 Unit tests for template generation
- [x] 6.2 E2E tests for full project initialization
- [x] 6.3 Test with different package managers
- [x] 6.4 Test CLI interface generation
- [x] 6.5 Test React interface generation
