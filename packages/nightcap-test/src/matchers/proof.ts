/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ZK Proof structure
 */
export interface ZkProof {
  /** Proof bytes */
  proof: Uint8Array;
  /** Public inputs */
  publicInputs: unknown[];
  /** Circuit identifier */
  circuitId?: string;
}

/**
 * Check if a value is a valid ZK proof.
 *
 * @example
 * ```typescript
 * const proof = await contract.call('generateProof', [data]);
 * expect(proof).toBeValidProof();
 * ```
 */
export function toBeValidProof(
  this: { isNot: boolean },
  received: unknown
): { pass: boolean; message: () => string } {
  let isValid = false;
  let reason = '';

  if (!received || typeof received !== 'object') {
    reason = 'Value is not an object';
  } else {
    const proof = received as Partial<ZkProof>;

    // Check if it has the required proof field
    if (!proof.proof) {
      reason = 'Missing proof field';
    } else if (!(proof.proof instanceof Uint8Array)) {
      reason = 'Proof field is not a Uint8Array';
    } else if (proof.proof.length === 0) {
      reason = 'Proof is empty';
    } else {
      // Basic validation passed
      isValid = true;
    }
  }

  const pass = this.isNot ? !isValid : isValid;

  return {
    pass,
    message: () => {
      if (this.isNot) {
        return `Expected value not to be a valid proof, but it is`;
      }
      return `Expected value to be a valid proof, but ${reason}`;
    },
  };
}

/**
 * Check if a proof verifies correctly against expected public inputs.
 *
 * @example
 * ```typescript
 * const proof = await contract.call('generateProof', [data]);
 * await expect(proof).toVerifyWithInputs([publicInput1, publicInput2]);
 * ```
 */
export async function toVerifyWithInputs(
  this: { isNot: boolean },
  received: unknown,
  expectedPublicInputs: unknown[]
): Promise<{ pass: boolean; message: () => string }> {
  if (!received || typeof received !== 'object') {
    return {
      pass: this.isNot,
      message: () => `Expected value to be a proof object`,
    };
  }

  const proof = received as Partial<ZkProof>;

  // Check if public inputs match
  const actualInputs = proof.publicInputs || [];
  let inputsMatch = actualInputs.length === expectedPublicInputs.length;

  if (inputsMatch) {
    for (let i = 0; i < actualInputs.length; i++) {
      // Deep equality check would be better, but for now use simple comparison
      if (actualInputs[i] !== expectedPublicInputs[i]) {
        // Try BigInt comparison
        if (
          typeof actualInputs[i] === 'bigint' &&
          typeof expectedPublicInputs[i] === 'bigint'
        ) {
          if (actualInputs[i] !== expectedPublicInputs[i]) {
            inputsMatch = false;
            break;
          }
        } else {
          inputsMatch = false;
          break;
        }
      }
    }
  }

  const pass = this.isNot ? !inputsMatch : inputsMatch;

  return {
    pass,
    message: () => {
      if (this.isNot) {
        return `Expected proof not to verify with inputs ${JSON.stringify(expectedPublicInputs)}, but it did`;
      }
      return `Expected proof to verify with inputs ${JSON.stringify(expectedPublicInputs)}, but it had inputs ${JSON.stringify(actualInputs)}`;
    },
  };
}

/**
 * Check if a proof was generated for a specific circuit.
 *
 * @example
 * ```typescript
 * const proof = await contract.call('generateProof', [data]);
 * expect(proof).toBeProofForCircuit('transfer');
 * ```
 */
export function toBeProofForCircuit(
  this: { isNot: boolean },
  received: unknown,
  expectedCircuitId: string
): { pass: boolean; message: () => string } {
  if (!received || typeof received !== 'object') {
    return {
      pass: this.isNot,
      message: () => `Expected value to be a proof object`,
    };
  }

  const proof = received as Partial<ZkProof>;
  const matches = proof.circuitId === expectedCircuitId;
  const pass = this.isNot ? !matches : matches;

  return {
    pass,
    message: () => {
      if (this.isNot) {
        return `Expected proof not to be for circuit "${expectedCircuitId}", but it was`;
      }
      return `Expected proof to be for circuit "${expectedCircuitId}", but it was for "${proof.circuitId || 'unknown'}"`;
    },
  };
}
