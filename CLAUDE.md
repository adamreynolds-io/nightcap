<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Documentation Guidelines

**Always update documentation when adding or changing features.**

When you add a new command, modify an existing command, change configuration options, or add new functionality:

1. Update the relevant file in `docs/`:
   - `docs/commands.md` - For CLI command changes
   - `docs/configuration.md` - For config option changes
   - `docs/plugins.md` - For plugin API changes
   - `docs/getting-started.md` - For workflow changes
   - `docs/troubleshooting.md` - For new error messages or common issues

2. Keep documentation in sync with code:
   - Parameter names and types must match the implementation
   - Default values must be accurate
   - Examples should be tested and working

3. Update package READMEs if the public API changes:
   - `packages/nightcap-core/README.md`
   - `packages/docker-orchestrator/README.md`