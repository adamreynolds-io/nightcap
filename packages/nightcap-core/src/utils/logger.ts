/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Log level enumeration
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Silent = 4,
}

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const;

/**
 * Check if output supports colors
 */
function supportsColor(): boolean {
  // Disable colors if NO_COLOR is set or not a TTY
  if (process.env['NO_COLOR'] !== undefined) {
    return false;
  }
  if (!process.stdout.isTTY) {
    return false;
  }
  // Force color if FORCE_COLOR is set
  if (process.env['FORCE_COLOR'] !== undefined) {
    return true;
  }
  return true;
}

/**
 * Logger class for consistent output formatting
 */
class Logger {
  private level: LogLevel = LogLevel.Info;
  private useColors: boolean;

  constructor() {
    this.useColors = supportsColor();
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Enable or disable colors
   */
  setColors(enabled: boolean): void {
    this.useColors = enabled;
  }

  /**
   * Apply color to text if colors are enabled
   */
  private colorize(text: string, color: keyof typeof colors): string {
    if (!this.useColors) {
      return text;
    }
    return `${colors[color]}${text}${colors.reset}`;
  }

  /**
   * Format a log message with prefix
   */
  private format(prefix: string, message: string, color: keyof typeof colors): string {
    const coloredPrefix = this.colorize(prefix, color);
    return `${coloredPrefix} ${message}`;
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (this.level <= LogLevel.Debug) {
      console.log(this.format('[DEBUG]', message, 'dim'));
    }
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    if (this.level <= LogLevel.Info) {
      console.log(this.format('[INFO]', message, 'cyan'));
    }
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    if (this.level <= LogLevel.Info) {
      console.log(this.format('[OK]', message, 'green'));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (this.level <= LogLevel.Warn) {
      console.warn(this.format('[WARN]', message, 'yellow'));
    }
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (this.level <= LogLevel.Error) {
      console.error(this.format('[ERROR]', message, 'red'));
    }
  }

  /**
   * Log a plain message without prefix
   */
  log(message: string): void {
    if (this.level < LogLevel.Silent) {
      console.log(message);
    }
  }

  /**
   * Log a blank line
   */
  newline(): void {
    if (this.level < LogLevel.Silent) {
      console.log();
    }
  }

  /**
   * Create a spinner-like progress indicator
   */
  progress(message: string): { stop: (success?: boolean) => void } {
    if (this.level >= LogLevel.Silent || !process.stdout.isTTY) {
      return { stop: () => {} };
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    let stopped = false;

    const interval = setInterval(() => {
      if (stopped) return;
      const frame = this.colorize(frames[frameIndex] ?? '⠋', 'cyan');
      process.stdout.write(`\r${frame} ${message}`);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 80);

    return {
      stop: (success = true) => {
        stopped = true;
        clearInterval(interval);
        const icon = success
          ? this.colorize('✓', 'green')
          : this.colorize('✗', 'red');
        process.stdout.write(`\r${icon} ${message}\n`);
      },
    };
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();
