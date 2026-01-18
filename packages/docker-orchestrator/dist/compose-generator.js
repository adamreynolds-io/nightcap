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
    ports;
    constructor(config = {}) {
        this.config = config;
        this.ports = {
            nodeRpc: DEFAULT_PORTS.nodeRpc,
            nodeWs: DEFAULT_PORTS.nodeWs,
            indexer: DEFAULT_PORTS.indexer,
            proofServer: DEFAULT_PORTS.proofServer,
            ...config.ports,
        };
    }
    /**
     * Get the project name
     */
    getProjectName() {
        return this.config.projectName ?? 'nightcap';
    }
    /**
     * Get the network name
     */
    getNetworkName() {
        return this.config.networkName ?? `${this.getProjectName()}_network`;
    }
    /**
     * Generate the complete compose file structure
     */
    generate() {
        const projectName = this.getProjectName();
        const networkName = this.getNetworkName();
        return {
            services: {
                node: this.createNodeService(projectName, networkName),
                indexer: this.createIndexerService(projectName, networkName),
                'proof-server': this.createProofServerService(projectName, networkName),
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
     * Get service URLs for display
     */
    getServiceUrls() {
        return {
            nodeRpc: `http://localhost:${this.ports.nodeRpc}`,
            nodeWs: `ws://localhost:${this.ports.nodeWs}`,
            indexer: `http://localhost:${this.ports.indexer}/api/v1/graphql`,
            proofServer: `http://localhost:${this.ports.proofServer}`,
        };
    }
    /**
     * Create the node service configuration
     */
    createNodeService(projectName, networkName) {
        const image = this.config.images?.node ?? DEFAULT_IMAGES.node;
        return {
            image,
            container_name: `${projectName}_node`,
            ports: [
                `${this.ports.nodeRpc}:9944`,
                `${this.ports.nodeWs}:9933`,
            ],
            volumes: [
                this.config.volumes?.nodeData ?? `${projectName}_node_data:/data`,
            ],
            environment: {
                CFG_PRESET: 'dev',
                RUST_LOG: 'info',
            },
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD-SHELL', 'curl -sf http://localhost:9944/health || exit 1'],
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
    createIndexerService(projectName, networkName) {
        const image = this.config.images?.indexer ?? DEFAULT_IMAGES.indexer;
        return {
            image,
            container_name: `${projectName}_indexer`,
            ports: [`${this.ports.indexer}:8088`],
            volumes: [
                this.config.volumes?.indexerData ?? `${projectName}_indexer_data:/data`,
            ],
            environment: {
                // Configuration from midnight-js/testkit-js
                APP__INFRA__NODE__URL: `ws://${projectName}_node:9944`,
                APP__APPLICATION__NETWORK_ID: 'undeployed',
                APP__INFRA__STORAGE__PASSWORD: 'indexer',
                APP__INFRA__PUB_SUB__PASSWORD: 'indexer',
                APP__INFRA__LEDGER_STATE_STORAGE__PASSWORD: 'indexer',
                // Development-only secret - NOT for production use
                APP__INFRA__SECRET: '303132333435363738393031323334353637383930313233343536373839303132',
                RUST_LOG: 'indexer=debug,chain_indexer=debug,indexer_api=debug,info',
            },
            depends_on: ['node'],
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD-SHELL', 'test -f /var/run/indexer-standalone/running || exit 1'],
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
    createProofServerService(projectName, networkName) {
        const image = this.config.images?.proofServer ?? DEFAULT_IMAGES.proofServer;
        return {
            image,
            container_name: `${projectName}_proof_server`,
            ports: [`${this.ports.proofServer}:6300`],
            environment: {
                NODE_URL: `ws://${projectName}_node:9933`,
                RUST_LOG: 'info',
            },
            depends_on: ['node'],
            networks: [networkName],
            restart: 'unless-stopped',
            healthcheck: {
                test: ['CMD-SHELL', 'curl -sf http://localhost:6300/health || exit 1'],
                interval: '30s',
                timeout: '10s',
                retries: 3,
                start_period: '60s',
            },
        };
    }
}
//# sourceMappingURL=compose-generator.js.map