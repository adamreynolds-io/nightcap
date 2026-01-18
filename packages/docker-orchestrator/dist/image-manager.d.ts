/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DockerClient } from './docker-client.js';
import type { ImagePullProgress, DockerOperationResult } from './types.js';
import { DEFAULT_IMAGES } from './types.js';
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
    getMissingImages(customImages?: Partial<typeof DEFAULT_IMAGES>): Promise<string[]>;
    /**
     * Check if all required images are available
     */
    hasAllImages(customImages?: Partial<typeof DEFAULT_IMAGES>): Promise<boolean>;
    /**
     * Pull a single image with progress reporting
     */
    pullImage(image: string, onProgress?: (progress: ImagePullProgress) => void): Promise<DockerOperationResult>;
    /**
     * Pull all missing images
     */
    pullMissingImages(onProgress?: (progress: ImagePullProgress) => void, customImages?: Partial<typeof DEFAULT_IMAGES>): Promise<{
        success: boolean;
        results: Record<string, DockerOperationResult>;
    }>;
    /**
     * Pull all images (including existing ones to update)
     */
    pullAllImages(onProgress?: (progress: ImagePullProgress) => void, customImages?: Partial<typeof DEFAULT_IMAGES>): Promise<{
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