/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseCompilationError,
  formatError,
  formatErrors,
  parseCompilerOutput,
} from './error-formatter.js';

describe('error-formatter', () => {
  describe('parseCompilationError', () => {
    it('should parse GCC-style errors', () => {
      const error = 'contracts/Counter.compact:10:5: error: undefined variable "x"';
      const parsed = parseCompilationError(error);

      expect(parsed).not.toBeNull();
      expect(parsed?.file).toBe('contracts/Counter.compact');
      expect(parsed?.line).toBe(10);
      expect(parsed?.column).toBe(5);
      expect(parsed?.severity).toBe('error');
      expect(parsed?.message).toBe('undefined variable "x"');
    });

    it('should parse GCC-style warnings', () => {
      const error = 'contracts/Token.compact:25:1: warning: unused variable "y"';
      const parsed = parseCompilationError(error);

      expect(parsed).not.toBeNull();
      expect(parsed?.severity).toBe('warning');
      expect(parsed?.message).toBe('unused variable "y"');
    });

    it('should parse simple format errors', () => {
      const error = 'contracts/Counter.compact:15: syntax error';
      const parsed = parseCompilationError(error);

      expect(parsed).not.toBeNull();
      expect(parsed?.file).toBe('contracts/Counter.compact');
      expect(parsed?.line).toBe(15);
      expect(parsed?.column).toBe(1);
      expect(parsed?.severity).toBe('error');
    });

    it('should return null for unparseable errors', () => {
      const error = 'Something went wrong';
      const parsed = parseCompilationError(error);

      expect(parsed).toBeNull();
    });
  });

  describe('formatError', () => {
    const testError = {
      file: '/project/contracts/Counter.compact',
      line: 10,
      column: 5,
      severity: 'error' as const,
      message: 'undefined variable',
    };

    it('should format as GCC style', () => {
      const formatted = formatError(testError, 'gcc', '/project');

      expect(formatted).toBe('contracts/Counter.compact:10:5: error: undefined variable');
    });

    it('should format as JSON', () => {
      const formatted = formatError(testError, 'json', '/project');
      const parsed = JSON.parse(formatted);

      expect(parsed.file).toBe('contracts/Counter.compact');
      expect(parsed.line).toBe(10);
      expect(parsed.severity).toBe('error');
    });

    it('should format as VS Code format', () => {
      const formatted = formatError(testError, 'vscode', '/project');
      const parsed = JSON.parse(formatted);

      expect(parsed.resource).toBe('contracts/Counter.compact');
      expect(parsed.severity).toBe(0); // error = 0
      expect(parsed.range.start.line).toBe(9); // 0-indexed
    });

    it('should format as human-readable', () => {
      const formatted = formatError(testError, 'human', '/project');

      expect(formatted).toContain('contracts/Counter.compact:10:5');
      expect(formatted).toContain('error: undefined variable');
    });
  });

  describe('formatErrors', () => {
    const errors = [
      { file: 'a.compact', line: 1, column: 1, severity: 'error' as const, message: 'error 1' },
      { file: 'b.compact', line: 2, column: 2, severity: 'warning' as const, message: 'warning 1' },
    ];

    it('should format multiple errors as JSON array', () => {
      const formatted = formatErrors(errors, 'json');
      const parsed = JSON.parse(formatted);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].file).toBe('a.compact');
      expect(parsed[1].file).toBe('b.compact');
    });

    it('should format multiple errors as GCC lines', () => {
      const formatted = formatErrors(errors, 'gcc');

      expect(formatted).toContain('a.compact:1:1: error: error 1');
      expect(formatted).toContain('b.compact:2:2: warning: warning 1');
    });
  });

  describe('parseCompilerOutput', () => {
    it('should parse multiple errors from compiler output', () => {
      const output = `
contracts/Counter.compact:10:5: error: undefined variable
contracts/Counter.compact:15:1: warning: unused import
contracts/Token.compact:3:10: error: type mismatch
      `;

      const errors = parseCompilerOutput(output);

      expect(errors).toHaveLength(3);
      expect(errors[0]?.file).toBe('contracts/Counter.compact');
      expect(errors[0]?.severity).toBe('error');
      expect(errors[1]?.severity).toBe('warning');
      expect(errors[2]?.file).toBe('contracts/Token.compact');
    });

    it('should handle empty output', () => {
      const errors = parseCompilerOutput('');
      expect(errors).toHaveLength(0);
    });

    it('should skip unparseable lines', () => {
      const output = `
Some info message
contracts/Counter.compact:10:5: error: real error
Another info message
      `;

      const errors = parseCompilerOutput(output);
      expect(errors).toHaveLength(1);
    });
  });
});
