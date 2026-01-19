# Change: Add Interactive Console

## Why
Developers need an interactive REPL (Read-Eval-Print Loop) for exploring contracts, testing transactions, and debugging without writing full scripts. Hardhat provides `hardhat console` for this purpose, and Nightcap should offer equivalent functionality for Midnight development.

## What Changes
- Add `nightcap console` command that starts an interactive Node.js REPL
- Pre-load Nightcap runtime with network connection and contract utilities
- Provide helpers for contract interaction (deploy, call, query)
- Support connecting to any configured network
- Include command history and auto-completion
- Support both JavaScript and TypeScript expressions

## Impact
- Affected specs: None (new capability)
- Affected code: `packages/nightcap-core/src/tasks/builtin/console.ts`
- Dependencies: Node.js REPL module, compiled contract artifacts
