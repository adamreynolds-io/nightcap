/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ZkConfigProvider } from '../types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Cache for fetched ZK configs
 */
const configCache = new Map<string, unknown>();

/**
 * Create a ZK config provider for circuit artifact retrieval
 */
export function createZkConfigProvider(
  zkConfigUrl: string,
  circuitKeysPath: string
): ZkConfigProvider {
  const baseUrl = zkConfigUrl.replace(/\/$/, '');

  // Ensure circuit keys directory exists
  if (!fs.existsSync(circuitKeysPath)) {
    fs.mkdirSync(circuitKeysPath, { recursive: true });
  }

  return {
    async fetchConfig(circuitId: string): Promise<unknown> {
      // Check cache first
      const cached = configCache.get(circuitId);
      if (cached) {
        return cached;
      }

      // Check local file cache
      const localPath = path.join(circuitKeysPath, `${circuitId}.json`);
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf-8');
        const config = JSON.parse(content);
        configCache.set(circuitId, config);
        return config;
      }

      // Fetch from remote
      const response = await fetch(`${baseUrl}/circuits/${circuitId}/config.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ZK config for ${circuitId}: ${response.status}`);
      }

      const config = await response.json();

      // Cache locally
      fs.writeFileSync(localPath, JSON.stringify(config, null, 2));
      configCache.set(circuitId, config);

      return config;
    },

    getCircuitKeysPath(): string {
      return circuitKeysPath;
    },
  };
}
