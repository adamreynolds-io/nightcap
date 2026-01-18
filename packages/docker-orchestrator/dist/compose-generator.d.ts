/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MidnightStackConfig, ComposeFile } from './types.js';
/**
 * Generate a docker-compose.yml file for the Midnight stack
 */
export declare class ComposeGenerator {
    private config;
    constructor(config?: MidnightStackConfig);
    /**
     * Generate the complete compose file structure
     */
    generate(): ComposeFile;
    /**
     * Generate compose file as YAML string
     */
    toYaml(): string;
    /**
     * Create the node service configuration
     */
    private createNodeService;
    /**
     * Create the indexer service configuration
     */
    private createIndexerService;
    /**
     * Create the proof server service configuration
     */
    private createProofServerService;
}
//# sourceMappingURL=compose-generator.d.ts.map