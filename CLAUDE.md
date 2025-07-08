# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a blockchain learning project focused on building cross-chain escrow applications. The repository contains exercises and implementations across Solana (Rust/Anchor) and Ethereum (Solidity) ecosystems, with LayerZero integration for cross-chain functionality.

## Key Architecture Patterns

### Solana Account Structure
- All state stored in accounts, not contract storage
- Programs are stateless, accounts hold data
- Use `Context<T>` pattern for account validation

### Cross-Chain Message Flow
1. User deposits tokens on Source Chain
2. LayerZero OFT burns/locks tokens
3. Message sent to Destination Chain
4. Destination chain mints/releases tokens
5. Claim codes enable flexible redemption

### Security Considerations
- Always validate account ownership in Solana
- Use OpenZeppelin contracts for Ethereum
- Implement proper access controls for claim codes
- Verify LayerZero message authenticity

## Testing Commands

### Solana Testing
```bash
# Run specific test
anchor test --skip-deploy tests/test_name.ts

# Test with local validator
solana-test-validator
anchor test --provider.cluster localnet
```

### Ethereum Testing
```bash
# Run specific test file
npx hardhat test test/TestName.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Fork mainnet for testing
npx hardhat test --network hardhat-fork
```

### LayerZero Testing
```bash
# Test cross-chain locally
npx hardhat lz:test

# Verify deployment
npx hardhat lz:verify --network <network>
```

## Sprint Development References

### Sprint Execution Rules
1. **Follow sprint.md task breakdown exactly**
2. **Complete current task COMPLETELY before advancing**
3. **NEVER deviate from the current sprint.md task**
4. **Use TodoWrite tool to track progress**
5. **FOCUS ONLY on the current task - no tangents or extra work**

### Task Focus Protocol
- ✅ **ONLY work on current sprint.md task**
- ❌ **NEVER** work on multiple tasks simultaneously  
- ❌ **NEVER** add extra features or improvements
- ✅ **Complete task fully** before marking as done
- ✅ **Ask for next task** after current task completion

### Cross-Chain Development (Production)
1. Deploy contracts on testnets (Solana devnet + Ethereum Sepolia)
2. Configure LayerZero peers for cross-chain communication
3. Test message passing with real LayerZero V2 integration
4. Verify token transfers work correctly in demo

### Debugging Tips
- Use `anchor logs` for Solana debugging
- Use `console.log` in Hardhat for Ethereum
- Check LayerZero scan for cross-chain messages
- Always test with small amounts first

### Key Implementation Files
- **Sprint Plan**: `sprint.md` (5-hour development breakdown)
- **Technical Docs**: `/info_docs/` (LayerZero V2 integration patterns)

## Error Handling Protocol
**STOP AND DISCUSS**: When encountering 2+ consecutive failures or errors:
1. **Pause execution** - Do not continue trying fixes
2. **Summarize the core problem** in plain English
3. **Ask for guidance** before proceeding
4. **Discuss alternatives** - maybe the approach needs to change

## Development Blockers
When hitting technical blockers:
- ❌ **Never** keep trying the same approach repeatedly
- ✅ **Always** stop after 2-3 failed attempts and ask for direction
- ✅ **Explain** what's actually broken and why
- ✅ **Propose** alternative approaches or suggest stepping back

## LayerZero V2 Development Commands

### Core LayerZero App (my-lz-app/)
```bash
# Build all components
pnpm compile

# Run all tests
pnpm test

# Lint all code
pnpm lint

# Deploy to configured networks
npx hardhat lz:deploy

# Initialize cross-chain configuration
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts

# Send cross-chain messages
npx hardhat lz:oapp:send --from-eid 40168 --dst-eid 40232 --message "test"
```

### React UI (escrow-ui/)
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
pathway/
├── escrow-ui/              # React TypeScript frontend
│   ├── src/components/     # UI components
│   └── package.json
├── my-lz-app/              # Core LayerZero integration
│   ├── programs/my_oapp/   # Solana Anchor program
│   ├── contracts/          # Ethereum contracts
│   ├── layerzero.config.ts # Cross-chain configuration
│   └── hardhat.config.ts   # EVM network settings
├── sprint.md               # Current development tasks
└── CLAUDE.md              # This file
```

## Key Dependencies and Versions

### Critical Version Requirements
- **Solana CLI**: v1.17.31 (building) / v1.18.26 (deploying)
- **Anchor**: v0.29.0
- **Rust**: v1.75.0
- **Node.js**: >=18.16.0

### LayerZero Endpoint IDs
- Solana Devnet: `40168`
- Optimism Sepolia: `40232`
- Ethereum Sepolia: `40161`

## Current Project Status

### Completed (Phase 1)
- ✅ LayerZero V2 cross-chain messaging working both directions
- ✅ Solana program deployed and functional
- ✅ Optimism contract deployed and functional
- ✅ Development environment fully configured

### Current Focus (Phase 2)
- 🔨 Building OFT (Omnichain Fungible Token) functionality
- 🔨 Cross-chain token transfers (burn/mint mechanics)
- 🔨 Token supply management validation

### Future Goals (Phase 3)
- 🎯 Gift card claim code system
- 🎯 Multi-chain claim validation
- 🎯 User-friendly claiming interface

## Honesty Protocol
**NEVER claim something is tested/working unless you actually executed it**
- ❌ "Message sending tested" (when only code exists)
- ✅ "Message sending code implemented, needs actual testing"

**Always distinguish between:**
- **Implemented** = Code exists
- **Tested** = Actually executed and verified
- **Working** = Tested and confirmed functional

**When marking tasks complete:**
- Must provide specific evidence of what was actually done
- Must clearly state what still needs testing/validation
- Must admit gaps instead of glossing over them

**Co-worker mindset:**
- Point out risks and gaps honestly
- Say "I don't know" when uncertain
- Admit when something isn't actually complete
- Focus on real progress, not appearance of progress