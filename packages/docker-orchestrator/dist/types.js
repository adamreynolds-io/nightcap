/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Known compatible version sets.
 * IMPORTANT: All components in a set must use the same ledger version.
 * Using mismatched versions will cause failures.
 */
export const VERSION_SETS = {
    /**
     * Version set based on midnight-js/testkit-js
     * @see https://github.com/midnightntwrk/midnight-js/tree/main/testkit-js
     */
    'testkit-0.20.0': {
        name: 'Testkit 0.20.0',
        ledgerVersion: '7.0.0-rc.1',
        images: {
            node: 'ghcr.io/midnight-ntwrk/midnight-node:0.20.0-alpha.1',
            indexer: 'ghcr.io/midnight-ntwrk/indexer-standalone:3.0.0-alpha.22',
            proofServer: 'ghcr.io/midnight-ntwrk/proof-server:7.0.0-alpha.1',
            toolkit: 'ghcr.io/midnight-ntwrk/midnight-node-toolkit:0.20.0-alpha.1',
        },
    },
};
/**
 * The default version set to use
 */
export const DEFAULT_VERSION_SET = 'testkit-0.20.0';
// Get the default version set config (guaranteed to exist since we use a literal type)
const defaultVersionSet = VERSION_SETS[DEFAULT_VERSION_SET];
/**
 * Default Midnight Docker images for the local stack (excluding toolkit).
 * These are the services that run continuously as part of `nightcap node`.
 *
 * IMPORTANT: These images are coupled by ledger version.
 * All components must use the same ledger version to be compatible.
 * Do not mix images from different version sets.
 */
export const DEFAULT_IMAGES = {
    node: defaultVersionSet.images.node,
    indexer: defaultVersionSet.images.indexer,
    proofServer: defaultVersionSet.images.proofServer,
};
/**
 * Default toolkit image (run on-demand for commands, not part of the stack).
 *
 * IMPORTANT: Must match the ledger version of the stack components.
 */
export const DEFAULT_TOOLKIT_IMAGE = defaultVersionSet.images.toolkit;
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