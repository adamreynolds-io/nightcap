# Change: Add Core CLI Framework

## Why
Nightcap needs a foundational CLI framework that provides task-based command execution, similar to Hardhat's architecture. The midnight-node toolkit provides robust transaction, wallet, and contract operations that can serve as the core engine, but Nightcap needs a developer-friendly CLI layer with extensible task system, configuration management, and plugin hooks.

## What Changes
- Add CLI entry point (`nightcap`) with task-based command execution
- Implement configuration file support (`nightcap.config.ts`)
- Create task runner system allowing built-in and custom tasks
- Integrate midnight-node toolkit as the core execution engine
- Add help system and command discovery
- Implement verbose/quiet output modes and logging

## Impact
- Affected specs: `core-cli` (new capability)
- Affected code: New `packages/nightcap-core` package
- Dependencies: midnight-node toolkit, Commander.js or similar CLI framework
