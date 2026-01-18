/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Configuration for the Midnight Docker stack
 */
export interface MidnightStackConfig {
    /** Network name for the stack */
    networkName?: string;
    /** Project name prefix for containers */
    projectName?: string;
    /** Port mappings */
    ports?: {
        nodeRpc?: number;
        nodeWs?: number;
        indexer?: number;
        proofServer?: number;
    };
    /** Docker images to use */
    images?: {
        node?: string;
        indexer?: string;
        proofServer?: string;
    };
    /** Volume paths */
    volumes?: {
        nodeData?: string;
        indexerData?: string;
    };
}
/**
 * Default Midnight Docker images
 * Note: proof-server uses 'midnightnetwork' org, others use 'midnightntwrk'
 */
export declare const DEFAULT_IMAGES: {
    readonly node: "midnightntwrk/midnight-node:latest";
    readonly indexer: "midnightntwrk/indexer-standalone:latest";
    readonly proofServer: "midnightnetwork/proof-server:latest";
};
/**
 * Default port mappings
 */
export declare const DEFAULT_PORTS: {
    readonly nodeRpc: 9944;
    readonly nodeWs: 9933;
    readonly indexer: 8080;
    readonly proofServer: 6300;
};
/**
 * Container status information
 */
export interface ContainerStatus {
    /** Container name */
    name: string;
    /** Container ID */
    id: string;
    /** Current state (running, stopped, etc.) */
    state: 'running' | 'stopped' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead' | 'created';
    /** Image name */
    image: string;
    /** Health status if available */
    health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
    /** Port bindings */
    ports: Array<{
        container: number;
        host: number;
        protocol: 'tcp' | 'udp';
    }>;
    /** Container creation time */
    created: Date;
}
/**
 * Image pull progress event
 */
export interface ImagePullProgress {
    /** Image being pulled */
    image: string;
    /** Current status message */
    status: string;
    /** Progress details if available */
    progress?: {
        current: number;
        total: number;
    };
    /** Layer ID if applicable */
    layerId?: string;
}
/**
 * Result of a Docker operation
 */
export interface DockerOperationResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Additional details */
    details?: Record<string, unknown>;
}
/**
 * Docker compose service definition
 */
export interface ComposeService {
    image: string;
    container_name?: string;
    ports?: string[];
    volumes?: string[];
    environment?: Record<string, string>;
    depends_on?: string[];
    networks?: string[];
    restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
    healthcheck?: {
        test: string[];
        interval?: string;
        timeout?: string;
        retries?: number;
        start_period?: string;
    };
}
/**
 * Docker compose file structure
 */
export interface ComposeFile {
    version?: string;
    services: Record<string, ComposeService>;
    networks?: Record<string, {
        driver?: string;
    }>;
    volumes?: Record<string, {
        driver?: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map