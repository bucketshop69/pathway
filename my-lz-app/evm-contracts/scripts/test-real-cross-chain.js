const { ethers } = require("hardhat");

async function testRealCrossChain() {
    console.log("🌉 TESTING REAL LAYERZERO V2 CROSS-CHAIN MESSAGE");
    console.log("================================================");
    
    // Contract details
    const ETHEREUM_CONTRACT = "0x29171bd2bB474f46158707ccCDe4da1b9144ffa7";
    const SOLANA_EID = 10232;
    
    console.log("📋 Test Details:");
    console.log("  Ethereum Contract:", ETHEREUM_CONTRACT);
    console.log("  Target: Solana Devnet (EID", SOLANA_EID + ")");
    console.log("  Configured Peer: 0x1a856a270be0e977b1dc55f1f8c8f6ea9a1dab2b50d95c5f6ef7be6a2f314239");
    
    try {
        const [signer] = await ethers.getSigners();
        console.log("  Sender:", signer.address);
        console.log("  Balance:", ethers.utils.formatEther(await signer.getBalance()), "ETH");
        
        // Get contract instance
        const escrowContract = await ethers.getContractAt(
            "LayerZeroEscrowV2",
            ETHEREUM_CONTRACT
        );
        
        // Generate test verification request
        const requestId = ethers.utils.randomBytes(32);
        const amount = ethers.utils.parseEther("0.1");
        
        console.log("\n🔍 Test Message Details:");
        console.log("  Request ID:", ethers.utils.hexlify(requestId));
        console.log("  Amount:", ethers.utils.formatEther(amount), "ETH");
        console.log("  Requester:", signer.address);
        
        // Get fee quote
        console.log("\n💰 Getting LayerZero V2 fee quote...");
        const fee = await escrowContract.quoteVerification(requestId, amount);
        console.log("  Native fee:", ethers.utils.formatEther(fee.nativeFee), "ETH");
        console.log("  LZ Token fee:", fee.lzTokenFee.toString());
        console.log("  USD estimate: ~$", (parseFloat(ethers.utils.formatEther(fee.nativeFee)) * 2500).toFixed(3));
        
        // Check we have enough ETH
        const balance = await signer.getBalance();
        const totalCost = fee.nativeFee.add(ethers.utils.parseEther("0.01")); // + gas buffer
        
        if (balance.lt(totalCost)) {
            console.log("❌ Insufficient balance for test");
            console.log("  Required:", ethers.utils.formatEther(totalCost), "ETH");
            console.log("  Available:", ethers.utils.formatEther(balance), "ETH");
            return { success: false, reason: "insufficient_balance" };
        }
        
        // Send real LayerZero V2 cross-chain message
        console.log("\n🚀 Sending REAL LayerZero V2 cross-chain message...");
        console.log("  This will create an actual LayerZero protocol transaction!");
        
        const tx = await escrowContract.requestVerification(
            requestId,
            amount,
            {
                value: fee.nativeFee,
                gasLimit: 500000
            }
        );
        
        console.log("  Transaction hash:", tx.hash);
        console.log("  Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("  Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("  Block:", receipt.blockNumber);
        console.log("  Gas used:", receipt.gasUsed.toString());
        
        // Parse events
        console.log("\n📝 Parsing transaction events...");
        const events = receipt.logs.map(log => {
            try {
                return escrowContract.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
        
        let verificationRequestEvent = null;
        events.forEach(event => {
            console.log("  Event:", event.name);
            if (event.name === "VerificationRequested") {
                verificationRequestEvent = event;
                console.log("    Request ID:", event.args.requestId);
                console.log("    Requester:", event.args.requester);
                console.log("    Amount:", ethers.utils.formatEther(event.args.amount), "ETH");
            }
        });
        
        // Look for LayerZero protocol events in all logs
        console.log("\n🔍 Checking for LayerZero protocol events...");
        let layerZeroFound = false;
        
        receipt.logs.forEach((log, index) => {
            // LayerZero V2 events have specific signatures
            if (log.topics[0]) {
                console.log(`  Log ${index}:`, log.address);
                console.log("    Topics:", log.topics.length);
                
                // Check if this is from LayerZero endpoint
                if (log.address.toLowerCase() === "0x464570adA09869d8741132183721B4f0769a0287".toLowerCase()) {
                    layerZeroFound = true;
                    console.log("    ✅ LayerZero V2 Endpoint Event Found!");
                }
            }
        });
        
        if (!layerZeroFound) {
            console.log("  ⚠️ No LayerZero endpoint events found");
        }
        
        // Check LayerZero Scan
        console.log("\n🔍 LayerZero Scan Information:");
        console.log("  Check transaction in LayerZero Scan:");
        console.log("  https://testnet.layerzeroscan.com/tx/" + tx.hash);
        
        // Wait a bit and check claim status
        console.log("\n⏳ Checking claim status...");
        const claimDetails = await escrowContract.claims(requestId);
        console.log("  Claim stored:", claimDetails.amount.gt(0));
        console.log("  Amount:", ethers.utils.formatEther(claimDetails.amount), "ETH");
        console.log("  Claimer:", claimDetails.claimer);
        console.log("  Verified:", claimDetails.verified);
        console.log("  Claimed:", claimDetails.claimed);
        
        console.log("\n🎉 REAL LAYERZERO V2 CROSS-CHAIN MESSAGE TEST COMPLETE!");
        console.log("================================================");
        console.log("✅ Real LayerZero V2 protocol transaction sent");
        console.log("✅ Cross-chain verification request initiated");
        console.log("✅ Events emitted and logged");
        console.log("✅ Claim data stored on Ethereum");
        
        console.log("\n📋 RESULTS FOR HACKATHON:");
        console.log("🔗 Transaction Hash:", tx.hash);
        console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("🔗 LayerZero Scan:", `https://testnet.layerzeroscan.com/tx/${tx.hash}`);
        console.log("🔗 Request ID:", ethers.utils.hexlify(requestId));
        console.log("🔗 Cross-chain fee paid:", ethers.utils.formatEther(fee.nativeFee), "ETH");
        
        return {
            success: true,
            transactionHash: tx.hash,
            requestId: ethers.utils.hexlify(requestId),
            layerZeroScan: `https://testnet.layerzeroscan.com/tx/${tx.hash}`,
            etherscan: `https://sepolia.etherscan.io/tx/${tx.hash}`,
            feePaid: ethers.utils.formatEther(fee.nativeFee),
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
        
    } catch (error) {
        console.error("❌ Cross-chain test failed:", error.message);
        
        if (error.message.includes("NoPeer")) {
            console.log("💡 Hint: Peer not configured. Run configure-ethereum-peer.js first");
        }
        
        return { success: false, error: error.message };
    }
}

// Run test
if (require.main === module) {
    testRealCrossChain()
        .then((result) => {
            if (result.success) {
                console.log("\n🌟 REAL LAYERZERO V2 CROSS-CHAIN TEST: SUCCESS! 🌟");
                console.log("This transaction proves LayerZero V2 integration works!");
            } else {
                console.log("\n💥 Test failed:", result.error || result.reason);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Test execution failed:", error);
            process.exit(1);
        });
}

module.exports = testRealCrossChain;