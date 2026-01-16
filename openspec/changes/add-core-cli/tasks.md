## 1. Core CLI Infrastructure
- [ ] 1.1 Set up monorepo structure with pnpm workspaces
- [ ] 1.2 Create `packages/nightcap-core` package
- [ ] 1.3 Implement CLI entry point with Commander.js
- [ ] 1.4 Add configuration file loader (`nightcap.config.ts` support)
- [ ] 1.5 Implement task registry and execution system

## 2. Task System
- [ ] 2.1 Define task interface (name, description, action, dependencies)
- [ ] 2.2 Implement built-in task discovery
- [ ] 2.3 Add custom task registration via config
- [ ] 2.4 Implement task dependency resolution
- [ ] 2.5 Add task parameter parsing and validation

## 3. Docker Integration
- [ ] 3.1 Create `@nightcap/docker-orchestrator` package
- [ ] 3.2 Integrate dockerode for Docker API control
- [ ] 3.3 Implement Docker availability detection
- [ ] 3.4 Create docker-compose.yml generator for Midnight stack
- [ ] 3.5 Implement image pull with progress reporting
- [ ] 3.6 Add container lifecycle management (start, stop, logs, exec)

## 4. Toolkit Bridge
- [ ] 4.1 Create typed interfaces for toolkit JSON output
- [ ] 4.2 Implement toolkit execution via Docker container
- [ ] 4.3 Handle volume mounts for artifacts and data
- [ ] 4.4 Map Nightcap config to toolkit CLI arguments
- [ ] 4.5 Add error parsing and user-friendly messages
- [ ] 4.6 Implement native binary fallback when Docker unavailable

## 5. Environment Diagnostics
- [ ] 5.1 Implement `nightcap doctor` command
- [ ] 5.2 Check Docker installation and version
- [ ] 5.3 Verify required images are available
- [ ] 5.4 Test network connectivity to registries
- [ ] 5.5 Validate system resources (disk, memory)

## 6. Developer Experience
- [ ] 6.1 Add `--help` with task listing and descriptions
- [ ] 6.2 Implement `--verbose` and `--quiet` output modes
- [ ] 6.3 Add colored terminal output and progress indicators
- [ ] 6.4 Implement error handling with actionable messages
- [ ] 6.5 Add shell completion scripts (bash, zsh, fish)

## 7. Testing
- [ ] 7.1 Unit tests for task registry
- [ ] 7.2 Integration tests for CLI commands
- [ ] 7.3 Integration tests for Docker orchestration
- [ ] 7.4 E2E tests for configuration loading
