/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapConfig, NetworkConfig } from '../tasks/types.js';

/**
 * Validation error with helpful message
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate a URL string
 */
function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a network configuration
 */
function validateNetworkConfig(
  config: unknown,
  networkName: string
): NetworkConfig {
  if (typeof config !== 'object' || config === null) {
    throw new ConfigValidationError(
      `Network configuration must be an object`,
      `networks.${networkName}`,
      config
    );
  }

  const network = config as Record<string, unknown>;

  // Validate name (optional, defaults to key)
  if (network['name'] !== undefined && typeof network['name'] !== 'string') {
    throw new ConfigValidationError(
      `Network name must be a string`,
      `networks.${networkName}.name`,
      network['name']
    );
  }

  // Validate URLs
  const urlFields = ['indexerUrl', 'proofServerUrl', 'nodeUrl'] as const;
  for (const field of urlFields) {
    if (network[field] !== undefined && !isValidUrl(network[field])) {
      throw new ConfigValidationError(
        `${field} must be a valid URL`,
        `networks.${networkName}.${field}`,
        network[field]
      );
    }
  }

  // Validate isLocal
  if (network['isLocal'] !== undefined && typeof network['isLocal'] !== 'boolean') {
    throw new ConfigValidationError(
      `isLocal must be a boolean`,
      `networks.${networkName}.isLocal`,
      network['isLocal']
    );
  }

  return {
    name: (network['name'] as string | undefined) ?? networkName,
    indexerUrl: network['indexerUrl'] as string | undefined,
    proofServerUrl: network['proofServerUrl'] as string | undefined,
    nodeUrl: network['nodeUrl'] as string | undefined,
    isLocal: network['isLocal'] as boolean | undefined,
  };
}

/**
 * Validate a complete Nightcap configuration
 */
export function validateConfig(config: unknown): NightcapConfig {
  if (typeof config !== 'object' || config === null) {
    throw new ConfigValidationError(
      'Configuration must be an object',
      'root',
      config
    );
  }

  const cfg = config as Record<string, unknown>;
  const result: NightcapConfig = {};

  // Validate defaultNetwork
  if (cfg['defaultNetwork'] !== undefined) {
    if (typeof cfg['defaultNetwork'] !== 'string') {
      throw new ConfigValidationError(
        'defaultNetwork must be a string',
        'defaultNetwork',
        cfg['defaultNetwork']
      );
    }
    result.defaultNetwork = cfg['defaultNetwork'];
  }

  // Validate networks
  if (cfg['networks'] !== undefined) {
    if (typeof cfg['networks'] !== 'object' || cfg['networks'] === null) {
      throw new ConfigValidationError(
        'networks must be an object',
        'networks',
        cfg['networks']
      );
    }

    result.networks = {};
    const networks = cfg['networks'] as Record<string, unknown>;
    for (const [name, networkConfig] of Object.entries(networks)) {
      result.networks[name] = validateNetworkConfig(networkConfig, name);
    }
  }

  // Validate docker config
  if (cfg['docker'] !== undefined) {
    if (typeof cfg['docker'] !== 'object' || cfg['docker'] === null) {
      throw new ConfigValidationError(
        'docker must be an object',
        'docker',
        cfg['docker']
      );
    }

    const docker = cfg['docker'] as Record<string, unknown>;
    result.docker = {
      enabled: docker['enabled'] as boolean | undefined,
      composePath: docker['composePath'] as string | undefined,
    };

    if (docker['images'] !== undefined) {
      if (typeof docker['images'] !== 'object' || docker['images'] === null) {
        throw new ConfigValidationError(
          'docker.images must be an object',
          'docker.images',
          docker['images']
        );
      }
      const images = docker['images'] as Record<string, unknown>;
      result.docker.images = {
        node: images['node'] as string | undefined,
        indexer: images['indexer'] as string | undefined,
        proofServer: images['proofServer'] as string | undefined,
      };
    }
  }

  // Validate paths
  if (cfg['paths'] !== undefined) {
    if (typeof cfg['paths'] !== 'object' || cfg['paths'] === null) {
      throw new ConfigValidationError(
        'paths must be an object',
        'paths',
        cfg['paths']
      );
    }

    const paths = cfg['paths'] as Record<string, unknown>;
    result.paths = {
      artifacts: paths['artifacts'] as string | undefined,
      sources: paths['sources'] as string | undefined,
      deploy: paths['deploy'] as string | undefined,
    };
  }

  // Validate that defaultNetwork exists in networks if both are specified
  if (result.defaultNetwork && result.networks) {
    if (!result.networks[result.defaultNetwork]) {
      const available = Object.keys(result.networks).join(', ');
      throw new ConfigValidationError(
        `defaultNetwork '${result.defaultNetwork}' is not defined in networks. Available: ${available}`,
        'defaultNetwork',
        result.defaultNetwork
      );
    }
  }

  return result;
}
