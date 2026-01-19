/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Template types available for project initialization
 */
export type TemplateType = 'basic' | 'dapp' | 'library';

/**
 * Interface types for dApp template
 */
export type DappInterface = 'cli' | 'react';

/**
 * Template metadata
 */
export interface TemplateInfo {
  name: TemplateType;
  displayName: string;
  description: string;
}

/**
 * Available templates
 */
export const TEMPLATES: TemplateInfo[] = [
  {
    name: 'basic',
    displayName: 'Basic',
    description: 'Simple project with a single contract and test',
  },
  {
    name: 'dapp',
    displayName: 'DApp',
    description: 'Full dApp with contracts, tests, and TypeScript frontend scaffold',
  },
  {
    name: 'library',
    displayName: 'Library',
    description: 'Reusable contract library for publishing to npm',
  },
];

/**
 * Project configuration from user input
 */
export interface ProjectConfig {
  name: string;
  template: TemplateType;
  description?: string;
  /** Interface types for dApp template */
  interfaces?: DappInterface[];
}

/**
 * Generated file content
 */
export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Generate nightcap.config.ts content
 */
export function generateConfig(_config: ProjectConfig): string {
  return `/**
 * Nightcap configuration file
 * @see https://docs.midnight.network/nightcap/config
 */
import { type NightcapConfig } from '@nightcap/core';

const config: NightcapConfig = {
  defaultNetwork: 'localnet',

  paths: {
    sources: './contracts',
    artifacts: './artifacts',
    deploy: './deploy',
  },

  // Uncomment to customize Docker ports
  // docker: {
  //   ports: {
  //     nodeRpc: 9944,
  //     nodeWs: 9933,
  //     indexer: 8080,
  //     proofServer: 6300,
  //   },
  // },
};

export default config;
`;
}

/**
 * Generate package.json content
 */
export function generatePackageJson(config: ProjectConfig): string {
  const scripts: Record<string, string> = {
    build: 'nightcap compile',
    test: 'nightcap test',
    node: 'nightcap node',
    deploy: 'nightcap deploy',
  };

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {
    '@nightcap/core': '^0.0.1',
    typescript: '^5.7.0',
  };

  const pkg: Record<string, unknown> = {
    name: config.name,
    version: '0.0.1',
    description: config.description ?? `A Midnight blockchain project`,
    type: 'module',
    keywords: ['midnight', 'blockchain', 'compact'],
    license: 'MIT',
  };

  if (config.template === 'dapp') {
    dependencies['@midnight-ntwrk/midnight-js-contracts'] = '^0.1.0';
    dependencies['@midnight-ntwrk/midnight-js-types'] = '^0.1.0';

    const interfaces = config.interfaces ?? [];

    // CLI interface
    if (interfaces.includes('cli')) {
      pkg['bin'] = {
        [config.name]: './dist/cli.js',
      };
      scripts['cli'] = `node ./dist/cli.js`;
      dependencies['commander'] = '^12.0.0';
    }

    // React interface
    if (interfaces.includes('react')) {
      scripts['dev'] = 'cd web && npm run dev';
      scripts['build:web'] = 'cd web && npm run build';
    }
  }

  if (config.template === 'library') {
    pkg['main'] = './dist/index.js';
    pkg['types'] = './dist/index.d.ts';
    pkg['files'] = ['dist', 'contracts'];
    scripts['prepublishOnly'] = 'nightcap compile';
  }

  pkg['scripts'] = scripts;
  if (Object.keys(dependencies).length > 0) {
    pkg['dependencies'] = dependencies;
  }
  pkg['devDependencies'] = devDependencies;

  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Generate tsconfig.json content
 */
export function generateTsConfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist", "artifacts"]
}
`;
}

/**
 * Generate .gitignore content
 */
export function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Build outputs
dist/
artifacts/

# Nightcap
.nightcap/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local
.env.*.local

# Test coverage
coverage/
`;
}

/**
 * Generate sample Counter contract
 */
export function generateCounterContract(): string {
  return `/*
 * Counter.compact
 * A simple counter contract using the Compact standard library
 */

pragma language_version >= 0.16 && <= 0.18;

import CompactStandardLibrary;

// Export the counter ledger state
export ledger counter: Counter;

// Increment the counter by 1
export circuit increment(): [] {
  counter.increment(1);
}

// Decrement the counter by 1
export circuit decrement(): [] {
  counter.decrement(1);
}

// Get the current count (view-only)
export circuit get_count(): Uint<64> {
  return counter.value();
}
`;
}

/**
 * Generate sample test file
 */
export function generateCounterTest(): string {
  return `/**
 * Counter contract tests
 */
import { describe, it, expect, beforeAll } from 'vitest';

describe('Counter', () => {
  beforeAll(async () => {
    // Start local network if not running
    // await nightcap.node.start();
  });

  it('should initialize with count of 0', async () => {
    // TODO: Deploy contract and verify initial state
    // const counter = await Counter.deploy();
    // expect(await counter.get_count()).toBe(0);
    expect(true).toBe(true); // Placeholder
  });

  it('should increment the counter', async () => {
    // TODO: Test increment
    // await counter.increment();
    // expect(await counter.get_count()).toBe(1);
    expect(true).toBe(true); // Placeholder
  });

  it('should decrement the counter', async () => {
    // TODO: Test decrement
    // await counter.decrement();
    // expect(await counter.get_count()).toBe(0);
    expect(true).toBe(true); // Placeholder
  });

  it('should not decrement below zero', async () => {
    // TODO: Test error case
    // await expect(counter.decrement()).rejects.toThrow();
    expect(true).toBe(true); // Placeholder
  });
});
`;
}

/**
 * Generate README.md content
 */
export function generateReadme(config: ProjectConfig): string {
  return `# ${config.name}

${config.description ?? 'A Midnight blockchain project built with Nightcap.'}

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker (for local development)
- Nightcap CLI

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

Start the local Midnight network:

\`\`\`bash
npm run node
# or
nightcap node
\`\`\`

### Compile Contracts

\`\`\`bash
npm run build
# or
nightcap compile
\`\`\`

### Run Tests

\`\`\`bash
npm test
# or
nightcap test
\`\`\`

### Deploy

\`\`\`bash
npm run deploy
# or
nightcap deploy --network <network-name>
\`\`\`

## Project Structure

\`\`\`
${config.name}/
├── contracts/          # Compact contract source files
│   └── Counter.compact
├── test/               # Test files
│   └── Counter.test.ts
├── artifacts/          # Compiled contract artifacts (generated)
├── deploy/             # Deployment scripts
├── nightcap.config.ts  # Nightcap configuration
└── package.json
\`\`\`

## Resources

- [Midnight Documentation](https://docs.midnight.network)
- [Nightcap CLI Guide](https://docs.midnight.network/nightcap)
- [Compact Language Reference](https://docs.midnight.network/compact)

## License

MIT
`;
}

/**
 * Generate dApp-specific files
 */
export function generateDappFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const interfaces = config.interfaces ?? [];

  // src/index.ts - Main entry point
  files.push({
    path: 'src/index.ts',
    content: `/**
 * ${config.name} - Midnight dApp
 */

export * from './contract.js';
`,
  });

  // src/contract.ts - Contract interaction wrapper
  files.push({
    path: 'src/contract.ts',
    content: `/**
 * Contract interaction utilities
 */

// TODO: Import compiled contract types after running 'nightcap compile'
// import { Counter } from '../artifacts/Counter';

export interface ContractConfig {
  nodeUrl: string;
  indexerUrl: string;
  proofServerUrl: string;
}

export const DEFAULT_CONFIG: ContractConfig = {
  nodeUrl: 'http://localhost:9944',
  indexerUrl: 'http://localhost:8080/api/v1/graphql',
  proofServerUrl: 'http://localhost:6300',
};

export async function connectToCounter(address: string, config: ContractConfig = DEFAULT_CONFIG) {
  console.log('Connecting to Counter at', address);
  console.log('Using config:', config);
  // TODO: Implement contract connection using midnight-js
  return {
    address,
    config,
  };
}
`,
  });

  // CLI interface files
  if (interfaces.includes('cli')) {
    files.push(...generateCliFiles(config));
  }

  // React interface files
  if (interfaces.includes('react')) {
    files.push(...generateReactFiles(config));
  }

  return files;
}

/**
 * Generate CLI interface files
 */
export function generateCliFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // src/cli.ts - CLI entry point
  files.push({
    path: 'src/cli.ts',
    content: `#!/usr/bin/env node
/**
 * ${config.name} CLI
 */

import { Command } from 'commander';
import { DEFAULT_CONFIG, connectToCounter } from './contract.js';

const program = new Command();

program
  .name('${config.name}')
  .description('CLI for ${config.name} Midnight dApp')
  .version('0.0.1');

program
  .command('status')
  .description('Show contract status')
  .option('-a, --address <address>', 'Contract address')
  .option('--node-url <url>', 'Node RPC URL', DEFAULT_CONFIG.nodeUrl)
  .option('--indexer-url <url>', 'Indexer URL', DEFAULT_CONFIG.indexerUrl)
  .action(async (options) => {
    console.log('Checking contract status...');
    if (options.address) {
      const contract = await connectToCounter(options.address, {
        nodeUrl: options.nodeUrl,
        indexerUrl: options.indexerUrl,
        proofServerUrl: DEFAULT_CONFIG.proofServerUrl,
      });
      console.log('Contract:', contract);
    } else {
      console.log('No contract address specified. Use --address <address>');
    }
  });

program
  .command('increment')
  .description('Increment the counter')
  .requiredOption('-a, --address <address>', 'Contract address')
  .action(async (options) => {
    console.log('Incrementing counter at', options.address);
    // TODO: Implement increment using midnight-js
  });

program
  .command('decrement')
  .description('Decrement the counter')
  .requiredOption('-a, --address <address>', 'Contract address')
  .action(async (options) => {
    console.log('Decrementing counter at', options.address);
    // TODO: Implement decrement using midnight-js
  });

program.parse();
`,
  });

  return files;
}

/**
 * Generate React web app files
 */
export function generateReactFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // web/package.json
  files.push({
    path: 'web/package.json',
    content: JSON.stringify({
      name: `${config.name}-web`,
      private: true,
      version: '0.0.1',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.0',
        'react-dom': '^18.3.0',
      },
      devDependencies: {
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.0',
        typescript: '^5.7.0',
        vite: '^6.0.0',
      },
    }, null, 2) + '\n',
  });

  // web/index.html
  files.push({
    path: 'web/index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  });

  // web/vite.config.ts
  files.push({
    path: 'web/vite.config.ts',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
`,
  });

  // web/tsconfig.json
  files.push({
    path: 'web/tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
    }, null, 2) + '\n',
  });

  // web/src/main.tsx
  files.push({
    path: 'web/src/main.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  });

  // web/src/App.tsx
  files.push({
    path: 'web/src/App.tsx',
    content: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    // TODO: Implement wallet connection
    console.log('Connecting wallet...');
    setConnected(true);
  };

  const handleIncrement = async () => {
    // TODO: Call contract increment
    console.log('Incrementing...');
    setCount(c => c + 1);
  };

  const handleDecrement = async () => {
    // TODO: Call contract decrement
    console.log('Decrementing...');
    setCount(c => Math.max(0, c - 1));
  };

  return (
    <div className="app">
      <h1>${config.name}</h1>
      <p>A Midnight blockchain dApp</p>

      {!connected ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <div className="counter">
          <h2>Counter: {count}</h2>
          <div className="buttons">
            <button onClick={handleDecrement}>-</button>
            <button onClick={handleIncrement}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
`,
  });

  // web/src/index.css
  files.push({
    path: 'web/src/index.css',
    content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.app h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: #ffffff;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

.counter {
  margin-top: 2rem;
}

.counter h2 {
  font-size: 2em;
  margin-bottom: 1rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.buttons button {
  font-size: 1.5em;
  padding: 0.5em 1em;
  min-width: 60px;
}
`,
  });

  // web/.gitignore
  files.push({
    path: 'web/.gitignore',
    content: `node_modules/
dist/
`,
  });

  return files;
}

/**
 * Generate library-specific files
 */
export function generateLibraryFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // src/index.ts - Library exports
  files.push({
    path: 'src/index.ts',
    content: `/**
 * ${config.name} - Midnight Contract Library
 *
 * This library provides reusable contracts for Midnight blockchain development.
 */

// Export contract artifacts
// export * from '../artifacts/Counter';

// Export utilities
export const VERSION = '0.0.1';
`,
  });

  return files;
}

/**
 * Get all files to generate for a template
 */
export function getTemplateFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [
    { path: 'nightcap.config.ts', content: generateConfig(config) },
    { path: 'package.json', content: generatePackageJson(config) },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: '.gitignore', content: generateGitignore() },
    { path: 'README.md', content: generateReadme(config) },
    { path: 'contracts/Counter.compact', content: generateCounterContract() },
    { path: 'test/Counter.test.ts', content: generateCounterTest() },
  ];

  // Add template-specific files
  if (config.template === 'dapp') {
    files.push(...generateDappFiles(config));
  } else if (config.template === 'library') {
    files.push(...generateLibraryFiles(config));
  }

  // Create empty directories
  files.push({ path: 'artifacts/.gitkeep', content: '' });
  files.push({ path: 'deploy/.gitkeep', content: '' });

  return files;
}

// =============================================================================
// Contract-Aware Template Generation (for --from-contract)
// =============================================================================

/**
 * Circuit information for template generation
 */
export interface CircuitInfoForTemplate {
  name: string;
  isImpure: boolean;
}

/**
 * Loaded contract information for template generation
 */
export interface LoadedContractForTemplate {
  name: string;
  circuits: CircuitInfoForTemplate[];
  modulePath: string;
}

/**
 * Generate files for a project scaffolded from an existing compiled contract
 */
export function getContractAwareTemplateFiles(
  config: ProjectConfig,
  contract: LoadedContractForTemplate
): GeneratedFile[] {
  const files: GeneratedFile[] = [
    { path: 'nightcap.config.ts', content: generateConfig(config) },
    { path: 'package.json', content: generateContractAwarePackageJson(config, contract) },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: '.gitignore', content: generateGitignore() },
    { path: 'README.md', content: generateContractAwareReadme(config, contract) },
  ];

  // Generate contract wrapper and circuit handlers
  files.push(...generateContractAwareFiles(config, contract));

  // Generate test file
  files.push({
    path: `test/${contract.name}.test.ts`,
    content: generateContractAwareTest(config, contract),
  });

  // Create directories (artifacts will be copied separately)
  files.push({ path: 'deploy/.gitkeep', content: '' });

  return files;
}

/**
 * Generate package.json for contract-aware project
 */
export function generateContractAwarePackageJson(
  config: ProjectConfig,
  contract: LoadedContractForTemplate
): string {
  const scripts: Record<string, string> = {
    build: 'tsc',
    test: 'vitest run',
    'test:watch': 'vitest',
  };

  const dependencies: Record<string, string> = {
    '@midnight-ntwrk/midnight-js-contracts': '^0.1.0',
    '@midnight-ntwrk/midnight-js-types': '^0.1.0',
  };

  const devDependencies: Record<string, string> = {
    '@nightcap/core': '^0.0.1',
    typescript: '^5.7.0',
    vitest: '^2.0.0',
  };

  const pkg: Record<string, unknown> = {
    name: config.name,
    version: '0.0.1',
    description: config.description ?? `A Midnight dApp using the ${contract.name} contract`,
    type: 'module',
    keywords: ['midnight', 'blockchain', 'compact', contract.name.toLowerCase()],
    license: 'MIT',
    scripts,
    dependencies,
    devDependencies,
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Generate README for contract-aware project
 */
export function generateContractAwareReadme(
  config: ProjectConfig,
  contract: LoadedContractForTemplate
): string {
  const impureCircuits = contract.circuits.filter((c) => c.isImpure);
  const witnesses = contract.circuits.filter((c) => !c.isImpure);

  let circuitDocs = '';
  if (impureCircuits.length > 0) {
    circuitDocs += `\n### Circuits (State-Modifying)\n\n`;
    for (const circuit of impureCircuits) {
      circuitDocs += `- \`${circuit.name}\` - TODO: Add description\n`;
    }
  }
  if (witnesses.length > 0) {
    circuitDocs += `\n### Witnesses (Pure Functions)\n\n`;
    for (const witness of witnesses) {
      circuitDocs += `- \`${witness.name}\` - TODO: Add description\n`;
    }
  }

  return `# ${config.name}

${config.description ?? `A Midnight dApp built on the ${contract.name} contract.`}

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker (for local development)
- Nightcap CLI

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

Start the local Midnight network:

\`\`\`bash
nightcap node
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Run Tests

\`\`\`bash
npm test
\`\`\`

## Contract: ${contract.name}
${circuitDocs}
## Project Structure

\`\`\`
${config.name}/
├── artifacts/
│   └── ${contract.name}/        # Compiled contract artifacts
├── src/
│   ├── index.ts                 # Main entry point
│   ├── contract.ts              # Contract wrapper with typed interface
│   └── circuits/
│       ├── index.ts             # Re-exports all circuit handlers
${impureCircuits.map((c) => `│       └── ${c.name}.ts           # Handler for ${c.name} circuit`).join('\n')}
├── test/
│   └── ${contract.name}.test.ts # Contract tests
├── nightcap.config.ts           # Nightcap configuration
└── package.json
\`\`\`

## Resources

- [Midnight Documentation](https://docs.midnight.network)
- [Nightcap CLI Guide](https://docs.midnight.network/nightcap)
- [Compact Language Reference](https://docs.midnight.network/compact)

## License

MIT
`;
}

/**
 * Generate contract-aware source files
 */
export function generateContractAwareFiles(
  config: ProjectConfig,
  contract: LoadedContractForTemplate
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const impureCircuits = contract.circuits.filter((c) => c.isImpure);

  // src/index.ts - Main entry point
  files.push({
    path: 'src/index.ts',
    content: `/**
 * ${config.name} - Midnight dApp
 * @generated from ${contract.name} contract
 */

export * from './contract.js';
export * from './circuits/index.js';
`,
  });

  // src/contract.ts - Typed contract wrapper
  files.push({
    path: 'src/contract.ts',
    content: generateContractWrapper(config, contract),
  });

  // src/circuits/index.ts - Re-export all circuit handlers
  files.push({
    path: 'src/circuits/index.ts',
    content: generateCircuitsIndex(contract),
  });

  // src/circuits/{circuitName}.ts - Individual circuit handlers
  for (const circuit of impureCircuits) {
    files.push({
      path: `src/circuits/${circuit.name}.ts`,
      content: generateCircuitHandler(config, contract, circuit),
    });
  }

  return files;
}

/**
 * Generate contract wrapper (src/contract.ts)
 */
function generateContractWrapper(
  _config: ProjectConfig,
  contract: LoadedContractForTemplate
): string {
  const pascalName = toPascalCase(contract.name);

  return `/**
 * Contract wrapper for ${contract.name}
 * @generated from compiled contract
 */

// Re-export the compiled contract
export * as ${pascalName} from '../artifacts/${contract.name}/contract/index.cjs';

/**
 * Contract configuration for connecting to ${contract.name}
 */
export interface ContractConfig {
  nodeUrl: string;
  indexerUrl: string;
  proofServerUrl: string;
}

/**
 * Default configuration for local development
 */
export const DEFAULT_CONFIG: ContractConfig = {
  nodeUrl: 'http://localhost:9944',
  indexerUrl: 'http://localhost:8080/api/v1/graphql',
  proofServerUrl: 'http://localhost:6300',
};

/**
 * Deployed contract instance type
 * TODO: Replace with actual midnight-js types
 */
export interface DeployedContract {
  address: string;
  config: ContractConfig;
}

/**
 * Connect to a deployed ${contract.name} contract
 */
export async function connect${pascalName}(
  address: string,
  config: ContractConfig = DEFAULT_CONFIG
): Promise<DeployedContract> {
  // TODO: Implement using midnight-js
  console.log('Connecting to ${contract.name} at', address);
  return {
    address,
    config,
  };
}
`;
}

/**
 * Generate circuits index file (src/circuits/index.ts)
 */
function generateCircuitsIndex(contract: LoadedContractForTemplate): string {
  const impureCircuits = contract.circuits.filter((c) => c.isImpure);

  if (impureCircuits.length === 0) {
    return `/**
 * Circuit handlers for ${contract.name}
 * @generated from compiled contract
 */

// No impure circuits found in this contract
export {};
`;
  }

  const exports = impureCircuits.map((c) => `export * from './${c.name}.js';`).join('\n');

  return `/**
 * Circuit handlers for ${contract.name}
 * @generated from compiled contract
 */

${exports}
`;
}

/**
 * Generate individual circuit handler file
 */
function generateCircuitHandler(
  _config: ProjectConfig,
  contract: LoadedContractForTemplate,
  circuit: CircuitInfoForTemplate
): string {
  const pascalCircuitName = toPascalCase(circuit.name);

  return `/**
 * Handler for ${circuit.name} circuit
 * @generated from ${contract.name} compiled contract
 */

import type { DeployedContract } from '../contract.js';

/**
 * Parameters for calling ${circuit.name}
 * TODO: Define based on circuit signature
 */
export interface ${pascalCircuitName}Params {
  // Add circuit parameters here
}

/**
 * Result from ${circuit.name} circuit call
 * TODO: Define based on circuit return type
 */
export interface ${pascalCircuitName}Result {
  // Add result fields here
  success: boolean;
}

/**
 * Call the ${circuit.name} circuit on a deployed contract
 *
 * @param contract - The deployed contract instance
 * @param params - Parameters for the circuit call
 * @returns Result of the circuit execution
 */
export async function ${circuit.name}(
  contract: DeployedContract,
  params: ${pascalCircuitName}Params
): Promise<${pascalCircuitName}Result> {
  // TODO: Implement circuit call using midnight-js
  // Example:
  // const result = await contract.callTx.${circuit.name}(...args);

  console.log('Calling ${circuit.name} on', contract.address, 'with params:', params);

  return {
    success: true,
  };
}
`;
}

/**
 * Generate test file for contract-aware project
 */
function generateContractAwareTest(
  _config: ProjectConfig,
  contract: LoadedContractForTemplate
): string {
  const pascalName = toPascalCase(contract.name);
  const impureCircuits = contract.circuits.filter((c) => c.isImpure);

  let testCases = '';
  for (const circuit of impureCircuits) {
    testCases += `
  it('should call ${circuit.name} circuit', async () => {
    // TODO: Implement test
    // const result = await ${circuit.name}(contract, {});
    // expect(result.success).toBe(true);
    expect(true).toBe(true); // Placeholder
  });
`;
  }

  if (testCases === '') {
    testCases = `
  it('should deploy the contract', async () => {
    // TODO: Implement deployment test
    expect(true).toBe(true); // Placeholder
  });
`;
  }

  return `/**
 * ${contract.name} contract tests
 * @generated from compiled contract
 */

import { describe, it, expect, beforeAll } from 'vitest';
// import { connect${pascalName} } from '../src/contract.js';

describe('${contract.name}', () => {
  // let contract: Awaited<ReturnType<typeof connect${pascalName}>>;

  beforeAll(async () => {
    // TODO: Deploy contract or connect to existing
    // contract = await connect${pascalName}('contract-address');
  });
${testCases}
});
`;
}

/**
 * Convert a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}
