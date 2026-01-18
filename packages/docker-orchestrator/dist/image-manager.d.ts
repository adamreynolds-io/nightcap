/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DockerClient } from './docker-client.js';
import type { ImagePullProgress, DockerOperationResult } from './types.js';
/**
 * Custom image overrides
 */
export interface CustomImages {
    node?: string;
    indexer?: string;
    proofServer?: string;
}
/**
 * Manages Docker images for the Midnight stack
 */
export declare class ImageManager {
    private client;
    constructor(client: DockerClient);
    /**
     * Get all required Midnight images
     */
    getRequiredImages(): string[];
    /**
     * Check which required images are missing
     */
    getMissingImages(customImages?: CustomImages): Promise<string[]>;
    /**
     * Check if all required images are available
     */
    hasAllImages(customImages?: CustomImages): Promise<boolean>;
    /**
     * Pull a single image with progress reporting
     */
    pullImage(image: string, onProgress?: (progress: ImagePullProgress) => void): Promise<DockerOperationResult>;
    /**
     * Pull all missing images
     */
    pullMissingImages(onProgress?: (progress: ImagePullProgress) => void, customImages?: CustomImages): Promise<{
        success: boolean;
        results: Record<string, DockerOperationResult>;
    }>;
    /**
     * Pull all images (including existing ones to update)
     */
    pullAllImages(onProgress?: (progress: ImagePullProgress) => void, customImages?: CustomImages): Promise<{
        success: boolean;
        results: Record<string, DockerOperationResult>;
    }>;
    /**
     * Format a progress message for display
     */
    static formatProgress(progress: ImagePullProgress): string;
    /**
     * Format bytes to human-readable string
     */
    private static formatBytes;
}
//# sourceMappingURL=image-manager.d.ts.map