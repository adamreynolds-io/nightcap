/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default Midnight Docker images
 * Note: proof-server uses 'midnightnetwork' org, others use 'midnightntwrk'
 */
export const DEFAULT_IMAGES = {
    node: 'midnightntwrk/midnight-node:latest',
    indexer: 'midnightntwrk/indexer-standalone:latest',
    proofServer: 'midnightnetwork/proof-server:latest',
};
/**
 * Default port mappings
 */
export const DEFAULT_PORTS = {
    nodeRpc: 9944,
    nodeWs: 9933,
    indexer: 8080,
    proofServer: 6300,
};
//# sourceMappingURL=types.js.map