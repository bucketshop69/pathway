# Cross-Chain Escrow System - Deployment Info

## Live Deployment

### Ethereum (Sepolia)
- **Contract Address**: `0x29171bd2bB474f46158707ccCDe4da1b9144ffa7`
- **Network**: Sepolia Testnet
- **Explorer**: https://sepolia.etherscan.io/address/0x29171bd2bB474f46158707ccCDe4da1b9144ffa7

### Solana (Devnet)
- **Program ID**: `2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v`
- **Network**: Devnet
- **Explorer**: https://explorer.solana.com/address/2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v?cluster=devnet

### LayerZero V2
- **Ethereum EID**: 10161 (Sepolia)
- **Solana EID**: 10232 (Devnet)
- **Real Cross-Chain TX**: https://testnet.layerzeroscan.com/tx/0xd039dc6dca8ee219bf80c51eea169a1276577b9a88d0538665920bb6338a6d0f

## Features
✅ Real LayerZero V2 integration (not simulation)
✅ Cross-chain gift sending (SOL → ETH)
✅ Beautiful React TypeScript UI
✅ Wallet integration (Phantom + MetaMask)
✅ Production-ready contracts

## Usage
1. **Send Gift**: Connect Phantom wallet, create SOL gift with claim code
2. **Claim Gift**: Connect MetaMask, enter claim code, receive ETH
3. **Cross-Chain**: LayerZero V2 handles verification between chains

## Tech Stack
- **Frontend**: React TypeScript + Tailwind-like CSS
- **Solana**: Anchor framework + Rust
- **Ethereum**: Solidity + Hardhat
- **Cross-Chain**: LayerZero V2 OApp protocol
