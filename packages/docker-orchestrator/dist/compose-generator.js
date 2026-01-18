/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
import { stringify } from 'yaml';
import { DEFAULT_IMAGES, DEFAULT_PORTS } from './types.js';
/**
 * Generate a docker-compose.yml file for the Midnight stack
 */
export class ComposeGenerator {
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Generate the complete compose file structure
     */
    generate() {
        const projectName = this.config.projectName ?? 'nightcap';
        const networkName = this.config.networkName ?? `${projectName}_network`;
        return {
            services: {
                node: this.createNodeService(projectName),
                indexer: this.createIndexerService(projectName),
                'proof-server': this.createProofServerService(projectName),
            },
            networks: {
                [networkName]: {
                    driver: 'bridge',
                },
            },
            volumes: {
                [`${projectName}_node_data`]: { driver: 'local' },
                [`${projectName}_indexer_data`]: { driver: 'local' },
            },
        };
    }
    /**
     * Generate compose file as YAML string
     */
    toYaml() {
        const compose = this.generate();
        return stringify(compose, {
            indent: 2,
            lineWidth: 120,
        });
    }
    /**
     * Create the node service configuration
     */
    createNodeService(projectName) {
        const image = this.config.images?.node ?? DEFAULT_IMAGES.node;
        const port = this.config.ports?.node ?? DEFAULT_PORTS.node;
        const networkName = this.config.networkName ?? `${projectName}_network`;
        return {
            image,
            container_name: `${projectName}_node`,
            ports: [`${port}:9944`],
            volumes: [
                this.config.volumes?.nodeData ?? `${projectName}_node_data:/data`,
            ],
            environment: {
                RUST_LOG: 'info',
            },
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD', 'curl', '-f', 'http://localhost:9944/health'],
                interval: '30s',
                timeout: '10s',
                retries: 3,
                start_period: '40s',
            },
        };
    }
    /**
     * Create the indexer service configuration
     */
    createIndexerService(projectName) {
        const image = this.config.images?.indexer ?? DEFAULT_IMAGES.indexer;
        const port = this.config.ports?.indexer ?? DEFAULT_PORTS.indexer;
        const networkName = this.config.networkName ?? `${projectName}_network`;
        return {
            image,
            container_name: `${projectName}_indexer`,
            ports: [`${port}:8088`],
            volumes: [
                this.config.volumes?.indexerData ?? `${projectName}_indexer_data:/data`,
            ],
            environment: {
                NODE_URL: `http://${projectName}_node:9944`,
                RUST_LOG: 'info',
            },
            depends_on: ['node'],
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD', 'curl', '-f', 'http://localhost:8088/health'],
                interval: '30s',
                timeout: '10s',
                retries: 3,
                start_period: '30s',
            },
        };
    }
    /**
     * Create the proof server service configuration
     */
    createProofServerService(projectName) {
        const image = this.config.images?.proofServer ?? DEFAULT_IMAGES.proofServer;
        const port = this.config.ports?.proofServer ?? DEFAULT_PORTS.proofServer;
        const networkName = this.config.networkName ?? `${projectName}_network`;
        return {
            image,
            container_name: `${projectName}_proof_server`,
            ports: [`${port}:6300`],
            environment: {
                NODE_URL: `http://${projectName}_node:9944`,
                RUST_LOG: 'info',
            },
            depends_on: ['node'],
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD', 'curl', '-f', 'http://localhost:6300/health'],
                interval: '30s',
                timeout: '10s',
                retries: 3,
                start_period: '60s',
            },
        };
    }
}
//# sourceMappingURL=compose-generator.js.map