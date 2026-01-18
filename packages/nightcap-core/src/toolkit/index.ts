/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

// Main toolkit class
export { Toolkit } from './toolkit.js';

// Bridges
export { ToolkitDockerBridge } from './docker-bridge.js';
export { ToolkitNativeBridge } from './native-bridge.js';

// Types
export type {
  ToolkitConfig,
  ToolkitMode,
  ToolkitEndpoint,
  ToolkitCommandOptions,
  ToolkitResult,
  ToolkitError,
  ToolkitErrorCode,
  DeployInput,
  DeployResult,
  CallInput,
  CallResult,
  WalletInfo,
  WalletBalance,
  TransactionInfo,
} from './types.js';

export { DEFAULT_TOOLKIT_IMAGE, TOOLKIT_ERROR_CODES } from './types.js';
