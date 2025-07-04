# 🎁 Cross-Chain Escrow Gift System

A production-ready cross-chain escrow system that allows users to send SOL gifts that can be claimed as ETH on Ethereum, powered by LayerZero V2.

## ✨ Features

- 🔗 **Real LayerZero V2 Integration** - Not simulation, actual cross-chain protocol
- 🎁 **Gift Sending** - Send SOL gifts with unique claim codes
- 💰 **Cross-Chain Claiming** - Claim gifts as ETH on Ethereum
- 🎨 **Beautiful UI** - Modern React TypeScript interface
- 👛 **Wallet Integration** - Phantom (Solana) + MetaMask (Ethereum)
- 🔍 **Transparent** - All transactions visible on LayerZero Scan

## 🚀 Live Deployment

### Ethereum (Sepolia Testnet)
- **Contract**: `0x29171bd2bB474f46158707ccCDe4da1b9144ffa7`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x29171bd2bB474f46158707ccCDe4da1b9144ffa7)

### Solana (Devnet)
- **Program**: `2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v`
- **Explorer**: [View on Solana Explorer](https://explorer.solana.com/address/2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v?cluster=devnet)

### LayerZero V2
- **Proof Transaction**: [View on LayerZero Scan](https://testnet.layerzeroscan.com/tx/0xd039dc6dca8ee219bf80c51eea169a1276577b9a88d0538665920bb6338a6d0f)

## 🛠️ Tech Stack

- **Frontend**: React TypeScript with modern CSS
- **Solana**: Anchor framework + Rust
- **Ethereum**: Solidity + Hardhat
- **Cross-Chain**: LayerZero V2 OApp protocol
- **Wallets**: Solana Wallet Adapter + Ethers.js

## 📱 How to Use

### Sending a Gift (Solana)
1. Connect your Phantom wallet
2. Enter gift amount in SOL
3. Add recipient name and message (optional)
4. Create gift and share the claim code

### Claiming a Gift (Ethereum)
1. Connect your MetaMask wallet (will auto-switch to Sepolia)
2. Enter the claim code from the sender
3. Pay small LayerZero fee (~$0.02)
4. Receive equivalent ETH after cross-chain verification

## 🏗️ Project Structure

```
pathway/
├── escrow-ui/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── GiftSender.tsx
│   │   │   └── ClaimReceiver.tsx
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── my-lz-app/              # Core LayerZero integration
│   ├── programs/oft/       # Solana Anchor program
│   ├── evm-contracts/      # Ethereum contracts
│   └── test-complete-flow.js  # System validation
└── DEPLOYMENT.md           # Deployment information
```

## 🧪 Development

### Prerequisites
- Node.js 16+
- Rust + Solana CLI
- Anchor CLI
- Phantom Wallet
- MetaMask

### Setup
```bash
# Install dependencies
cd escrow-ui
npm install

# Start the UI
npm start
```

### Testing
```bash
# Validate the entire system
cd my-lz-app
node test-complete-flow.js

# Check wallet balances
node check-balance.js
```

## 🔧 Configuration

The system uses real LayerZero V2 endpoints:
- **Ethereum Sepolia EID**: 10161
- **Solana Devnet EID**: 10232
- **Cross-chain fees**: ~$0.02 USD per transaction

## 🎯 Hackathon Ready

This project demonstrates:
- ✅ Real LayerZero V2 protocol integration
- ✅ Production-ready smart contracts
- ✅ Cross-chain message verification
- ✅ User-friendly interface
- ✅ Transparent on-chain proof

Perfect for showcasing cross-chain capabilities with actual working transactions!

## 📄 License

MIT License - feel free to use and modify for your projects.

---

Built with ❤️ using LayerZero V2 for seamless cross-chain experiences.