/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

export { CompilerManager } from './manager.js';
export type { CompilerVersion, CompilationResult } from './manager.js';
export {
  parseContract,
  resolveCompilationOrder,
  checkVersionCompatibility,
} from './dependency-resolver.js';
export type { ContractInfo, CompilationOrder } from './dependency-resolver.js';
export {
  parseContractArtifacts,
  generateContractFactory,
  generateContractDeclaration,
  generateIndexFile,
  generateTypeScript,
} from './typescript-generator.js';
export type {
  ContractMetadata,
  CircuitInfo,
  ParameterInfo,
  GeneratorOptions,
} from './typescript-generator.js';
export {
  parseCompilationError,
  parseCompilerOutput,
  formatError,
  formatErrors,
  formatErrorWithSource,
} from './error-formatter.js';
export type { CompilationError, ErrorFormat } from './error-formatter.js';
export {
  loadCompiledContract,
  isCompiledContract,
  toPascalCase,
  toCamelCase,
} from './contract-loader.js';
export type { LoadedContract } from './contract-loader.js';
