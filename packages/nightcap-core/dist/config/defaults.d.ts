/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NetworkConfig, NightcapConfig } from '../tasks/types.js';
/**
 * Default network configurations for Midnight blockchain
 */
export declare const DEFAULT_NETWORKS: Record<string, NetworkConfig>;
/**
 * Default paths for project structure
 */
export declare const DEFAULT_PATHS: {
    artifacts: string;
    sources: string;
    deploy: string;
};
/**
 * Create a default configuration
 */
export declare function createDefaultConfig(): NightcapConfig;
//# sourceMappingURL=defaults.d.ts.map