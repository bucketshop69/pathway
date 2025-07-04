const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying EVM Cross-Chain Escrow Contracts...");
    console.log("================================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    try {
        // Step 1: Deploy Mock LayerZero Endpoint (for testing)
        console.log("\n📦 Step 1: Deploying MockLZEndpoint...");
        const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
        const mockEndpoint = await MockLZEndpoint.deploy();
        await mockEndpoint.deployed();
        console.log("✅ MockLZEndpoint deployed to:", mockEndpoint.address);
        
        // Step 2: Deploy EscrowClaimerV2 Contract
        console.log("\n📦 Step 2: Deploying EscrowClaimerV2...");
        const EscrowClaimer = await ethers.getContractFactory("EscrowClaimerV2");
        const escrowClaimer = await EscrowClaimer.deploy();
        await escrowClaimer.deployed();
        console.log("✅ EscrowClaimer deployed to:", escrowClaimer.address);
        
        // Step 3: Fund the contract with test ETH
        console.log("\n💰 Step 3: Funding EscrowClaimer contract...");
        const fundAmount = ethers.utils.parseEther("0.005");
        const fundTx = await deployer.sendTransaction({
            to: escrowClaimer.address,
            value: fundAmount
        });
        await fundTx.wait();
        console.log("✅ Funded contract with", ethers.utils.formatEther(fundAmount), "ETH");
        
        // Step 4: Verify deployment
        console.log("\n🔍 Step 4: Verifying deployment...");
        const contractBalance = await ethers.provider.getBalance(escrowClaimer.address);
        const owner = await escrowClaimer.owner();
        
        console.log("📊 Deployment Summary:");
        console.log("  Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
        console.log("  Contract Owner:", owner);
        console.log("  Solana EID:", await escrowClaimer.SOLANA_EID());
        
        // Step 5: Test basic functionality
        console.log("\n🧪 Step 5: Testing basic functionality...");
        
        // Test claim code validation
        const testClaimCode = "TEST123";
        const isValid = await escrowClaimer.isClaimValid(testClaimCode);
        console.log("  Empty claim code valid:", isValid, "(should be false)");
        
        // Test statistics
        const stats = await escrowClaimer.getStats();
        console.log("  Initial stats:", {
            totalClaims: stats._totalClaims.toString(),
            successfulClaims: stats._successfulClaims.toString(),
            totalValueClaimed: ethers.utils.formatEther(stats._totalValueClaimed),
            contractBalance: ethers.utils.formatEther(stats.contractBalance)
        });
        
        console.log("\n🎉 SUCCESS: EVM contracts deployed and ready!");
        console.log("🔗 Contract Addresses:");
        console.log("   MockLZEndpoint:", mockEndpoint.address);
        console.log("   EscrowClaimer:", escrowClaimer.address);
        
        console.log("\n📝 Next Steps:");
        console.log("   1. Run test suite: npx hardhat test");
        console.log("   2. Configure LayerZero peers");
        console.log("   3. Test cross-chain flow");
        
        return {
            mockEndpoint: mockEndpoint.address,
            escrowClaimer: escrowClaimer.address
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

// Run deployment
if (require.main === module) {
    main()
        .then((addresses) => {
            console.log("\n✅ Deployment completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;