## ADDED Requirements

### Requirement: Account Listing
The system SHALL provide commands to list and display account information.

#### Scenario: List all accounts
- **WHEN** user runs `nightcap accounts`
- **THEN** display all configured accounts with addresses

#### Scenario: Show account details
- **WHEN** user runs `nightcap accounts show <name>`
- **THEN** display account address (shielded and unshielded)
- **THEN** display account balance

#### Scenario: List development accounts
- **WHEN** local network is running
- **THEN** include pre-funded development accounts in list

### Requirement: Account Generation
The system SHALL support generating new accounts.

#### Scenario: Generate new account
- **WHEN** user runs `nightcap accounts new`
- **THEN** generate new keypair
- **THEN** prompt for encryption password
- **THEN** store encrypted in keystore

#### Scenario: Generate with name
- **WHEN** user runs `nightcap accounts new --name deployer`
- **THEN** create account with specified alias

#### Scenario: Generate from mnemonic
- **WHEN** user runs `nightcap accounts new --mnemonic`
- **THEN** generate mnemonic phrase
- **THEN** derive account from mnemonic

### Requirement: Account Import/Export
The system SHALL support importing and exporting accounts.

#### Scenario: Import private key
- **WHEN** user runs `nightcap accounts import`
- **THEN** prompt for private key
- **THEN** prompt for encryption password
- **THEN** store encrypted in keystore

#### Scenario: Export private key
- **WHEN** user runs `nightcap accounts export <name>`
- **THEN** prompt for keystore password
- **THEN** display private key with security warning

#### Scenario: Import from mnemonic
- **WHEN** user runs `nightcap accounts import --mnemonic`
- **THEN** prompt for mnemonic phrase
- **THEN** derive and store account

### Requirement: Balance Checking
The system SHALL provide balance checking through toolkit integration.

#### Scenario: Check balance
- **WHEN** user runs `nightcap balance <address>`
- **THEN** query blockchain for balance
- **THEN** display shielded and unshielded DUST amounts

#### Scenario: Check token balance
- **WHEN** user runs `nightcap balance <address> --token <contract>`
- **THEN** display balance of specified token contract

#### Scenario: Watch balance
- **WHEN** user runs `nightcap balance <address> --watch`
- **THEN** continuously poll and display balance changes

### Requirement: Secure Key Storage
The system SHALL store private keys securely.

#### Scenario: Encrypted keystore
- **WHEN** account is created or imported
- **THEN** encrypt private key with user password
- **THEN** store in `~/.nightcap/keystore/`

#### Scenario: Unlock account for transaction
- **WHEN** transaction requires signing
- **THEN** prompt for keystore password
- **THEN** unlock account for signing duration

#### Scenario: Environment variable keys
- **WHEN** `NIGHTCAP_PRIVATE_KEY` environment variable is set
- **THEN** use key for signing without keystore lookup

### Requirement: Hardware Wallet Support
The system SHALL support hardware wallets for secure signing.

#### Scenario: Connect Ledger
- **WHEN** user runs `nightcap accounts --ledger`
- **THEN** connect to Ledger device
- **THEN** display available accounts

#### Scenario: Deploy with Ledger
- **WHEN** user runs `nightcap deploy --ledger`
- **THEN** request signature on Ledger device
- **THEN** display transaction details on device screen

#### Scenario: Derivation path
- **WHEN** user specifies `--ledger-path "m/44'/60'/0'/0/0"`
- **THEN** use specified HD derivation path

### Requirement: Configuration-Based Accounts
The system SHALL support accounts defined in configuration.

#### Scenario: Named accounts in config
- **WHEN** configuration defines named accounts
- **THEN** accounts are available by name in tasks and scripts

#### Scenario: Account reference
- **WHEN** config specifies `deployer: { keystore: "deployer.json" }`
- **THEN** load account from keystore file when referenced

### Requirement: DUST Registration
The system SHALL support DUST token registration workflow.

#### Scenario: Check registration status
- **WHEN** user runs `nightcap accounts register-status <address>`
- **THEN** display whether address is registered for DUST

#### Scenario: Register address
- **WHEN** user runs `nightcap accounts register <address>`
- **THEN** initiate DUST registration transaction

### Requirement: Testnet Faucet
The system SHALL provide access to testnet faucet.

#### Scenario: Request testnet tokens
- **WHEN** user runs `nightcap faucet <address>`
- **THEN** request tokens from testnet faucet
- **THEN** display transaction status

#### Scenario: Faucet cooldown
- **WHEN** user requests faucet too frequently
- **THEN** display cooldown time remaining

### Requirement: Address Generation
The system SHALL generate both shielded and unshielded addresses.

#### Scenario: Generate shielded address
- **WHEN** user runs `nightcap accounts address --shielded`
- **THEN** generate and display shielded address

#### Scenario: Generate unshielded address
- **WHEN** user runs `nightcap accounts address --unshielded`
- **THEN** generate and display unshielded address

#### Scenario: Display both addresses
- **WHEN** user runs `nightcap accounts show <name>`
- **THEN** display both shielded and unshielded addresses
