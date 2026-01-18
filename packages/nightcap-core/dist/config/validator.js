/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Validation error with helpful message
 */
export class ConfigValidationError extends Error {
    path;
    value;
    constructor(message, path, value) {
        super(message);
        this.path = path;
        this.value = value;
        this.name = 'ConfigValidationError';
    }
}
/**
 * Validate a URL string
 */
function isValidUrl(value) {
    if (typeof value !== 'string') {
        return false;
    }
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate a network configuration
 */
function validateNetworkConfig(config, networkName) {
    if (typeof config !== 'object' || config === null) {
        throw new ConfigValidationError(`Network configuration must be an object`, `networks.${networkName}`, config);
    }
    const network = config;
    // Validate name (optional, defaults to key)
    if (network['name'] !== undefined && typeof network['name'] !== 'string') {
        throw new ConfigValidationError(`Network name must be a string`, `networks.${networkName}.name`, network['name']);
    }
    // Validate URLs
    const urlFields = ['indexerUrl', 'proofServerUrl', 'nodeUrl'];
    for (const field of urlFields) {
        if (network[field] !== undefined && !isValidUrl(network[field])) {
            throw new ConfigValidationError(`${field} must be a valid URL`, `networks.${networkName}.${field}`, network[field]);
        }
    }
    // Validate isLocal
    if (network['isLocal'] !== undefined && typeof network['isLocal'] !== 'boolean') {
        throw new ConfigValidationError(`isLocal must be a boolean`, `networks.${networkName}.isLocal`, network['isLocal']);
    }
    return {
        name: network['name'] ?? networkName,
        indexerUrl: network['indexerUrl'],
        proofServerUrl: network['proofServerUrl'],
        nodeUrl: network['nodeUrl'],
        isLocal: network['isLocal'],
    };
}
/**
 * Validate a complete Nightcap configuration
 */
export function validateConfig(config) {
    if (typeof config !== 'object' || config === null) {
        throw new ConfigValidationError('Configuration must be an object', 'root', config);
    }
    const cfg = config;
    const result = {};
    // Validate defaultNetwork
    if (cfg['defaultNetwork'] !== undefined) {
        if (typeof cfg['defaultNetwork'] !== 'string') {
            throw new ConfigValidationError('defaultNetwork must be a string', 'defaultNetwork', cfg['defaultNetwork']);
        }
        result.defaultNetwork = cfg['defaultNetwork'];
    }
    // Validate networks
    if (cfg['networks'] !== undefined) {
        if (typeof cfg['networks'] !== 'object' || cfg['networks'] === null) {
            throw new ConfigValidationError('networks must be an object', 'networks', cfg['networks']);
        }
        result.networks = {};
        const networks = cfg['networks'];
        for (const [name, networkConfig] of Object.entries(networks)) {
            result.networks[name] = validateNetworkConfig(networkConfig, name);
        }
    }
    // Validate docker config
    if (cfg['docker'] !== undefined) {
        if (typeof cfg['docker'] !== 'object' || cfg['docker'] === null) {
            throw new ConfigValidationError('docker must be an object', 'docker', cfg['docker']);
        }
        const docker = cfg['docker'];
        result.docker = {
            enabled: docker['enabled'],
            composePath: docker['composePath'],
        };
        if (docker['images'] !== undefined) {
            if (typeof docker['images'] !== 'object' || docker['images'] === null) {
                throw new ConfigValidationError('docker.images must be an object', 'docker.images', docker['images']);
            }
            const images = docker['images'];
            result.docker.images = {
                node: images['node'],
                indexer: images['indexer'],
                proofServer: images['proofServer'],
            };
        }
    }
    // Validate paths
    if (cfg['paths'] !== undefined) {
        if (typeof cfg['paths'] !== 'object' || cfg['paths'] === null) {
            throw new ConfigValidationError('paths must be an object', 'paths', cfg['paths']);
        }
        const paths = cfg['paths'];
        result.paths = {
            artifacts: paths['artifacts'],
            sources: paths['sources'],
            deploy: paths['deploy'],
        };
    }
    // Validate that defaultNetwork exists in networks if both are specified
    if (result.defaultNetwork && result.networks) {
        if (!result.networks[result.defaultNetwork]) {
            const available = Object.keys(result.networks).join(', ');
            throw new ConfigValidationError(`defaultNetwork '${result.defaultNetwork}' is not defined in networks. Available: ${available}`, 'defaultNetwork', result.defaultNetwork);
        }
    }
    return result;
}
//# sourceMappingURL=validator.js.map