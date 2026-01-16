## Context
Nightcap's value grows with its ecosystem. A well-designed plugin system enables community contributions while keeping core code focused. The midnight-js library provides essential dApp development utilities that should be available through a first-party plugin.

**Stakeholders:** Plugin developers, dApp developers, Midnight Foundation

## Goals / Non-Goals

**Goals:**
- Enable third-party extensions without core modifications
- Provide midnight-js integration as reference plugin
- Support task customization and addition
- Allow configuration schema extension

**Non-Goals:**
- Build a plugin marketplace (future consideration)
- Support runtime plugin loading (config-time only)
- Maintain backward compatibility with Hardhat plugins

## Decisions

### Decision: Plugin as Configuration Extension
Plugins are declared in `nightcap.config.ts` and loaded at startup. This follows Hardhat's pattern and enables type-safe configuration.

```typescript
// nightcap.config.ts
import "@nightcap/plugin-midnight-js";

const config: NightcapConfig = {
  // Plugin adds its own config sections
  midnightJs: {
    indexer: "https://indexer.testnet.midnight.network",
    proofServer: "http://localhost:6300"
  }
};
```

**Alternatives considered:**
- Runtime plugin loading: More complex, less type-safe
- CLI plugin flags: Poor discoverability, no persistent config

### Decision: midnight-js Plugin Architecture
The plugin integrates multiple midnight-js packages to provide comprehensive dApp development support:

```
@nightcap/plugin-midnight-js
├── contracts (typed contract interaction)
├── types (TypeScript definitions)
├── indexer-public-data-provider (blockchain queries)
├── http-client-proof-provider (proof generation)
├── level-private-state-provider (persistent private state)
└── fetch-zk-config-provider (ZK artifacts)
```

### Decision: Extension Points
Plugins extend Nightcap through well-defined hooks:

1. **Tasks**: Register new tasks or override existing ones
2. **Config**: Add new configuration sections with validation
3. **Runtime**: Extend the runtime environment available to tasks
4. **Types**: Provide TypeScript augmentation for config and runtime

## Plugin API

```typescript
// Plugin interface
interface NightcapPlugin {
  name: string;
  version: string;

  // Called when plugin is loaded
  setup(nightcap: NightcapRuntimeEnvironment): void | Promise<void>;

  // Optional: extend config schema
  extendConfig?(config: NightcapConfig): void;

  // Optional: add tasks
  tasks?: TaskDefinition[];

  // Optional: extend runtime
  extendEnvironment?(env: NightcapRuntimeEnvironment): void;
}

// midnight-js plugin example usage
import { getContractFactory, MidnightProvider } from "@nightcap/plugin-midnight-js";

// In tests or scripts
const Counter = await getContractFactory("Counter");
const counter = await Counter.deploy();
await counter.increment();
const value = await counter.getValue();
```

## Runtime Extensions by midnight-js Plugin

The plugin adds the following to the Nightcap runtime:

```typescript
interface NightcapRuntimeEnvironment {
  // Added by @nightcap/plugin-midnight-js
  midnight: {
    // Contract interaction
    getContractFactory<T>(name: string): Promise<ContractFactory<T>>;
    getContractAt<T>(name: string, address: string): Promise<T>;

    // Providers
    indexer: IndexerPublicDataProvider;
    proofServer: HttpClientProofProvider;
    privateState: LevelPrivateStateProvider;
    zkConfig: FetchZkConfigProvider;

    // Network info
    networkId: NetworkId;
  };
}
```

## Risks / Trade-offs

- **Risk:** Plugin API changes break ecosystem
  - *Mitigation:* Semantic versioning, deprecation warnings, migration guides

- **Risk:** Plugins conflict with each other
  - *Mitigation:* Namespace isolation, explicit override declarations

- **Risk:** midnight-js version mismatches
  - *Mitigation:* Peer dependencies, version compatibility matrix

## Open Questions
- Should plugins be able to modify compilation output?
- How to handle plugin-specific CLI flags?
- Should we provide a plugin compatibility testing framework?
