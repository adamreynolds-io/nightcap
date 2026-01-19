/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  generateConfig,
  generatePackageJson,
  generateTsConfig,
  generateGitignore,
  generateCounterContract,
  generateCounterTest,
  generateReadme,
  generateDappFiles,
  generateLibraryFiles,
  generateCliFiles,
  generateReactFiles,
  getTemplateFiles,
  getContractAwareTemplateFiles,
  generateContractAwarePackageJson,
  generateContractAwareReadme,
  generateContractAwareFiles,
  type ProjectConfig,
  type LoadedContractForTemplate,
} from './index.js';

describe('TEMPLATES', () => {
  it('should have three templates', () => {
    expect(TEMPLATES).toHaveLength(3);
  });

  it('should have basic template', () => {
    const basic = TEMPLATES.find((t) => t.name === 'basic');
    expect(basic).toBeDefined();
    expect(basic?.displayName).toBe('Basic');
  });

  it('should have dapp template', () => {
    const dapp = TEMPLATES.find((t) => t.name === 'dapp');
    expect(dapp).toBeDefined();
    expect(dapp?.displayName).toBe('DApp');
  });

  it('should have library template', () => {
    const lib = TEMPLATES.find((t) => t.name === 'library');
    expect(lib).toBeDefined();
    expect(lib?.displayName).toBe('Library');
  });
});

describe('generateConfig', () => {
  it('should generate valid TypeScript config', () => {
    const config: ProjectConfig = { name: 'test-project', template: 'basic' };
    const result = generateConfig(config);

    expect(result).toContain("import { type NightcapConfig }");
    expect(result).toContain("defaultNetwork: 'localnet'");
    expect(result).toContain("sources: './contracts'");
    expect(result).toContain("artifacts: './artifacts'");
    expect(result).toContain('export default config');
  });
});

describe('generatePackageJson', () => {
  it('should generate valid package.json for basic template', () => {
    const config: ProjectConfig = {
      name: 'my-project',
      template: 'basic',
      description: 'My test project',
    };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.name).toBe('my-project');
    expect(pkg.version).toBe('0.0.1');
    expect(pkg.description).toBe('My test project');
    expect(pkg.type).toBe('module');
    expect(pkg.scripts.build).toBe('nightcap compile');
    expect(pkg.scripts.test).toBe('nightcap test');
  });

  it('should add dependencies for dapp template', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp' };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.dependencies).toBeDefined();
    expect(pkg.dependencies['@midnight-ntwrk/midnight-js-contracts']).toBeDefined();
  });

  it('should add publishing config for library template', () => {
    const config: ProjectConfig = { name: 'my-lib', template: 'library' };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.main).toBe('./dist/index.js');
    expect(pkg.types).toBe('./dist/index.d.ts');
    expect(pkg.files).toContain('dist');
    expect(pkg.scripts.prepublishOnly).toBe('nightcap compile');
  });

  it('should use default description if not provided', () => {
    const config: ProjectConfig = { name: 'test', template: 'basic' };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.description).toBe('A Midnight blockchain project');
  });
});

describe('generateTsConfig', () => {
  it('should generate valid tsconfig.json', () => {
    const result = generateTsConfig();
    const tsconfig = JSON.parse(result);

    expect(tsconfig.compilerOptions.target).toBe('ES2022');
    expect(tsconfig.compilerOptions.module).toBe('NodeNext');
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.include).toContain('src/**/*');
    expect(tsconfig.exclude).toContain('node_modules');
  });
});

describe('generateGitignore', () => {
  it('should include common ignores', () => {
    const result = generateGitignore();

    expect(result).toContain('node_modules/');
    expect(result).toContain('dist/');
    expect(result).toContain('artifacts/');
    expect(result).toContain('.nightcap/');
    expect(result).toContain('.env');
    expect(result).toContain('.DS_Store');
  });
});

describe('generateCounterContract', () => {
  it('should generate valid Compact contract', () => {
    const result = generateCounterContract();

    expect(result).toContain('pragma language_version');
    expect(result).toContain('import CompactStandardLibrary');
    expect(result).toContain('export ledger counter: Counter');
    expect(result).toContain('export circuit increment()');
    expect(result).toContain('export circuit decrement()');
    expect(result).toContain('export circuit get_count()');
  });
});

describe('generateCounterTest', () => {
  it('should generate test file with vitest imports', () => {
    const result = generateCounterTest();

    expect(result).toContain("import { describe, it, expect, beforeAll } from 'vitest'");
    expect(result).toContain("describe('Counter'");
    expect(result).toContain('should initialize with count of 0');
    expect(result).toContain('should increment the counter');
  });
});

describe('generateReadme', () => {
  it('should include project name', () => {
    const config: ProjectConfig = {
      name: 'awesome-project',
      template: 'basic',
      description: 'An awesome project',
    };
    const result = generateReadme(config);

    expect(result).toContain('# awesome-project');
    expect(result).toContain('An awesome project');
  });

  it('should include getting started instructions', () => {
    const config: ProjectConfig = { name: 'test', template: 'basic' };
    const result = generateReadme(config);

    expect(result).toContain('npm install');
    expect(result).toContain('nightcap node');
    expect(result).toContain('nightcap compile');
    expect(result).toContain('nightcap test');
  });

  it('should use default description if not provided', () => {
    const config: ProjectConfig = { name: 'test', template: 'basic' };
    const result = generateReadme(config);

    expect(result).toContain('A Midnight blockchain project built with Nightcap');
  });
});

describe('generateDappFiles', () => {
  it('should generate src/index.ts', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp' };
    const files = generateDappFiles(config);

    const indexFile = files.find((f) => f.path === 'src/index.ts');
    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain('my-dapp');
  });

  it('should generate src/contract.ts', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp' };
    const files = generateDappFiles(config);

    const contractFile = files.find((f) => f.path === 'src/contract.ts');
    expect(contractFile).toBeDefined();
    expect(contractFile?.content).toContain('ContractConfig');
    expect(contractFile?.content).toContain('connectToCounter');
  });
});

describe('generateLibraryFiles', () => {
  it('should generate src/index.ts with exports', () => {
    const config: ProjectConfig = { name: 'my-lib', template: 'library' };
    const files = generateLibraryFiles(config);

    const indexFile = files.find((f) => f.path === 'src/index.ts');
    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain('my-lib');
    expect(indexFile?.content).toContain('VERSION');
  });
});

describe('getTemplateFiles', () => {
  it('should return common files for all templates', () => {
    const config: ProjectConfig = { name: 'test', template: 'basic' };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('nightcap.config.ts');
    expect(paths).toContain('package.json');
    expect(paths).toContain('tsconfig.json');
    expect(paths).toContain('.gitignore');
    expect(paths).toContain('README.md');
    expect(paths).toContain('contracts/Counter.compact');
    expect(paths).toContain('test/Counter.test.ts');
  });

  it('should include dapp files for dapp template', () => {
    const config: ProjectConfig = { name: 'test', template: 'dapp' };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/contract.ts');
  });

  it('should include library files for library template', () => {
    const config: ProjectConfig = { name: 'test', template: 'library' };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/index.ts');
  });

  it('should include gitkeep files for empty directories', () => {
    const config: ProjectConfig = { name: 'test', template: 'basic' };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('artifacts/.gitkeep');
    expect(paths).toContain('deploy/.gitkeep');
  });

  it('should include CLI files when cli interface selected', () => {
    const config: ProjectConfig = { name: 'test', template: 'dapp', interfaces: ['cli'] };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/cli.ts');
  });

  it('should include React files when react interface selected', () => {
    const config: ProjectConfig = { name: 'test', template: 'dapp', interfaces: ['react'] };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('web/package.json');
    expect(paths).toContain('web/src/App.tsx');
    expect(paths).toContain('web/src/main.tsx');
  });

  it('should include both CLI and React files when both selected', () => {
    const config: ProjectConfig = { name: 'test', template: 'dapp', interfaces: ['cli', 'react'] };
    const files = getTemplateFiles(config);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/cli.ts');
    expect(paths).toContain('web/package.json');
  });
});

describe('generateCliFiles', () => {
  it('should generate src/cli.ts with Commander.js', () => {
    const config: ProjectConfig = { name: 'my-cli', template: 'dapp' };
    const files = generateCliFiles(config);

    const cliFile = files.find((f) => f.path === 'src/cli.ts');
    expect(cliFile).toBeDefined();
    expect(cliFile?.content).toContain("import { Command } from 'commander'");
    expect(cliFile?.content).toContain('.name(\'my-cli\')');
    expect(cliFile?.content).toContain('.command(\'status\')');
    expect(cliFile?.content).toContain('.command(\'increment\')');
    expect(cliFile?.content).toContain('.command(\'decrement\')');
  });
});

describe('generateReactFiles', () => {
  it('should generate web/package.json with React deps', () => {
    const config: ProjectConfig = { name: 'my-app', template: 'dapp' };
    const files = generateReactFiles(config);

    const pkgFile = files.find((f) => f.path === 'web/package.json');
    expect(pkgFile).toBeDefined();
    const pkg = JSON.parse(pkgFile!.content);
    expect(pkg.name).toBe('my-app-web');
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.devDependencies.vite).toBeDefined();
  });

  it('should generate web/src/App.tsx with counter UI', () => {
    const config: ProjectConfig = { name: 'my-app', template: 'dapp' };
    const files = generateReactFiles(config);

    const appFile = files.find((f) => f.path === 'web/src/App.tsx');
    expect(appFile).toBeDefined();
    expect(appFile?.content).toContain('useState');
    expect(appFile?.content).toContain('handleIncrement');
    expect(appFile?.content).toContain('handleDecrement');
    expect(appFile?.content).toContain('Connect Wallet');
  });

  it('should generate web/vite.config.ts', () => {
    const config: ProjectConfig = { name: 'my-app', template: 'dapp' };
    const files = generateReactFiles(config);

    const viteConfig = files.find((f) => f.path === 'web/vite.config.ts');
    expect(viteConfig).toBeDefined();
    expect(viteConfig?.content).toContain("import react from '@vitejs/plugin-react'");
    expect(viteConfig?.content).toContain('port: 3000');
  });

  it('should generate web/index.html', () => {
    const config: ProjectConfig = { name: 'my-app', template: 'dapp' };
    const files = generateReactFiles(config);

    const htmlFile = files.find((f) => f.path === 'web/index.html');
    expect(htmlFile).toBeDefined();
    expect(htmlFile?.content).toContain('<title>my-app</title>');
    expect(htmlFile?.content).toContain('/src/main.tsx');
  });
});

describe('generatePackageJson with interfaces', () => {
  it('should add CLI dependencies when cli interface selected', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp', interfaces: ['cli'] };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.dependencies.commander).toBeDefined();
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin['my-dapp']).toBe('./dist/cli.js');
    expect(pkg.scripts.cli).toBe('node ./dist/cli.js');
  });

  it('should add React scripts when react interface selected', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp', interfaces: ['react'] };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.scripts.dev).toBe('cd web && npm run dev');
    expect(pkg.scripts['build:web']).toBe('cd web && npm run build');
  });

  it('should add both CLI and React config when both selected', () => {
    const config: ProjectConfig = { name: 'my-dapp', template: 'dapp', interfaces: ['cli', 'react'] };
    const result = generatePackageJson(config);
    const pkg = JSON.parse(result);

    expect(pkg.dependencies.commander).toBeDefined();
    expect(pkg.bin).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts['build:web']).toBeDefined();
  });
});

// Contract-aware template generation tests
describe('Contract-Aware Template Generation', () => {
  const mockContract: LoadedContractForTemplate = {
    name: 'Counter',
    circuits: [
      { name: 'increment', isImpure: true },
      { name: 'decrement', isImpure: true },
      { name: 'getValue', isImpure: false },
    ],
    modulePath: '/path/to/contract/index.cjs',
  };

  const mockConfig: ProjectConfig = {
    name: 'my-counter-app',
    template: 'dapp',
    description: 'A counter dApp',
  };

  describe('getContractAwareTemplateFiles', () => {
    it('should generate all necessary files', () => {
      const files = getContractAwareTemplateFiles(mockConfig, mockContract);
      const paths = files.map((f) => f.path);

      // Common files
      expect(paths).toContain('nightcap.config.ts');
      expect(paths).toContain('package.json');
      expect(paths).toContain('tsconfig.json');
      expect(paths).toContain('.gitignore');
      expect(paths).toContain('README.md');

      // Contract-specific files
      expect(paths).toContain('src/index.ts');
      expect(paths).toContain('src/contract.ts');
      expect(paths).toContain('src/circuits/index.ts');

      // Circuit handlers for impure circuits only
      expect(paths).toContain('src/circuits/increment.ts');
      expect(paths).toContain('src/circuits/decrement.ts');
      expect(paths).not.toContain('src/circuits/getValue.ts');

      // Test file
      expect(paths).toContain('test/Counter.test.ts');
    });

    it('should not include contracts directory', () => {
      const files = getContractAwareTemplateFiles(mockConfig, mockContract);
      const paths = files.map((f) => f.path);

      // Should not include contracts/Counter.compact since we're using existing contract
      const hasContracts = paths.some((p) => p.startsWith('contracts/'));
      expect(hasContracts).toBe(false);
    });
  });

  describe('generateContractAwarePackageJson', () => {
    it('should include midnight-js dependencies', () => {
      const result = generateContractAwarePackageJson(mockConfig, mockContract);
      const pkg = JSON.parse(result);

      expect(pkg.dependencies['@midnight-ntwrk/midnight-js-contracts']).toBeDefined();
      expect(pkg.dependencies['@midnight-ntwrk/midnight-js-types']).toBeDefined();
    });

    it('should use provided project name', () => {
      const result = generateContractAwarePackageJson(mockConfig, mockContract);
      const pkg = JSON.parse(result);

      expect(pkg.name).toBe('my-counter-app');
    });

    it('should include contract name in keywords', () => {
      const result = generateContractAwarePackageJson(mockConfig, mockContract);
      const pkg = JSON.parse(result);

      expect(pkg.keywords).toContain('counter');
    });

    it('should include vitest for testing', () => {
      const result = generateContractAwarePackageJson(mockConfig, mockContract);
      const pkg = JSON.parse(result);

      expect(pkg.devDependencies.vitest).toBeDefined();
      expect(pkg.scripts.test).toBe('vitest run');
    });
  });

  describe('generateContractAwareReadme', () => {
    it('should include contract name', () => {
      const result = generateContractAwareReadme(mockConfig, mockContract);

      expect(result).toContain('# my-counter-app');
      expect(result).toContain('Counter');
    });

    it('should list circuits in documentation', () => {
      const result = generateContractAwareReadme(mockConfig, mockContract);

      expect(result).toContain('`increment`');
      expect(result).toContain('`decrement`');
    });

    it('should list witnesses separately', () => {
      const result = generateContractAwareReadme(mockConfig, mockContract);

      expect(result).toContain('Witnesses (Pure Functions)');
      expect(result).toContain('`getValue`');
    });

    it('should include project structure', () => {
      const result = generateContractAwareReadme(mockConfig, mockContract);

      expect(result).toContain('artifacts/');
      expect(result).toContain('circuits/');
      expect(result).toContain('contract.ts');
    });
  });

  describe('generateContractAwareFiles', () => {
    it('should generate contract wrapper with re-export', () => {
      const files = generateContractAwareFiles(mockConfig, mockContract);
      const contractFile = files.find((f) => f.path === 'src/contract.ts');

      expect(contractFile).toBeDefined();
      expect(contractFile?.content).toContain('export * as Counter');
      expect(contractFile?.content).toContain('../artifacts/Counter/contract/index.cjs');
    });

    it('should generate connect function with PascalCase name', () => {
      const files = generateContractAwareFiles(mockConfig, mockContract);
      const contractFile = files.find((f) => f.path === 'src/contract.ts');

      expect(contractFile?.content).toContain('connectCounter');
    });

    it('should generate circuits index with re-exports', () => {
      const files = generateContractAwareFiles(mockConfig, mockContract);
      const circuitsIndex = files.find((f) => f.path === 'src/circuits/index.ts');

      expect(circuitsIndex).toBeDefined();
      expect(circuitsIndex?.content).toContain("export * from './increment.js'");
      expect(circuitsIndex?.content).toContain("export * from './decrement.js'");
    });

    it('should generate circuit handlers with typed interfaces', () => {
      const files = generateContractAwareFiles(mockConfig, mockContract);
      const incrementHandler = files.find((f) => f.path === 'src/circuits/increment.ts');

      expect(incrementHandler).toBeDefined();
      expect(incrementHandler?.content).toContain('IncrementParams');
      expect(incrementHandler?.content).toContain('IncrementResult');
      expect(incrementHandler?.content).toContain('export async function increment');
      expect(incrementHandler?.content).toContain('DeployedContract');
    });

    it('should not generate handlers for pure functions (witnesses)', () => {
      const files = generateContractAwareFiles(mockConfig, mockContract);
      const paths = files.map((f) => f.path);

      expect(paths).not.toContain('src/circuits/getValue.ts');
    });
  });

  describe('contract with no impure circuits', () => {
    const viewOnlyContract: LoadedContractForTemplate = {
      name: 'ViewOnly',
      circuits: [
        { name: 'getData', isImpure: false },
        { name: 'getBalance', isImpure: false },
      ],
      modulePath: '/path/to/contract/index.cjs',
    };

    it('should generate empty circuits index', () => {
      const files = generateContractAwareFiles(mockConfig, viewOnlyContract);
      const circuitsIndex = files.find((f) => f.path === 'src/circuits/index.ts');

      expect(circuitsIndex).toBeDefined();
      expect(circuitsIndex?.content).toContain('No impure circuits found');
      expect(circuitsIndex?.content).toContain('export {}');
    });

    it('should not generate any circuit handler files', () => {
      const files = generateContractAwareFiles(mockConfig, viewOnlyContract);
      const handlerFiles = files.filter((f) =>
        f.path.startsWith('src/circuits/') && f.path !== 'src/circuits/index.ts'
      );

      expect(handlerFiles).toHaveLength(0);
    });
  });
});
