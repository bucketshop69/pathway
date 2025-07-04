const { ethers } = require("hardhat");

async function configurePeer() {
    console.log("🔗 Configuring Ethereum Peer for LayerZero V2");
    console.log("===============================================");
    
    // 1. Your deployed contract and Solana program ID
    const ETHEREUM_CONTRACT = "0x29171bd2bB474f46158707ccCDe4da1b9144ffa7";
    const SOLANA_PROGRAM_ID = "2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v";
    const SOLANA_EID = 10232;
    
    console.log("📋 Configuration Details:");
    console.log("  Ethereum Contract:", ETHEREUM_CONTRACT);
    console.log("  Solana Program:", SOLANA_PROGRAM_ID);
    console.log("  Solana EID:", SOLANA_EID);
    
    try {
        // 2. Convert Solana address to bytes32 using your method
        // First decode base58 to bytes
        const bs58 = require('bs58');
        const solanaAddressBytes = bs58.default?.decode ? bs58.default.decode(SOLANA_PROGRAM_ID) : bs58.decode(SOLANA_PROGRAM_ID);
        
        // Convert to hex and pad to 32 bytes
        const solanaHex = '0x' + Buffer.from(solanaAddressBytes).toString('hex');
        const solanaBytes32 = ethers.utils.hexZeroPad(solanaHex, 32);
        
        console.log("\n🔄 Address Conversion:");
        console.log("  Solana bytes:", Buffer.from(solanaAddressBytes).toString('hex'));
        console.log("  Solana bytes32:", solanaBytes32);
        
        // 3. Get your deployed contract
        const escrowContract = await ethers.getContractAt(
            "LayerZeroEscrowV2",
            ETHEREUM_CONTRACT
        );
        
        // 4. Check current peer (should be empty)
        console.log("\n🔍 Checking current peer configuration...");
        try {
            const currentPeer = await escrowContract.getPeer(SOLANA_EID);
            console.log("  Current Solana peer:", currentPeer);
            
            if (currentPeer !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
                console.log("✅ Peer already configured!");
                return { success: true, alreadyConfigured: true };
            }
        } catch (error) {
            console.log("  No peer configured yet (expected)");
        }
        
        // 5. Set the peer
        console.log("\n📡 Setting Solana peer in Ethereum contract...");
        const tx = await escrowContract.setPeer(
            SOLANA_EID,
            solanaBytes32,
            { gasLimit: 100000 }
        );
        
        console.log("  Transaction hash:", tx.hash);
        console.log("  Waiting for confirmation...");
        await tx.wait();
        console.log("✅ Peer configuration confirmed!");
        
        // 6. Verify peer configuration
        console.log("\n🔍 Verifying peer configuration...");
        const configuredPeer = await escrowContract.getPeer(SOLANA_EID);
        console.log("  Configured Solana peer:", configuredPeer);
        
        // Test fee quote now that peer is set
        console.log("\n💰 Testing fee estimation with peer configured...");
        try {
            const testRequestId = ethers.utils.randomBytes(32);
            const testAmount = ethers.utils.parseEther("0.1");
            
            const fee = await escrowContract.quoteVerification(testRequestId, testAmount);
            console.log("  ✅ Estimated fee:", ethers.utils.formatEther(fee.nativeFee), "ETH");
            console.log("  ✅ LZ Token fee:", fee.lzTokenFee.toString());
        } catch (error) {
            console.log("  ⚠️ Fee estimation error:", error.message);
        }
        
        console.log("\n🎉 SUCCESS: Ethereum peer configuration complete!");
        console.log("🔗 Ethereum Contract:", ETHEREUM_CONTRACT);
        console.log("🔗 Configured Solana Peer:", configuredPeer);
        console.log("🔗 Transaction:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        return {
            success: true,
            ethereumContract: ETHEREUM_CONTRACT,
            solanaPeer: configuredPeer,
            transactionHash: tx.hash
        };
        
    } catch (error) {
        console.error("❌ Peer configuration failed:", error.message);
        throw error;
    }
}

// Run configuration
if (require.main === module) {
    configurePeer()
        .then((result) => {
            if (result.success) {
                console.log("\n✅ Ethereum peer configuration completed!");
                console.log("📋 Next: Configure Solana peer to point to Ethereum");
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Configuration failed:", error);
            process.exit(1);
        });
}

module.exports = configurePeer;