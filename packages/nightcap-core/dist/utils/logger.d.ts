/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Log level enumeration
 */
export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Silent = 4
}
/**
 * Logger class for consistent output formatting
 */
declare class Logger {
    private level;
    private useColors;
    constructor();
    /**
     * Set the log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get the current log level
     */
    getLevel(): LogLevel;
    /**
     * Enable or disable colors
     */
    setColors(enabled: boolean): void;
    /**
     * Apply color to text if colors are enabled
     */
    private colorize;
    /**
     * Format a log message with prefix
     */
    private format;
    /**
     * Log a debug message
     */
    debug(message: string): void;
    /**
     * Log an info message
     */
    info(message: string): void;
    /**
     * Log a success message
     */
    success(message: string): void;
    /**
     * Log a warning message
     */
    warn(message: string): void;
    /**
     * Log an error message
     */
    error(message: string): void;
    /**
     * Log a plain message without prefix
     */
    log(message: string): void;
    /**
     * Log a blank line
     */
    newline(): void;
    /**
     * Create a spinner-like progress indicator
     */
    progress(message: string): {
        stop: (success?: boolean) => void;
    };
}
/**
 * Singleton logger instance
 */
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map