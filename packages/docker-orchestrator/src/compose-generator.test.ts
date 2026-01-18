/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ComposeGenerator } from './compose-generator.js';
import { DEFAULT_IMAGES, DEFAULT_PORTS } from './types.js';

describe('ComposeGenerator', () => {
  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const generator = new ComposeGenerator();
      expect(generator.getProjectName()).toBe('nightcap');
    });

    it('should accept custom config', () => {
      const generator = new ComposeGenerator({
        projectName: 'myproject',
      });
      expect(generator.getProjectName()).toBe('myproject');
    });
  });

  describe('getProjectName', () => {
    it('should return default project name', () => {
      const generator = new ComposeGenerator();
      expect(generator.getProjectName()).toBe('nightcap');
    });

    it('should return custom project name', () => {
      const generator = new ComposeGenerator({ projectName: 'custom' });
      expect(generator.getProjectName()).toBe('custom');
    });
  });

  describe('getNetworkName', () => {
    it('should return default network name based on project', () => {
      const generator = new ComposeGenerator();
      expect(generator.getNetworkName()).toBe('nightcap_network');
    });

    it('should return custom network name', () => {
      const generator = new ComposeGenerator({ networkName: 'custom_net' });
      expect(generator.getNetworkName()).toBe('custom_net');
    });

    it('should derive from custom project name', () => {
      const generator = new ComposeGenerator({ projectName: 'myapp' });
      expect(generator.getNetworkName()).toBe('myapp_network');
    });
  });

  describe('generate', () => {
    it('should create compose file with all services', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.services).toHaveProperty('node');
      expect(compose.services).toHaveProperty('indexer');
      expect(compose.services).toHaveProperty('proof-server');
    });

    it('should use default images', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.services.node.image).toBe(DEFAULT_IMAGES.node);
      expect(compose.services.indexer.image).toBe(DEFAULT_IMAGES.indexer);
      expect(compose.services['proof-server'].image).toBe(
        DEFAULT_IMAGES.proofServer
      );
    });

    it('should use custom images when provided', () => {
      const generator = new ComposeGenerator({
        images: {
          node: 'custom/node:v1',
          indexer: 'custom/indexer:v1',
        },
      });
      const compose = generator.generate();

      expect(compose.services.node.image).toBe('custom/node:v1');
      expect(compose.services.indexer.image).toBe('custom/indexer:v1');
      // Should still use default for proof-server
      expect(compose.services['proof-server'].image).toBe(
        DEFAULT_IMAGES.proofServer
      );
    });

    it('should use default ports', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.services.node.ports).toContain(
        `${DEFAULT_PORTS.nodeRpc}:9944`
      );
      expect(compose.services.node.ports).toContain(
        `${DEFAULT_PORTS.nodeWs}:9933`
      );
      expect(compose.services.indexer.ports).toContain(
        `${DEFAULT_PORTS.indexer}:8080`
      );
      expect(compose.services['proof-server'].ports).toContain(
        `${DEFAULT_PORTS.proofServer}:6300`
      );
    });

    it('should use custom ports when provided', () => {
      const generator = new ComposeGenerator({
        ports: {
          nodeRpc: 19944,
          indexer: 18080,
        },
      });
      const compose = generator.generate();

      expect(compose.services.node.ports).toContain('19944:9944');
      expect(compose.services.indexer.ports).toContain('18080:8080');
    });

    it('should create network configuration', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.networks).toHaveProperty('nightcap_network');
      expect(compose.networks?.nightcap_network.driver).toBe('bridge');
    });

    it('should create volume configuration', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.volumes).toHaveProperty('nightcap_node_data');
      expect(compose.volumes).toHaveProperty('nightcap_indexer_data');
    });

    it('should set correct container names', () => {
      const generator = new ComposeGenerator({ projectName: 'test' });
      const compose = generator.generate();

      expect(compose.services.node.container_name).toBe('test_node');
      expect(compose.services.indexer.container_name).toBe('test_indexer');
      expect(compose.services['proof-server'].container_name).toBe(
        'test_proof_server'
      );
    });

    it('should set healthchecks for all services', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.services.node.healthcheck).toBeDefined();
      expect(compose.services.indexer.healthcheck).toBeDefined();
      expect(compose.services['proof-server'].healthcheck).toBeDefined();
    });

    it('should set correct dependencies', () => {
      const generator = new ComposeGenerator();
      const compose = generator.generate();

      expect(compose.services.indexer.depends_on).toContain('node');
      expect(compose.services['proof-server'].depends_on).toContain('node');
    });
  });

  describe('toYaml', () => {
    it('should generate valid YAML string', () => {
      const generator = new ComposeGenerator();
      const yaml = generator.toYaml();

      expect(yaml).toContain('services:');
      expect(yaml).toContain('node:');
      expect(yaml).toContain('indexer:');
      expect(yaml).toContain('proof-server:');
      expect(yaml).toContain('networks:');
      expect(yaml).toContain('volumes:');
    });

    it('should include image references', () => {
      const generator = new ComposeGenerator();
      const yaml = generator.toYaml();

      expect(yaml).toContain(DEFAULT_IMAGES.node);
      expect(yaml).toContain(DEFAULT_IMAGES.indexer);
    });
  });

  describe('getServiceUrls', () => {
    it('should return correct URLs with default ports', () => {
      const generator = new ComposeGenerator();
      const urls = generator.getServiceUrls();

      expect(urls.nodeRpc).toBe('http://localhost:9944');
      expect(urls.nodeWs).toBe('ws://localhost:9933');
      expect(urls.indexer).toBe('http://localhost:8080/api/v1/graphql');
      expect(urls.proofServer).toBe('http://localhost:6300');
    });

    it('should return correct URLs with custom ports', () => {
      const generator = new ComposeGenerator({
        ports: {
          nodeRpc: 19944,
          indexer: 18080,
        },
      });
      const urls = generator.getServiceUrls();

      expect(urls.nodeRpc).toBe('http://localhost:19944');
      expect(urls.indexer).toBe('http://localhost:18080/api/v1/graphql');
    });
  });
});

describe('DEFAULT_IMAGES', () => {
  it('should have expected image names', () => {
    expect(DEFAULT_IMAGES.node).toBe('midnightntwrk/midnight-node:latest');
    expect(DEFAULT_IMAGES.indexer).toBe('midnightntwrk/indexer-standalone:latest');
    expect(DEFAULT_IMAGES.proofServer).toBe('midnightnetwork/proof-server:latest');
  });
});

describe('DEFAULT_PORTS', () => {
  it('should have expected port numbers', () => {
    expect(DEFAULT_PORTS.nodeRpc).toBe(9944);
    expect(DEFAULT_PORTS.nodeWs).toBe(9933);
    expect(DEFAULT_PORTS.indexer).toBe(8080);
    expect(DEFAULT_PORTS.proofServer).toBe(6300);
  });
});
