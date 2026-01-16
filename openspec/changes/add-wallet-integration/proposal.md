# Change: Add Wallet Integration and Account Management

## Why
Developers need to manage wallets and accounts for testing, deployment, and dApp development. The midnight-node toolkit provides wallet state management, address generation, and balance tracking. Nightcap should expose these capabilities through developer-friendly commands while supporting secure key management for production deployments.

## What Changes
- Add `nightcap accounts` task for listing and managing accounts
- Implement secure key storage with encryption
- Support hardware wallets for production deployments
- Integrate toolkit's wallet state and address generation
- Add balance checking for shielded/unshielded tokens
- Support DUST registration workflow

## Impact
- Affected specs: `wallet-integration` (new capability)
- Affected code: `packages/nightcap-core` (wallet commands)
- Dependencies: midnight-node toolkit (wallet operations)
