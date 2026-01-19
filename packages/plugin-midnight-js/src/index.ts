/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 *
 * @nightcap/plugin-midnight-js
 *
 * Midnight.js integration plugin for Nightcap. Provides:
 * - Contract factories for deployment and interaction
 * - Blockchain query access via indexer
 * - ZK proof generation via proof server
 * - Encrypted private state storage
 *
 * @example
 * ```typescript
 * // nightcap.config.ts
 * import { midnightJsPlugin } from '@nightcap/plugin-midnight-js';
 *
 * export default {
 *   plugins: [midnightJsPlugin],
 *   midnightJs: {
 *     indexerUrl: 'http://localhost:8088',
 *     proofServerUrl: 'http://localhost:6300',
 *   },
 * };
 * ```
 *
 * @example
 * ```typescript
 * // In tasks via context.env.midnight (recommended)
 * const task: TaskDefinition = {
 *   name: 'my-task',
 *   description: 'Deploy a contract',
 *   async action(context) {
 *     const { midnight } = context.env as { midnight: MidnightNamespace };
 *     const Counter = await midnight.getContractFactory('Counter');
 *     const { address } = await Counter.deploy([initialValue]);
 *     console.log(`Deployed at ${address}`);
 *   },
 * };
 * ```
 *
 * @example
 * ```typescript
 * // In standalone scripts using getMidnightProvider directly
 * import { getMidnightProvider } from '@nightcap/plugin-midnight-js';
 *
 * const provider = await getMidnightProvider('localnet', network, config);
 * const Counter = await provider.getContractFactory('Counter');
 * const { address, contract } = await Counter.deploy([initialValue]);
 * ```
 */

// Plugin definition
export { midnightJsPlugin, getMidnightProvider, clearProviderCache } from './plugin.js';

// Provider
export { createMidnightProvider, listAvailableContracts, clearArtifactsCache } from './provider.js';

// Types
export type {
  MidnightJsConfig,
  NightcapConfigWithMidnightJs,
  NetworkId,
  ContractArtifact,
  DeployedContract,
  ContractFactory,
  Balance,
  BlockInfo,
  TransactionInfo,
  IndexerProvider,
  ProofProvider,
  PrivateStateProvider,
  ZkConfigProvider,
  MidnightProvider,
  CreateProviderOptions,
  MidnightNamespace,
} from './types.js';

// Individual provider factories (for advanced use)
export {
  createIndexerProvider,
  createProofProvider,
  createPrivateStateProvider,
  createZkConfigProvider,
} from './providers/index.js';

// Default export is the plugin
export { midnightJsPlugin as default } from './plugin.js';
