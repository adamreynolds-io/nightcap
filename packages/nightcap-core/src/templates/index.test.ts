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
  getTemplateFiles,
  type ProjectConfig,
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
});
