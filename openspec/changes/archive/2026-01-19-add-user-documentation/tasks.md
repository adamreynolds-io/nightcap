# Tasks: Add User Documentation

## 1. Documentation Structure
- [x] 1.1 Create `docs/` directory
- [x] 1.2 Create `docs/README.md` documentation index

## 2. Getting Started Guide
- [x] 2.1 Document prerequisites (Node.js 20+, Docker, pnpm)
- [x] 2.2 Document installation steps
- [x] 2.3 Document project creation with `nightcap init`
- [x] 2.4 Document local network startup
- [x] 2.5 Document contract compilation
- [x] 2.6 Document contract deployment
- [x] 2.7 Create Hello World walkthrough

## 3. Command Reference
- [x] 3.1 Document global options (--network, --verbose, --quiet, --config)
- [x] 3.2 Document `init` command with all parameters
- [x] 3.3 Document `doctor` command
- [x] 3.4 Document `node` commands (node, node:stop, node:status, node:logs, node:reset, node:exec)
- [x] 3.5 Document snapshot commands (node:snapshot, node:restore, node:snapshots, node:snapshot:delete)
- [x] 3.6 Document compile commands (compile, clean, compiler:list, compiler:install)
- [x] 3.7 Document deploy commands (deploy, deployments)
- [x] 3.8 Document `completion` command

## 4. Configuration Reference
- [x] 4.1 Document config file names supported
- [x] 4.2 Document NightcapConfig interface
- [x] 4.3 Document NetworkConfig options
- [x] 4.4 Document DockerConfig options
- [x] 4.5 Document CompactConfig options
- [x] 4.6 Document PathsConfig options
- [x] 4.7 Document pre-configured networks
- [x] 4.8 Provide example configurations

## 5. Plugin Development Guide
- [x] 5.1 Document plugin architecture overview
- [x] 5.2 Document NightcapPlugin interface
- [x] 5.3 Document creating a basic plugin
- [x] 5.4 Document hook handlers (config hooks, runtime hooks)
- [x] 5.5 Document adding custom tasks
- [x] 5.6 Document plugin dependencies
- [x] 5.7 Create example: gas reporter plugin

## 6. Troubleshooting Guide
- [x] 6.1 Document Docker issues and solutions
- [x] 6.2 Document compilation errors
- [x] 6.3 Document network connectivity issues
- [x] 6.4 Document common error messages and solutions
- [x] 6.5 Document how to run diagnostics

## 7. Updates to Existing Files
- [x] 7.1 Update root README.md with documentation section
- [x] 7.2 Create packages/nightcap-core/README.md
- [x] 7.3 Create packages/docker-orchestrator/README.md
- [x] 7.4 Add documentation guidelines to CLAUDE.md

## 8. Verification
- [x] 8.1 Verify all markdown files render correctly
- [x] 8.2 Verify all internal links work
- [x] 8.3 Test code snippets are syntactically correct
- [x] 8.4 Ensure command documentation matches CLI output
