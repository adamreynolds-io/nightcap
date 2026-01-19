# Change: Add Core CLI Framework

**Status:** ✅ Complete

## Why
Nightcap needs a foundational CLI framework that provides task-based command execution, similar to Hardhat's architecture. The midnight-node toolkit provides robust transaction, wallet, and contract operations that can serve as the core engine, but Nightcap needs a developer-friendly CLI layer with extensible task system, configuration management, and plugin hooks.

## What Changed
- Added CLI entry point (`nightcap`) with task-based command execution via Commander.js
- Implemented configuration file support (`nightcap.config.ts`, `.js`, `.mjs`)
- Created task runner system with dependency resolution, supporting built-in and custom tasks
- Integrated midnight-node toolkit as the core execution engine (Docker and native fallback)
- Added help system, command discovery, and shell completion (bash, zsh, fish)
- Implemented verbose/quiet output modes with colored terminal output
- Created `@nightcap/docker-orchestrator` package for local network management

## Built-in Tasks Implemented
| Task | Description |
|------|-------------|
| `init` | Project scaffolding with templates (cli, react) |
| `doctor` | Environment diagnostics and health checks |
| `node` | Start local Midnight Docker stack |
| `node:stop` | Stop local node containers |
| `node:status` | Check node component status |
| `node:logs` | Stream container logs |
| `node:reset` | Reset node state and volumes |
| `node:exec` | Execute commands in containers |
| `compile` | Compile Compact contracts |
| `clean` | Clean build artifacts |
| `compiler:list` | List available compiler versions |
| `compiler:install` | Install compiler version |

## Impact
- Affected specs: `core-cli` (new capability)
- Affected code: `packages/nightcap-core`, `packages/docker-orchestrator`
- Dependencies: Commander.js, dockerode, tsx (for TypeScript config loading)
