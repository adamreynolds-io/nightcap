/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProofProvider } from '../types.js';

/**
 * Create a proof server provider for ZK proof generation
 */
export function createProofProvider(proofServerUrl: string): ProofProvider {
  const baseUrl = proofServerUrl.replace(/\/$/, '');

  return {
    async generateProof(circuitId: string, inputs: unknown): Promise<unknown> {
      const response = await fetch(`${baseUrl}/prove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          circuitId,
          inputs,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Proof generation failed: ${response.status} ${error}`);
      }

      return response.json();
    },

    async isAvailable(): Promise<boolean> {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}
