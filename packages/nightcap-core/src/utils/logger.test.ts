/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel } from './logger.js';

describe('LogLevel', () => {
  it('should have correct order', () => {
    expect(LogLevel.Debug).toBeLessThan(LogLevel.Info);
    expect(LogLevel.Info).toBeLessThan(LogLevel.Warn);
    expect(LogLevel.Warn).toBeLessThan(LogLevel.Error);
    expect(LogLevel.Error).toBeLessThan(LogLevel.Silent);
  });
});

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // We need to create a fresh logger instance for testing
  // since the module exports a singleton
  it('should respect log level for debug', async () => {
    // Re-import to get fresh module
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Info);
    logger.setColors(false);

    logger.debug('test debug');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.Debug);
    logger.debug('test debug');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEBUG')
    );
  });

  it('should respect log level for info', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Warn);
    logger.setColors(false);

    logger.info('test info');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.Info);
    logger.info('test info');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
  });

  it('should respect log level for warn', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Error);
    logger.setColors(false);

    logger.warn('test warn');
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.Warn);
    logger.warn('test warn');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WARN')
    );
  });

  it('should respect log level for error', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Silent);
    logger.setColors(false);

    logger.error('test error');
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.Error);
    logger.error('test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ERROR')
    );
  });

  it('should log success messages at info level', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Info);
    logger.setColors(false);

    logger.success('test success');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OK'));
  });

  it('should log plain messages', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Info);
    logger.setColors(false);

    logger.log('plain message');
    expect(consoleLogSpy).toHaveBeenCalledWith('plain message');
  });

  it('should log newlines', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Info);

    logger.newline();
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should silence all output at Silent level', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Silent);
    logger.setColors(false);

    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');
    logger.log('test');
    logger.newline();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should get and set log level', async () => {
    vi.resetModules();
    const { logger, LogLevel } = await import('./logger.js');

    logger.setLevel(LogLevel.Debug);
    expect(logger.getLevel()).toBe(LogLevel.Debug);

    logger.setLevel(LogLevel.Error);
    expect(logger.getLevel()).toBe(LogLevel.Error);
  });
});
