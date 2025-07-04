const { ethers } = require("hardhat");

// Real LayerZero V2 Endpoints
const LAYERZERO_V2_ENDPOINTS = {
    SEPOLIA: {
        EID: 10161,
        ENDPOINT: "0x464570adA09869d8741132183721B4f0769a0287"  // Confirmed V2 endpoint
    },
    SOLANA_DEVNET: {
        EID: 10232,
        ENDPOINT: "LZ2giUiBi6KjQzWjoCowPQb1wLNqAqPZGVSFtMSsQbu"  // V2 endpoint
    }
};

async function main() {
    console.log("🚀 Deploying LayerZero V2 Escrow Contract...");
    console.log("===============================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    console.log("🔗 Using LayerZero V2 Endpoint:", LAYERZERO_V2_ENDPOINTS.SEPOLIA.ENDPOINT);
    
    try {
        // Deploy LayerZero V2 Escrow Contract
        console.log("\n📦 Deploying LayerZeroEscrowV2...");
        const LayerZeroEscrowV2 = await ethers.getContractFactory("LayerZeroEscrowV2");
        const escrowContract = await LayerZeroEscrowV2.deploy(
            LAYERZERO_V2_ENDPOINTS.SEPOLIA.ENDPOINT,
            deployer.address
        );
        await escrowContract.deployed();
        console.log("✅ LayerZeroEscrowV2 deployed to:", escrowContract.address);
        
        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const owner = await escrowContract.owner();
        const solanaEid = await escrowContract.SOLANA_EID();
        const sepoliaEid = await escrowContract.SEPOLIA_EID();
        
        console.log("📊 Contract Details:");
        console.log("  Owner:", owner);
        console.log("  Solana EID:", solanaEid.toString());
        console.log("  Sepolia EID:", sepoliaEid.toString());
        
        // Test fee quote
        console.log("\n💰 Testing fee estimation...");
        const testRequestId = ethers.utils.randomBytes(32);
        const testAmount = ethers.utils.parseEther("0.1");
        
        try {
            const fee = await escrowContract.quoteVerification(testRequestId, testAmount);
            console.log("  Estimated fee:", ethers.utils.formatEther(fee.nativeFee), "ETH");
            console.log("  LZ Token fee:", fee.lzTokenFee.toString());
        } catch (error) {
            console.log("  Fee estimation error (expected if no peer set):", error.message);
        }
        
        // Fund contract for testing
        console.log("\n💰 Funding contract for claims...");
        const fundAmount = ethers.utils.parseEther("0.01");
        const fundTx = await deployer.sendTransaction({
            to: escrowContract.address,
            value: fundAmount
        });
        await fundTx.wait();
        console.log("✅ Funded contract with", ethers.utils.formatEther(fundAmount), "ETH");
        
        console.log("\n🎉 SUCCESS: LayerZero V2 Contract Ready!");
        console.log("🔗 Contract Address:", escrowContract.address);
        console.log("🔗 LayerZero Endpoint:", LAYERZERO_V2_ENDPOINTS.SEPOLIA.ENDPOINT);
        
        console.log("\n📝 Next Steps:");
        console.log("   1. Deploy Solana program with LayerZero V2");
        console.log("   2. Configure peers between chains");
        console.log("   3. Test cross-chain verification");
        
        // Prepare address conversion for Solana
        const contractBytes32 = ethers.utils.hexZeroPad(escrowContract.address, 32);
        console.log("\n🔄 Address Conversion for Solana:");
        console.log("   Contract as bytes32:", contractBytes32);
        
        return {
            contract: escrowContract.address,
            endpoint: LAYERZERO_V2_ENDPOINTS.SEPOLIA.ENDPOINT,
            contractBytes32: contractBytes32
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

// Run deployment
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n✅ LayerZero V2 deployment completed!");
            console.log("📋 Results:", result);
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;