/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import Docker from 'dockerode';
/**
 * Docker client wrapper for Nightcap operations
 */
export class DockerClient {
    docker;
    _isAvailable = null;
    constructor(options) {
        this.docker = new Docker(options);
    }
    /**
     * Check if Docker is available and running
     */
    async isAvailable() {
        if (this._isAvailable !== null) {
            return this._isAvailable;
        }
        try {
            await this.docker.ping();
            this._isAvailable = true;
            return true;
        }
        catch {
            this._isAvailable = false;
            return false;
        }
    }
    /**
     * Get Docker version information
     */
    async getVersion() {
        try {
            const info = await this.docker.version();
            return {
                version: info.Version,
                apiVersion: info.ApiVersion,
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Check if an image exists locally
     */
    async imageExists(imageName) {
        try {
            const image = this.docker.getImage(imageName);
            await image.inspect();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Pull an image with progress callback
     */
    async pullImage(imageName, onProgress) {
        try {
            const stream = await this.docker.pull(imageName);
            return new Promise((resolve) => {
                this.docker.modem.followProgress(stream, (err) => {
                    if (err) {
                        resolve({ success: false, error: err.message });
                    }
                    else {
                        resolve({ success: true });
                    }
                }, (event) => {
                    if (onProgress && event.status) {
                        const progress = event.progressDetail?.current && event.progressDetail?.total
                            ? { current: event.progressDetail.current, total: event.progressDetail.total }
                            : undefined;
                        onProgress(event.status, progress);
                    }
                });
            });
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * List containers matching a filter
     */
    async listContainers(filters) {
        try {
            // Build filters object only with defined values
            const filterObj = {};
            if (filters?.name) {
                filterObj['name'] = filters.name;
            }
            if (filters?.label) {
                filterObj['label'] = filters.label;
            }
            const containers = await this.docker.listContainers({
                all: true,
                filters: Object.keys(filterObj).length > 0 ? filterObj : undefined,
            });
            return containers.map((container) => ({
                name: container.Names[0]?.replace(/^\//, '') ?? 'unknown',
                id: container.Id,
                state: container.State,
                image: container.Image,
                health: this.parseHealthStatus(container.Status),
                ports: container.Ports.map((port) => ({
                    container: port.PrivatePort,
                    host: port.PublicPort ?? port.PrivatePort,
                    protocol: (port.Type ?? 'tcp'),
                })),
                created: new Date(container.Created * 1000),
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * Start a container by name or ID
     */
    async startContainer(nameOrId) {
        try {
            const container = this.docker.getContainer(nameOrId);
            await container.start();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Stop a container by name or ID
     */
    async stopContainer(nameOrId, timeout = 10) {
        try {
            const container = this.docker.getContainer(nameOrId);
            await container.stop({ t: timeout });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Remove a container by name or ID
     */
    async removeContainer(nameOrId, options) {
        try {
            const container = this.docker.getContainer(nameOrId);
            await container.remove({
                force: options?.force ?? false,
                v: options?.removeVolumes ?? false,
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Get container logs
     */
    async getContainerLogs(nameOrId, options) {
        try {
            const container = this.docker.getContainer(nameOrId);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail: options?.tail ?? 100,
                since: options?.since ?? 0,
            });
            // The logs buffer contains multiplexed stdout/stderr
            // Strip the header bytes from each line
            return this.demuxLogs(logs);
        }
        catch {
            return '';
        }
    }
    /**
     * Parse health status from container status string
     */
    parseHealthStatus(status) {
        if (status.includes('(healthy)'))
            return 'healthy';
        if (status.includes('(unhealthy)'))
            return 'unhealthy';
        if (status.includes('(health: starting)'))
            return 'starting';
        return 'none';
    }
    /**
     * Demultiplex Docker logs (strip header bytes)
     */
    demuxLogs(buffer) {
        if (typeof buffer === 'string') {
            return buffer;
        }
        const lines = [];
        let offset = 0;
        while (offset < buffer.length) {
            // Each frame has an 8-byte header: [stream_type, 0, 0, 0, size_bytes...]
            if (offset + 8 > buffer.length)
                break;
            const size = buffer.readUInt32BE(offset + 4);
            offset += 8;
            if (offset + size > buffer.length)
                break;
            const line = buffer.subarray(offset, offset + size).toString('utf8');
            lines.push(line);
            offset += size;
        }
        return lines.join('');
    }
}
//# sourceMappingURL=docker-client.js.map