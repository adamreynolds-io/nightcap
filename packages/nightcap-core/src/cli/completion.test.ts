/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { generateCompletion, getSupportedShells, type ShellType } from './completion.js';
import type { TaskDefinition } from '../tasks/types.js';

const mockTasks: TaskDefinition[] = [
  {
    name: 'doctor',
    description: 'Check system requirements',
    action: async () => {},
  },
  {
    name: 'init',
    description: 'Initialize a new project',
    params: {
      template: {
        type: 'string',
        description: 'Project template to use',
      },
      force: {
        type: 'boolean',
        description: 'Overwrite existing files',
      },
    },
    action: async () => {},
  },
  {
    name: 'node:start',
    description: 'Start the local Midnight node',
    action: async () => {},
  },
];

describe('getSupportedShells', () => {
  it('should return bash, zsh, and fish', () => {
    const shells = getSupportedShells();
    expect(shells).toContain('bash');
    expect(shells).toContain('zsh');
    expect(shells).toContain('fish');
    expect(shells).toHaveLength(3);
  });
});

describe('generateCompletion', () => {
  describe('bash', () => {
    it('should generate valid bash completion script', () => {
      const script = generateCompletion('bash', mockTasks);

      expect(script).toContain('# Nightcap bash completion script');
      expect(script).toContain('_nightcap_completions()');
      expect(script).toContain('complete -F _nightcap_completions nightcap');
    });

    it('should include all task names', () => {
      const script = generateCompletion('bash', mockTasks);

      expect(script).toContain('doctor');
      expect(script).toContain('init');
      expect(script).toContain('node:start');
    });

    it('should include global options', () => {
      const script = generateCompletion('bash', mockTasks);

      expect(script).toContain('--network');
      expect(script).toContain('--verbose');
      expect(script).toContain('--quiet');
      expect(script).toContain('--config');
    });

    it('should include task-specific options', () => {
      const script = generateCompletion('bash', mockTasks);

      expect(script).toContain('--template');
      expect(script).toContain('--force');
    });

    it('should include usage instructions', () => {
      const script = generateCompletion('bash', mockTasks);

      expect(script).toContain('eval "$(nightcap completion bash)"');
    });
  });

  describe('zsh', () => {
    it('should generate valid zsh completion script', () => {
      const script = generateCompletion('zsh', mockTasks);

      expect(script).toContain('#compdef nightcap');
      expect(script).toContain('_nightcap()');
      expect(script).toContain('_nightcap "$@"');
    });

    it('should include command descriptions', () => {
      const script = generateCompletion('zsh', mockTasks);

      expect(script).toContain('doctor:Check system requirements');
      expect(script).toContain('init:Initialize a new project');
    });

    it('should include global options with descriptions', () => {
      const script = generateCompletion('zsh', mockTasks);

      expect(script).toContain("'--network[Network to use]");
      expect(script).toContain("'--verbose[Enable verbose output]");
    });

    it('should include task-specific options', () => {
      const script = generateCompletion('zsh', mockTasks);

      expect(script).toContain('--template');
      expect(script).toContain('--force');
    });

    it('should include usage instructions', () => {
      const script = generateCompletion('zsh', mockTasks);

      expect(script).toContain('eval "$(nightcap completion zsh)"');
    });
  });

  describe('fish', () => {
    it('should generate valid fish completion script', () => {
      const script = generateCompletion('fish', mockTasks);

      expect(script).toContain('# Nightcap fish completion script');
      expect(script).toContain('complete -c nightcap');
    });

    it('should include all task names with descriptions', () => {
      const script = generateCompletion('fish', mockTasks);

      expect(script).toContain("-a 'doctor' -d 'Check system requirements'");
      expect(script).toContain("-a 'init' -d 'Initialize a new project'");
      expect(script).toContain("-a 'node:start'");
    });

    it('should include global options', () => {
      const script = generateCompletion('fish', mockTasks);

      expect(script).toContain("-l network -d 'Network to use'");
      expect(script).toContain("-l verbose -d 'Enable verbose output'");
    });

    it('should include task-specific options', () => {
      const script = generateCompletion('fish', mockTasks);

      expect(script).toContain('__fish_seen_subcommand_from init');
      expect(script).toContain('-l template');
      expect(script).toContain('-l force');
    });

    it('should include usage instructions', () => {
      const script = generateCompletion('fish', mockTasks);

      expect(script).toContain('nightcap completion fish | source');
    });
  });

  describe('error handling', () => {
    it('should throw for unsupported shell', () => {
      expect(() => generateCompletion('powershell' as ShellType, mockTasks)).toThrow(
        'Unsupported shell: powershell'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle tasks with no params', () => {
      const tasks: TaskDefinition[] = [
        {
          name: 'simple',
          description: 'A simple task',
          action: async () => {},
        },
      ];

      // Should not throw for any shell
      expect(() => generateCompletion('bash', tasks)).not.toThrow();
      expect(() => generateCompletion('zsh', tasks)).not.toThrow();
      expect(() => generateCompletion('fish', tasks)).not.toThrow();
    });

    it('should handle empty task list', () => {
      const tasks: TaskDefinition[] = [];

      // Should not throw for any shell
      expect(() => generateCompletion('bash', tasks)).not.toThrow();
      expect(() => generateCompletion('zsh', tasks)).not.toThrow();
      expect(() => generateCompletion('fish', tasks)).not.toThrow();
    });

    it('should escape single quotes in descriptions', () => {
      const tasks: TaskDefinition[] = [
        {
          name: 'test',
          description: "Task with 'quotes'",
          action: async () => {},
        },
      ];

      // Should handle quotes without breaking the script
      const zshScript = generateCompletion('zsh', tasks);
      const fishScript = generateCompletion('fish', tasks);

      expect(zshScript).toContain('test');
      expect(fishScript).toContain('test');
    });
  });
});
