/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NightcapConfig } from '../tasks/types.js';
/**
 * Validation error with helpful message
 */
export declare class ConfigValidationError extends Error {
    readonly path: string;
    readonly value?: unknown | undefined;
    constructor(message: string, path: string, value?: unknown | undefined);
}
/**
 * Validate a complete Nightcap configuration
 */
export declare function validateConfig(config: unknown): NightcapConfig;
//# sourceMappingURL=validator.d.ts.map