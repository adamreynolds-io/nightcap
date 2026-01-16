## 1. Compile Task
- [ ] 1.1 Implement `nightcap compile` task
- [ ] 1.2 Add contract source discovery from configured paths
- [ ] 1.3 Implement dependency resolution between contracts
- [ ] 1.4 Add `--force` flag to bypass cache

## 2. Compiler Integration
- [ ] 2.1 Integrate `compactc` binary (subprocess execution)
- [ ] 2.2 Detect installed compactc and version
- [ ] 2.3 Implement compiler download from GitHub releases (stable)
- [ ] 2.4 Implement compiler download from prerelease directory
- [ ] 2.5 Support platform detection (macOS arm64/x86_64, Linux x86_64)
- [ ] 2.6 Store managed compiler versions in `~/.nightcap/compilers/`
- [ ] 2.7 Support pinning compiler version via config
- [ ] 2.8 Add `nightcap compiler install <version>` command
- [ ] 2.9 Add `--prerelease` flag for prerelease versions
- [ ] 2.10 Add `nightcap compiler list` to show installed versions

## 3. Artifact Generation
- [ ] 3.1 Generate compiled contract artifacts (bytecode, ABI equivalent)
- [ ] 3.2 Generate ZK circuit artifacts
- [ ] 3.3 Store artifacts in `artifacts/` directory with metadata
- [ ] 3.4 Generate source maps for debugging

## 4. TypeScript Integration
- [ ] 4.1 Generate TypeScript declaration files for contracts
- [ ] 4.2 Create typed contract factories
- [ ] 4.3 Integrate with midnight-js types
- [ ] 4.4 Support IDE autocomplete for contract methods

## 5. Caching
- [ ] 5.1 Implement compilation cache based on source hash
- [ ] 5.2 Add cache invalidation on compiler version change
- [ ] 5.3 Store cache in `.nightcap/cache/`
- [ ] 5.4 Add `nightcap clean` task to clear cache

## 6. Error Handling
- [ ] 6.1 Format compilation errors with source context
- [ ] 6.2 Highlight error location in source file
- [ ] 6.3 Provide actionable error messages
- [ ] 6.4 Support IDE integration for error reporting

## 7. Testing
- [ ] 7.1 Unit tests for compilation pipeline
- [ ] 7.2 Integration tests with sample contracts
- [ ] 7.3 Cache invalidation tests
