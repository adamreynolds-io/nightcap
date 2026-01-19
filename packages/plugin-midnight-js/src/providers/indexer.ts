/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IndexerProvider, Balance, BlockInfo, TransactionInfo } from '../types.js';

/**
 * GraphQL query for balance
 */
const BALANCE_QUERY = `
  query GetBalance($address: String!) {
    balance(address: $address) {
      unshielded
      shielded
    }
  }
`;

/**
 * GraphQL query for block
 */
const BLOCK_QUERY = `
  query GetBlock($number: Int) {
    block(number: $number) {
      number
      hash
      timestamp
      parentHash
    }
  }
`;

/**
 * GraphQL query for transaction
 */
const TRANSACTION_QUERY = `
  query GetTransaction($hash: String!) {
    transaction(hash: $hash) {
      hash
      blockNumber
      from
      to
      status
    }
  }
`;

/**
 * Create an indexer provider for blockchain queries
 */
export function createIndexerProvider(indexerUrl: string): IndexerProvider {
  const graphqlUrl = indexerUrl.endsWith('/graphql')
    ? indexerUrl
    : `${indexerUrl}/api/v1/graphql`;

  async function graphqlQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Indexer query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { data?: T; errors?: Array<{ message: string }> };

    if (result.errors && result.errors.length > 0) {
      throw new Error(`Indexer query error: ${result.errors[0]?.message}`);
    }

    if (!result.data) {
      throw new Error('Indexer returned no data');
    }

    return result.data;
  }

  return {
    async getBalance(address: string): Promise<Balance> {
      try {
        const data = await graphqlQuery<{ balance: { unshielded: string; shielded: string } }>(
          BALANCE_QUERY,
          { address }
        );

        return {
          unshielded: BigInt(data.balance.unshielded ?? '0'),
          shielded: BigInt(data.balance.shielded ?? '0'),
        };
      } catch (error) {
        // Return zero balance if query fails (address might not exist)
        console.warn(`Failed to get balance for ${address}: ${error instanceof Error ? error.message : String(error)}`);
        return { unshielded: 0n, shielded: 0n };
      }
    },

    async getBlock(number?: number): Promise<BlockInfo> {
      const data = await graphqlQuery<{
        block: { number: number; hash: string; timestamp: number; parentHash: string };
      }>(BLOCK_QUERY, { number });

      return {
        number: data.block.number,
        hash: data.block.hash,
        timestamp: data.block.timestamp,
        parentHash: data.block.parentHash,
      };
    },

    async getTransaction(hash: string): Promise<TransactionInfo> {
      const data = await graphqlQuery<{
        transaction: {
          hash: string;
          blockNumber: number;
          from: string;
          to?: string;
          status: string;
        };
      }>(TRANSACTION_QUERY, { hash });

      return {
        hash: data.transaction.hash,
        blockNumber: data.transaction.blockNumber,
        from: data.transaction.from,
        to: data.transaction.to,
        status: data.transaction.status as 'pending' | 'success' | 'failed',
      };
    },

    async queryContractState(address: string, query: unknown): Promise<unknown> {
      // Contract state queries are more complex and depend on the contract
      // This is a simplified implementation
      const QUERY = `
        query QueryContractState($address: String!, $query: JSON!) {
          contractState(address: $address, query: $query)
        }
      `;

      const data = await graphqlQuery<{ contractState: unknown }>(QUERY, { address, query });
      return data.contractState;
    },
  };
}
