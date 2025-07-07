#!/bin/bash

echo "🧹 Cleaning up test files and development artifacts..."

# Remove test files from my-lz-app (keep only essential ones)
cd my-lz-app

echo "📁 Removing old test files..."
rm -f test-v2-breakthrough.js
rm -f test-proper-options.js
rm -f test-real-oapp.js
rm -f test-final-breakthrough.js
rm -f test-fixed-oapp.js
rm -f test-minimal-options.js
rm -f test-correct-eid.js
rm -f test-working-oapp.js
rm -f test-ethereum-only.js
rm -f test-bidirectional-flow.js
rm -f test-correct-options.js
rm -f test-layerzero-message.js
rm -f test-cross-chain-final.js
rm -f test-simple-claim.js
rm -f test-real-layerzero.js

# Remove old scripts
rm -f scripts/test-cross-chain.js
rm -f simple-test.js
rm -f real-escrow-test.js
rm -f setup-new-contract.js
rm -f debug-contract.js
rm -f fund-contract.js

# Remove old contract files
rm -f contracts/EscrowClaimer.sol
rm -f contracts/MockLZEndpoint.sol

# Keep essential files
echo "✅ Keeping essential files:"
echo "  - test-complete-flow.js (system validation)"
echo "  - configure-solana-peer.js (peer setup)"
echo "  - check-balance.js (debugging)"
echo "  - create-real-tx.js (real transactions)"

# Clean up build artifacts
echo "🗑️ Cleaning build artifacts..."
rm -rf test-ledger/
rm -rf target/deploy/*.so.old
rm -rf target/deploy/*.so.backup

# Remove unnecessary keypairs
rm -f alice.json
rm -f junk-id.json

echo "🎯 Creating production deployment info..."
cat > DEPLOYMENT.md << 'EOF'
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
EOF

cd ..

echo "✨ Cleanup complete!"
echo "📦 Ready for git push with:"
echo "  ✅ Working React UI (escrow-ui/)"
echo "  ✅ Deployed contracts and program"
echo "  ✅ Essential validation scripts"
echo "  ✅ Clean project structure"