/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import Docker from 'dockerode';
import type { ContainerStatus, DockerOperationResult } from './types.js';
/**
 * Docker client wrapper for Nightcap operations
 */
export declare class DockerClient {
    private docker;
    private _isAvailable;
    constructor(options?: Docker.DockerOptions);
    /**
     * Check if Docker is available and running
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get Docker version information
     */
    getVersion(): Promise<{
        version: string;
        apiVersion: string;
    } | null>;
    /**
     * Check if an image exists locally
     */
    imageExists(imageName: string): Promise<boolean>;
    /**
     * Pull an image with progress callback
     */
    pullImage(imageName: string, onProgress?: (status: string, progress?: {
        current: number;
        total: number;
    }) => void): Promise<DockerOperationResult>;
    /**
     * List containers matching a filter
     */
    listContainers(filters?: {
        name?: string[];
        label?: string[];
    }): Promise<ContainerStatus[]>;
    /**
     * Start a container by name or ID
     */
    startContainer(nameOrId: string): Promise<DockerOperationResult>;
    /**
     * Stop a container by name or ID
     */
    stopContainer(nameOrId: string, timeout?: number): Promise<DockerOperationResult>;
    /**
     * Remove a container by name or ID
     */
    removeContainer(nameOrId: string, options?: {
        force?: boolean;
        removeVolumes?: boolean;
    }): Promise<DockerOperationResult>;
    /**
     * Get container logs
     */
    getContainerLogs(nameOrId: string, options?: {
        tail?: number;
        since?: number;
    }): Promise<string>;
    /**
     * Parse health status from container status string
     */
    private parseHealthStatus;
    /**
     * Demultiplex Docker logs (strip header bytes)
     */
    private demuxLogs;
}
//# sourceMappingURL=docker-client.d.ts.map