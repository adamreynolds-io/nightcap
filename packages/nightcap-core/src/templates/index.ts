/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Template types available for project initialization
 */
export type TemplateType = 'basic' | 'dapp' | 'library';

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
  const pkg: Record<string, unknown> = {
    name: config.name,
    version: '0.0.1',
    description: config.description ?? `A Midnight blockchain project`,
    type: 'module',
    scripts: {
      build: 'nightcap compile',
      test: 'nightcap test',
      node: 'nightcap node',
      deploy: 'nightcap deploy',
    },
    keywords: ['midnight', 'blockchain', 'compact'],
    license: 'MIT',
    devDependencies: {
      '@nightcap/core': '^0.0.1',
      typescript: '^5.7.0',
    },
  };

  if (config.template === 'dapp') {
    pkg['dependencies'] = {
      '@midnight-ntwrk/midnight-js-contracts': '^0.1.0',
      '@midnight-ntwrk/midnight-js-types': '^0.1.0',
    };
  }

  if (config.template === 'library') {
    pkg['main'] = './dist/index.js';
    pkg['types'] = './dist/index.d.ts';
    pkg['files'] = ['dist', 'contracts'];
    pkg['scripts'] = {
      ...pkg['scripts'] as Record<string, string>,
      prepublishOnly: 'nightcap compile',
    };
  }

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
  return `// Counter.compact
// A simple counter contract demonstrating state management

pragma language 0.1.0;

contract Counter {
    // Private state - only the contract can access
    private var count: Int;

    // Initialize the counter
    constructor() {
        count = 0;
    }

    // Increment the counter
    transition increment() {
        count = count + 1;
    }

    // Decrement the counter
    transition decrement() {
        require(count > 0, "Counter cannot go below zero");
        count = count - 1;
    }

    // Get the current count
    view get_count(): Int {
        return count;
    }
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

  // src/index.ts - Main entry point
  files.push({
    path: 'src/index.ts',
    content: `/**
 * ${config.name} - Midnight dApp
 */

export * from './contract.js';

console.log('${config.name} dApp initialized');
`,
  });

  // src/contract.ts - Contract interaction wrapper
  files.push({
    path: 'src/contract.ts',
    content: `/**
 * Contract interaction utilities
 */

// TODO: Import compiled contract types
// import { Counter } from '../artifacts/Counter';

export interface ContractConfig {
  nodeUrl: string;
  indexerUrl: string;
}

export async function connectToCounter(address: string, config: ContractConfig) {
  // TODO: Implement contract connection
  console.log('Connecting to Counter at', address);
  return {
    address,
    // Add contract methods here
  };
}
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
