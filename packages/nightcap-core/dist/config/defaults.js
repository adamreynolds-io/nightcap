/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default network configurations for Midnight blockchain
 */
export const DEFAULT_NETWORKS = {
    localnet: {
        name: 'localnet',
        indexerUrl: 'http://localhost:8088/api/v1/graphql',
        proofServerUrl: 'http://localhost:6300',
        nodeUrl: 'http://localhost:9944',
        isLocal: true,
    },
    devnet: {
        name: 'devnet',
        indexerUrl: 'https://indexer.devnet.midnight.network/api/v1/graphql',
        proofServerUrl: 'https://proof-server.devnet.midnight.network',
        nodeUrl: 'https://rpc.devnet.midnight.network',
        isLocal: false,
    },
    preview: {
        name: 'preview',
        indexerUrl: 'https://indexer.preview.midnight.network/api/v1/graphql',
        proofServerUrl: 'https://proof-server.preview.midnight.network',
        nodeUrl: 'https://rpc.preview.midnight.network',
        isLocal: false,
    },
    preprod: {
        name: 'preprod',
        indexerUrl: 'https://indexer.preprod.midnight.network/api/v1/graphql',
        proofServerUrl: 'https://proof-server.preprod.midnight.network',
        nodeUrl: 'https://rpc.preprod.midnight.network',
        isLocal: false,
    },
    mainnet: {
        name: 'mainnet',
        indexerUrl: 'https://indexer.midnight.network/api/v1/graphql',
        proofServerUrl: 'https://proof-server.midnight.network',
        nodeUrl: 'https://rpc.midnight.network',
        isLocal: false,
    },
};
/**
 * Default paths for project structure
 */
export const DEFAULT_PATHS = {
    artifacts: './artifacts',
    sources: './contracts',
    deploy: './deploy',
};
/**
 * Create a default configuration
 */
export function createDefaultConfig() {
    return {
        defaultNetwork: 'localnet',
        networks: { ...DEFAULT_NETWORKS },
        docker: {
            enabled: true,
        },
        paths: { ...DEFAULT_PATHS },
    };
}
//# sourceMappingURL=defaults.js.map