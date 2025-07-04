const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying with CORRECT Solana EID 10232...");
    
    // LayerZero V2 Sepolia endpoint
    const LZ_ENDPOINT_V2_SEPOLIA = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    console.log("🎯 USING CORRECT EIDs:");
    console.log("   Ethereum Sepolia: 40161");
    console.log("   Solana Testnet: 10232 ✅ (CORRECTED!)");
    
    const EscrowOAppCorrectEID = await ethers.getContractFactory("EscrowOAppCorrectEID");
    
    const contract = await EscrowOAppCorrectEID.deploy(
        LZ_ENDPOINT_V2_SEPOLIA,
        deployer.address
    );
    
    await contract.deployed();
    
    console.log("✅ EscrowOAppCorrectEID deployed to:", contract.address);
    console.log("🌐 Explorer:", `https://sepolia.etherscan.io/address/${contract.address}`);
    
    console.log("\n🎯 CORRECT EID DEPLOYMENT COMPLETE!");
    console.log("====================================");
    console.log("Contract:", contract.address);
    console.log("Solana EID: 10232 (CORRECTED)");
    console.log("Ready to test REAL LayerZero messaging!");
    
    return contract.address;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;