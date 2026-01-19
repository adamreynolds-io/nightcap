# NIGHTCAP

Nightcap is [Midnight Foundation](https://github.com/midnightntwrk)'s Midnight development environment for professionals. Designed to simplify building, testing, and deploying smart contracts and dApps on the Midnight blockchain. Inspired by Ethereum's [Hardhat](https://hardhat.org/) (and many others), Nightcap provides a flexible environment for Midnight developers with features tailored to the unique aspects of the Midnight network.

## Quick Start

```bash
# Install
pnpm add -D @nightcap/core

# Create a project
npx nightcap init

# Start local network
npx nightcap node

# Compile contracts
npx nightcap compile

# Deploy
npx nightcap deploy
```

## Features

- **Local Midnight node simulation** for rapid development and testing of Compact Contracts
- **Automated contract compilation, deployment, and verification** workflows
- **Plugin architecture** to extend functionality for Midnight-specific use cases
- **Scriptable tasks** for common developer operations
- **TypeScript-first** with full type safety
- **Docker-based** local network with snapshot/restore capability

## Documentation

See the [docs/](./docs/) folder for comprehensive documentation:

- [Getting Started](./docs/getting-started.md) - Installation and your first project
- [Command Reference](./docs/commands.md) - All CLI commands and options
- [Configuration](./docs/configuration.md) - Config file reference
- [Plugin Development](./docs/plugins.md) - Creating Nightcap plugins
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

## Requirements

- Node.js 20 or higher
- Docker (for local network)
- pnpm (recommended)

Run `nightcap doctor` to verify your environment.

## Be Part of the Journey

Nightcap is an open source project maintained by the [Midnight Foundation](https://midnightfoundation.io/). We welcome contributions from the community to help improve and expand its capabilities.

## Reference Ecosystems

- [Ethereum Hardhat](https://hardhat.org/)
- [Ethereum Foundry](https://getfoundry.sh/)


### LICENSE

Apache 2.0.

### SECURITY.md

Provides a brief description of the Midnight Foundation's security policy and how to properly disclose security issues.

### CONTRIBUTING.md

Provides guidelines for how people can contribute to the Midnight project.

### CODEOWNERS

Defines repository ownership rules.

### ISSUE_TEMPLATE

Provides templates for reporting various types of issues, such as: bug report, documentation improvement and feature request.

### PULL_REQUEST_TEMPLATE

Provides a template for a pull request.

### CLA Assistant

The Midnight Foundation appreciates contributions, and like many other open source projects asks contributors to sign a contributor
License Agreement before accepting contributions. We use CLA assistant (https://github.com/cla-assistant/cla-assistant) to streamline the CLA
signing process, enabling contributors to sign our CLAs directly within a GitHub pull request.

### Dependabot

The Midnight Foundation uses GitHub Dependabot feature to keep our projects dependencies up-to-date and address potential security vulnerabilities. 

### Checkmarx

The Midnight Foundation uses Checkmarx for application security (AppSec) to identify and fix security vulnerabilities.
All repositories are scanned with Checkmarx's suite of tools including: Static Application Security Testing (SAST), Infrastructure as Code (IaC), Software Composition Analysis (SCA), API Security, Container Security and Supply Chain Scans (SCS).

### Unito

Facilitates two-way data synchronization, automated workflows and streamline processes between: Jira, GitHub issues and Github project Kanban board. 

# TODO - New Repo Owner

### Software Package Data Exchange (SPDX)
Include the following Software Package Data Exchange (SPDX) short-form identifier in a comment at the top headers of each source code file.


 <I>// This file is part of <B>NIGHTCAP</B>.<BR>
 // Copyright (C) 2025 Midnight Foundation<BR>
 // SPDX-License-Identifier: Apache-2.0<BR>
 // Licensed under the Apache License, Version 2.0 (the "License");<BR>
 // You may not use this file except in compliance with the License.<BR>
 // You may obtain a copy of the License at<BR>
 //<BR>
 //	http://www.apache.org/licenses/LICENSE-2.0<BR>
 //<BR>
 // Unless required by applicable law or agreed to in writing, software<BR>
 // distributed under the License is distributed on an "AS IS" BASIS,<BR>
 // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.<BR>
 // See the License for the specific language governing permissions and<BR>
 // limitations under the License.</I>
