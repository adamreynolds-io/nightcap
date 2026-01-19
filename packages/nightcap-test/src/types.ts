/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NightcapConfig, NetworkConfig } from '@nightcap/core';

/**
 * A test signer/account with address and signing capability
 */
export interface TestSigner {
  /** Account address */
  address: string;
  /** Sign a message */
  signMessage(message: string): Promise<string>;
  /** Sign a transaction */
  signTransaction(tx: unknown): Promise<string>;
}

/**
 * Balance information for assertions
 */
export interface Balance {
  /** Unshielded (public) balance */
  unshielded: bigint;
  /** Shielded (private) balance */
  shielded: bigint;
}

/**
 * Transaction receipt from contract interaction
 */
export interface TransactionReceipt {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: number;
  /** Gas/DUST used */
  gasUsed: bigint;
  /** Events emitted */
  events: TransactionEvent[];
  /** Whether transaction succeeded */
  success: boolean;
  /** Revert reason if failed */
  revertReason?: string;
}

/**
 * Event emitted by a contract
 */
export interface TransactionEvent {
  /** Event name */
  name: string;
  /** Contract address that emitted the event */
  address: string;
  /** Event arguments */
  args: Record<string, unknown>;
}

/**
 * Deployed contract instance for testing
 */
export interface TestContract<T = unknown> {
  /** Contract address */
  address: string;
  /** Contract name */
  name: string;
  /** Connect contract to a different signer */
  connect(signer: TestSigner): TestContract<T>;
  /** Call a read-only method */
  call<K extends keyof T>(method: K, ...args: unknown[]): Promise<unknown>;
  /** Send a transaction */
  send<K extends keyof T>(method: K, ...args: unknown[]): Promise<TransactionReceipt>;
  /** Get the underlying contract interface */
  interface: T;
}

/**
 * Fixture function type
 */
export type FixtureFunction<T> = () => Promise<T>;

/**
 * Nightcap test context available in tests
 */
export interface NightcapTestContext {
  /** Current configuration */
  config: NightcapConfig;
  /** Current network */
  network: NetworkConfig;
  /** Network name */
  networkName: string;
  /** Get funded test signers */
  getSigners(): Promise<TestSigner[]>;
  /** Deploy a contract by name */
  deployContract<T = unknown>(
    name: string,
    args?: unknown[],
    options?: DeployOptions
  ): Promise<TestContract<T>>;
  /** Get a contract at an address */
  getContractAt<T = unknown>(
    name: string,
    address: string
  ): Promise<TestContract<T>>;
  /** Time manipulation helpers */
  time: TimeHelpers;
  /** Mining helpers */
  mine(blocks?: number): Promise<void>;
  /** Take a snapshot of current state */
  snapshot(): Promise<string>;
  /** Revert to a snapshot */
  revert(snapshotId: string): Promise<void>;
}

/**
 * Options for deploying a contract
 */
export interface DeployOptions {
  /** Signer to deploy from */
  from?: TestSigner;
  /** Additional deployment options */
  [key: string]: unknown;
}

/**
 * Time manipulation helpers
 */
export interface TimeHelpers {
  /** Increase time by seconds */
  increase(seconds: number): Promise<void>;
  /** Set next block timestamp */
  setNextBlockTimestamp(timestamp: number): Promise<void>;
  /** Get latest block timestamp */
  latest(): Promise<number>;
}

/**
 * Test configuration options
 */
export interface TestConfig {
  /** Test file patterns */
  testMatch?: string[];
  /** Files to exclude */
  exclude?: string[];
  /** Timeout per test in ms */
  timeout?: number;
  /** Run tests in parallel */
  parallel?: boolean;
  /** Number of parallel workers */
  workers?: number;
  /** Stop on first failure */
  bail?: boolean;
  /** Test name filter pattern */
  grep?: string;
  /** Reporter format */
  reporter?: 'spec' | 'json' | 'junit';
  /** Enable gas reporting */
  gasReport?: boolean;
}

/**
 * Test run result
 */
export interface TestResult {
  /** Total tests run */
  total: number;
  /** Passed tests */
  passed: number;
  /** Failed tests */
  failed: number;
  /** Skipped tests */
  skipped: number;
  /** Total duration in ms */
  duration: number;
  /** Individual test results */
  tests: IndividualTestResult[];
  /** Total gas used */
  gasUsed?: bigint;
}

/**
 * Individual test result
 */
export interface IndividualTestResult {
  /** Test name */
  name: string;
  /** Test file */
  file: string;
  /** Test status */
  status: 'passed' | 'failed' | 'skipped';
  /** Duration in ms */
  duration: number;
  /** Error if failed */
  error?: Error;
  /** Gas used by this test */
  gasUsed?: bigint;
}
