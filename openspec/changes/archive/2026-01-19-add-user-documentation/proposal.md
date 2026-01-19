# Change: Add User Documentation

## Why
Nightcap lacks comprehensive user documentation, making it difficult for new users to get started and for existing users to reference commands, configuration options, and plugin development patterns.

## What Changes
- Add `docs/` folder with comprehensive documentation
- Create getting started guide with installation and first project walkthrough
- Create command reference for all 19 CLI commands
- Create configuration reference with all interfaces and examples
- Create plugin development guide with hook handlers and examples
- Create troubleshooting guide for common issues
- Update root README with quick start and documentation links
- Add package READMEs for nightcap-core and docker-orchestrator
- Add documentation guidelines to CLAUDE.md requiring docs updates with features

## Impact
- Affected specs: None (new capability)
- Affected code: `docs/`, `README.md`, `CLAUDE.md`, `packages/*/README.md`
