/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NightcapConfig } from '../tasks/types.js';
import { ConfigValidationError } from './validator.js';
/**
 * Load and validate the Nightcap configuration
 */
export declare function loadConfig(configPath?: string): Promise<NightcapConfig>;
export { ConfigValidationError };
//# sourceMappingURL=loader.d.ts.map