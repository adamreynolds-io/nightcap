## 1. Compile Task
- [x] 1.1 Implement `nightcap compile` task
- [x] 1.2 Add contract source discovery from configured paths
- [x] 1.3 Implement dependency resolution between contracts
- [x] 1.4 Add `--force` flag to bypass cache

## 2. Compiler Integration
- [x] 2.1 Integrate `compactc` binary (subprocess execution)
- [x] 2.2 Detect installed compactc and version
- [x] 2.3 Implement compiler download from GitHub releases (stable)
- [x] 2.4 Implement compiler download from prerelease directory
- [x] 2.5 Support platform detection (macOS arm64/x86_64, Linux x86_64)
- [x] 2.6 Store managed compiler versions in `~/.nightcap/compilers/`
- [x] 2.7 Support pinning compiler version via config
- [x] 2.8 Add `nightcap compiler:install <version>` command
- [x] 2.9 Add `--prerelease` flag for prerelease versions
- [x] 2.10 Add `nightcap compiler:list` to show installed versions

## 3. Artifact Generation
- [x] 3.1 Generate compiled contract artifacts (bytecode, ABI equivalent)
- [x] 3.2 Generate ZK circuit artifacts
- [x] 3.3 Store artifacts in `artifacts/` directory with metadata
- [x] 3.4 Generate source maps for debugging

## 4. TypeScript Integration
- [x] 4.1 Generate TypeScript declaration files for contracts
- [x] 4.2 Create typed contract factories
- [x] 4.3 Integrate with midnight-js types
- [x] 4.4 Support IDE autocomplete for contract methods

## 5. Caching
- [x] 5.1 Implement compilation cache based on source hash
- [x] 5.2 Add cache invalidation on compiler version change
- [x] 5.3 Store cache in `.nightcap/cache/`
- [x] 5.4 Add `nightcap clean` task to clear cache

## 6. Error Handling
- [x] 6.1 Format compilation errors with source context
- [x] 6.2 Highlight error location in source file
- [x] 6.3 Provide actionable error messages
- [x] 6.4 Support IDE integration for error reporting (--error-format gcc/json/vscode)

## 7. Testing
- [x] 7.1 Unit tests for compilation pipeline
- [x] 7.2 Integration tests with sample contracts
- [x] 7.3 Cache invalidation tests
