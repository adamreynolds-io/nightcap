/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';

/**
 * Structured compilation error
 */
export interface CompilationError {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
}

/**
 * Error output format for different tools/IDEs
 */
export type ErrorFormat = 'human' | 'gcc' | 'json' | 'vscode';

/**
 * Parse a compilation error string into structured format
 * Supports formats:
 *   - file:line:col: error: message
 *   - file:line:col: warning: message
 *   - file(line,col): error message
 */
export function parseCompilationError(error: string): CompilationError | null {
  // Try GCC/Clang style: file:line:col: severity: message
  const gccMatch = /^(.+):(\d+):(\d+):\s*(error|warning|info):\s*(.+)$/m.exec(error);
  if (gccMatch) {
    return {
      file: gccMatch[1] ?? '',
      line: parseInt(gccMatch[2] ?? '0', 10),
      column: parseInt(gccMatch[3] ?? '0', 10),
      severity: (gccMatch[4] ?? 'error') as 'error' | 'warning' | 'info',
      message: gccMatch[5] ?? '',
    };
  }

  // Try MSVC style: file(line,col): error message
  const msvcMatch = /^(.+)\((\d+),(\d+)\):\s*(error|warning)?\s*(.+)$/m.exec(error);
  if (msvcMatch) {
    return {
      file: msvcMatch[1] ?? '',
      line: parseInt(msvcMatch[2] ?? '0', 10),
      column: parseInt(msvcMatch[3] ?? '0', 10),
      severity: (msvcMatch[4] as 'error' | 'warning') ?? 'error',
      message: msvcMatch[5] ?? '',
    };
  }

  // Try simple format: file:line: message
  const simpleMatch = /^(.+):(\d+):\s*(.+)$/m.exec(error);
  if (simpleMatch) {
    return {
      file: simpleMatch[1] ?? '',
      line: parseInt(simpleMatch[2] ?? '0', 10),
      column: 1,
      severity: 'error',
      message: simpleMatch[3] ?? '',
    };
  }

  return null;
}

/**
 * Format a compilation error for output
 */
export function formatError(
  error: CompilationError,
  format: ErrorFormat,
  cwd: string = process.cwd()
): string {
  const relPath = relative(cwd, error.file) || error.file;

  switch (format) {
    case 'gcc':
      return `${relPath}:${error.line}:${error.column}: ${error.severity}: ${error.message}`;

    case 'json':
      return JSON.stringify({
        file: relPath,
        line: error.line,
        column: error.column,
        severity: error.severity,
        message: error.message,
        code: error.code,
      });

    case 'vscode':
      // VS Code problemMatcher format
      return JSON.stringify({
        resource: relPath,
        owner: 'nightcap',
        severity: error.severity === 'error' ? 0 : error.severity === 'warning' ? 1 : 2,
        range: {
          start: { line: error.line - 1, character: error.column - 1 },
          end: { line: error.line - 1, character: error.column },
        },
        message: error.message,
        source: 'compactc',
      });

    case 'human':
    default:
      return `${relPath}:${error.line}:${error.column}\n  ${error.severity}: ${error.message}`;
  }
}

/**
 * Format a compilation error with source context for human-readable output
 */
export async function formatErrorWithSource(
  error: CompilationError | string,
  sourcePath?: string,
  contextLines = 1
): Promise<string> {
  // Parse if string
  const parsed = typeof error === 'string' ? parseCompilationError(error) : error;

  if (!parsed) {
    // Return as-is if not parseable
    return typeof error === 'string' ? `  ${error}` : JSON.stringify(error);
  }

  const relPath = relative(process.cwd(), parsed.file) || parsed.file;
  let output = `  ${relPath}:${parsed.line}:${parsed.column}\n  ${parsed.severity}: ${parsed.message}`;

  // Try to show source context
  const targetFile = sourcePath ?? parsed.file;
  if (targetFile && existsSync(targetFile) && parsed.line > 0) {
    try {
      const source = await readFile(targetFile, 'utf8');
      const lines = source.split('\n');

      // Get context lines
      const start = Math.max(0, parsed.line - contextLines - 1);
      const end = Math.min(lines.length - 1, parsed.line + contextLines - 1);

      output += '\n';
      for (let i = start; i <= end; i++) {
        const lineNum = i + 1;
        const lineContent = lines[i] ?? '';
        const prefix = lineNum === parsed.line ? '>' : ' ';
        output += `\n  ${prefix} ${lineNum.toString().padStart(4)} | ${lineContent}`;

        // Add caret pointing to error column
        if (lineNum === parsed.line && parsed.column > 0) {
          const caretPadding = ' '.repeat(parsed.column + 8); // Account for prefix and line number
          output += `\n  ${caretPadding}^`;
        }
      }
    } catch {
      // Ignore source reading errors
    }
  }

  return output;
}

/**
 * Format multiple errors for output
 */
export function formatErrors(
  errors: CompilationError[],
  format: ErrorFormat,
  cwd: string = process.cwd()
): string {
  if (format === 'json' || format === 'vscode') {
    // For JSON formats, output as array
    const formatted = errors.map(e => formatError(e, format, cwd));
    return `[${formatted.join(',\n')}]`;
  }

  // For text formats, join with newlines
  return errors.map(e => formatError(e, format, cwd)).join('\n');
}

/**
 * Parse multiple errors from compiler output
 */
export function parseCompilerOutput(output: string): CompilationError[] {
  const errors: CompilationError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed = parseCompilationError(trimmed);
    if (parsed) {
      errors.push(parsed);
    }
  }

  return errors;
}
