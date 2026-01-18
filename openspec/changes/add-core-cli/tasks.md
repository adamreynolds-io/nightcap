## 1. Core CLI Infrastructure
- [x] 1.1 Set up monorepo structure with pnpm workspaces
- [x] 1.2 Create `packages/nightcap-core` package
- [x] 1.3 Implement CLI entry point with Commander.js
- [x] 1.4 Add configuration file loader (`nightcap.config.ts` support)
- [x] 1.5 Implement task registry and execution system

## 2. Task System
- [x] 2.1 Define task interface (name, description, action, dependencies)
- [x] 2.2 Implement built-in task discovery
- [x] 2.3 Add custom task registration via config
- [x] 2.4 Implement task dependency resolution
- [x] 2.5 Add task parameter parsing and validation

## 3. Docker Integration
- [x] 3.1 Create `@nightcap/docker-orchestrator` package
- [x] 3.2 Integrate dockerode for Docker API control
- [x] 3.3 Implement Docker availability detection
- [x] 3.4 Create docker-compose.yml generator for Midnight stack
- [x] 3.5 Implement image pull with progress reporting
- [x] 3.6 Add container lifecycle management (start, stop, logs, exec)

## 4. Toolkit Bridge
- [x] 4.1 Create typed interfaces for toolkit JSON output
- [x] 4.2 Implement toolkit execution via Docker container
- [x] 4.3 Handle volume mounts for artifacts and data
- [x] 4.4 Map Nightcap config to toolkit CLI arguments
- [x] 4.5 Add error parsing and user-friendly messages
- [x] 4.6 Implement native binary fallback when Docker unavailable

## 5. Environment Diagnostics
- [x] 5.1 Implement `nightcap doctor` command
- [x] 5.2 Check Docker installation and version
- [x] 5.3 Verify required images are available
- [x] 5.4 Test network connectivity to registries
- [x] 5.5 Validate system resources (disk, memory)

## 6. Developer Experience
- [x] 6.1 Add `--help` with task listing and descriptions
- [x] 6.2 Implement `--verbose` and `--quiet` output modes
- [x] 6.3 Add colored terminal output and progress indicators
- [x] 6.4 Implement error handling with actionable messages
- [ ] 6.5 Add shell completion scripts (bash, zsh, fish)

## 7. Testing
- [x] 7.1 Unit tests for task registry
- [x] 7.2 Integration tests for CLI commands
- [x] 7.3 Integration tests for Docker orchestration
- [x] 7.4 E2E tests for configuration loading
