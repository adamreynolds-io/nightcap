## 1. Init Command
- [ ] 1.1 Implement `nightcap init` task
- [ ] 1.2 Add interactive prompts for project configuration
- [ ] 1.3 Support `--template` flag for non-interactive initialization
- [ ] 1.4 Implement `--force` flag to overwrite existing files

## 2. Project Templates
- [ ] 2.1 Create "basic" template (single contract, basic tests)
- [ ] 2.2 Create "dapp" template (contract + TypeScript frontend scaffolding)
- [ ] 2.3 Create "library" template (reusable contract library structure)
- [ ] 2.4 Add template metadata and descriptions

## 3. File Generation
- [ ] 3.1 Generate `nightcap.config.ts` with network and compiler settings
- [ ] 3.2 Generate `package.json` with required dependencies
- [ ] 3.3 Generate `tsconfig.json` for TypeScript projects
- [ ] 3.4 Generate `.gitignore` with common exclusions
- [ ] 3.5 Generate sample contract in `contracts/` directory
- [ ] 3.6 Generate sample test in `test/` directory
- [ ] 3.7 Generate README.md with quickstart instructions

## 4. Dependency Installation
- [ ] 4.1 Detect package manager (npm, yarn, pnpm)
- [ ] 4.2 Run dependency installation after scaffolding
- [ ] 4.3 Add `--skip-install` flag to defer installation

## 5. Testing
- [ ] 5.1 Unit tests for template generation
- [ ] 5.2 E2E tests for full project initialization
- [ ] 5.3 Test with different package managers
