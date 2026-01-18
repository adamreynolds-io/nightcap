/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import { DEFAULT_IMAGES } from './types.js';
/**
 * Manages Docker images for the Midnight stack
 */
export class ImageManager {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Get all required Midnight images
     */
    getRequiredImages() {
        return Object.values(DEFAULT_IMAGES);
    }
    /**
     * Check which required images are missing
     */
    async getMissingImages(customImages) {
        const images = { ...DEFAULT_IMAGES, ...customImages };
        const missing = [];
        for (const image of Object.values(images)) {
            const exists = await this.client.imageExists(image);
            if (!exists) {
                missing.push(image);
            }
        }
        return missing;
    }
    /**
     * Check if all required images are available
     */
    async hasAllImages(customImages) {
        const missing = await this.getMissingImages(customImages);
        return missing.length === 0;
    }
    /**
     * Pull a single image with progress reporting
     */
    async pullImage(image, onProgress) {
        return this.client.pullImage(image, (status, progress) => {
            if (onProgress) {
                onProgress({
                    image,
                    status,
                    progress,
                });
            }
        });
    }
    /**
     * Pull all missing images
     */
    async pullMissingImages(onProgress, customImages) {
        const missing = await this.getMissingImages(customImages);
        const results = {};
        let allSuccess = true;
        for (const image of missing) {
            const result = await this.pullImage(image, onProgress);
            results[image] = result;
            if (!result.success) {
                allSuccess = false;
            }
        }
        return { success: allSuccess, results };
    }
    /**
     * Pull all images (including existing ones to update)
     */
    async pullAllImages(onProgress, customImages) {
        const images = { ...DEFAULT_IMAGES, ...customImages };
        const results = {};
        let allSuccess = true;
        for (const image of Object.values(images)) {
            const result = await this.pullImage(image, onProgress);
            results[image] = result;
            if (!result.success) {
                allSuccess = false;
            }
        }
        return { success: allSuccess, results };
    }
    /**
     * Format a progress message for display
     */
    static formatProgress(progress) {
        let message = `${progress.image}: ${progress.status}`;
        if (progress.progress) {
            const percent = Math.round((progress.progress.current / progress.progress.total) * 100);
            const current = ImageManager.formatBytes(progress.progress.current);
            const total = ImageManager.formatBytes(progress.progress.total);
            message += ` [${percent}%] ${current}/${total}`;
        }
        if (progress.layerId) {
            message = `${progress.layerId}: ${progress.status}`;
        }
        return message;
    }
    /**
     * Format bytes to human-readable string
     */
    static formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)}${units[unitIndex]}`;
    }
}
//# sourceMappingURL=image-manager.js.map