# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LayerZero V2 OApp (Omnichain Application) example that demonstrates cross-chain messaging between Solana and EVM chains. It's a simple string-passing application that showcases how to build cross-chain applications using LayerZero's infrastructure.

## Architecture

### Dual-Chain Structure
- **Solana Program**: Written in Rust using Anchor framework (`programs/my_oapp/`)
- **EVM Contract**: Written in Solidity using Hardhat (`contracts/MyOApp.sol`)
- **LayerZero V2**: Handles cross-chain message passing between chains

### Key Components
- **OApp Core**: Both Solana and EVM implementations inherit from LayerZero's OApp standard
- **Message Codec**: String encoding/decoding for cross-chain messages (`contracts/libs/StringMsgCodec.sol`)
- **Cross-Chain Configuration**: Defined in `layerzero.config.ts` for peer relationships and execution options

## Development Commands

### Building
```bash
# Compile all contracts (Solidity + Solana)
pnpm compile

# Build specific targets
pnpm compile:forge      # Solidity contracts
pnpm compile:hardhat    # Hardhat compilation
pnpm compile:anchor     # Solana program
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:forge         # Foundry tests
pnpm test:hardhat       # Hardhat tests
pnpm test:anchor        # Anchor tests
```

### Linting
```bash
# Run all linting
pnpm lint

# Lint and fix issues
pnpm lint:fix

# Specific linting
pnpm lint:js           # JavaScript/TypeScript
pnpm lint:sol          # Solidity
```

## Deployment Workflow

### Prerequisites
- Rust v1.75.0 + Anchor v0.29.0 + Solana CLI v1.17.31
- Node.js + Docker (for Anchor builds)
- Configured `.env` file with private keys and RPC URLs

### Solana Deployment
```bash
# Generate program keypair
solana-keygen new -o target/deploy/my_oapp-keypair.json
anchor keys sync

# Build with program ID
anchor build -v -e MYOAPP_ID=<PROGRAM_ID>

# Deploy (requires Solana v1.18.26 temporarily)
solana program deploy --program-id target/deploy/my_oapp-keypair.json target/verifiable/my_oapp.so -u devnet

# Initialize OApp store account
npx hardhat lz:oapp:solana:create --eid 40168 --program-id <PROGRAM_ID>
```

### EVM Deployment
```bash
# Deploy to configured networks
npx hardhat lz:deploy

# Initialize Solana-specific config accounts
npx hardhat lz:oapp:solana:init-config --oapp-config layerzero.config.ts

# Wire cross-chain connections
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

## Cross-Chain Messaging

### Sending Messages
```bash
# Solana to EVM
npx hardhat lz:oapp:send --from-eid 40168 --dst-eid 40232 --message "Hello from Solana"

# EVM to Solana
npx hardhat --network optimism-testnet lz:oapp:send --from-eid 40232 --dst-eid 40168 --message "Hello from Optimism"
```

### Key Endpoint IDs
- Solana Testnet (Devnet): `40168`
- Optimism Sepolia: `40232`

## Important File Locations

### Configuration
- `layerzero.config.ts`: Cross-chain peer configuration, enforced options, and pathway definitions
- `hardhat.config.ts`: EVM network configuration and deployment settings
- `Anchor.toml`: Solana program configuration and cluster settings

### Core Implementation
- `programs/my_oapp/src/lib.rs`: Main Solana program entry point
- `contracts/MyOApp.sol`: EVM contract implementation
- `contracts/libs/StringMsgCodec.sol`: Message encoding/decoding utilities

### Generated Code
- `lib/client/generated/`: Auto-generated Solana client code via Kinobi
- `tasks/`: Hardhat tasks for deployment and cross-chain operations

## Development Patterns

### Solana Account Management
- Programs are stateless, all state stored in accounts
- Use `Context<T>` pattern for instruction validation
- Accounts must be initialized explicitly before use
- PDA derivation follows LayerZero's expected seeds (`Store`, `Peer`, `LzReceiveTypes`)

### Cross-Chain Message Flow
1. User calls `send()` on source chain
2. LayerZero protocol handles message routing
3. Destination chain receives via `lz_receive()` (Solana) or `_lzReceive()` (EVM)
4. Message payload decoded and processed

### Security Considerations
- Always validate account ownership in Solana instructions
- Use OpenZeppelin contracts as base for EVM implementations
- Verify LayerZero message authenticity through proper origin validation
- Implement proper access controls for administrative functions

## Debugging

### Common Issues
- **Solana Build Failures**: Ensure exact versions (Rust 1.75.0, Anchor 0.29.0, Solana CLI 1.17.31)
- **Account Not Found**: Run `init-config` task to create required accounts
- **Message Delivery Failures**: Check LayerZero scan for transaction status
- **Gas Estimation**: Profile destination chain gas usage for proper execution options

### Useful Commands
```bash
# View Solana logs
solana logs

# Debug Solana accounts
solana account <ACCOUNT_ADDRESS>

# Check LayerZero configuration
npx hardhat lz:oapp:config:get --oapp-config layerzero.config.ts
```

## Testing Strategy

### Local Testing
- Use `solana-test-validator` for local Solana testing
- Hardhat network for EVM testing
- LayerZero provides test helpers for cross-chain scenarios

### Network Testing
- Deploy to testnets (Solana Devnet + Optimism Sepolia)
- Test with small amounts first
- Monitor transactions on respective block explorers
- Verify message delivery through LayerZero scan

## Version Requirements

Critical version dependencies that must be maintained:
- **Solana CLI**: v1.17.31 (for building) / v1.18.26 (for deploying)
- **Anchor**: v0.29.0
- **Rust**: v1.75.0
- **Node.js**: >=18.16.0