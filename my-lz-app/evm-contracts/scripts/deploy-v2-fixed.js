const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying LayerZero V2 FIXED EscrowOApp...");
    
    // CORRECT LayerZero V2 Sepolia endpoint
    const LZ_ENDPOINT_V2_SEPOLIA = "0x464570adA09869d8741132183721B4f0769a0287";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    console.log("📡 Using CORRECT LayerZero V2 endpoint:", LZ_ENDPOINT_V2_SEPOLIA);
    console.log("🎯 Target: Solana Testnet EID 30168");
    
    const EscrowOAppV2Fixed = await ethers.getContractFactory("EscrowOAppV2Fixed");
    
    const contract = await EscrowOAppV2Fixed.deploy(
        LZ_ENDPOINT_V2_SEPOLIA,  // CORRECT V2 endpoint
        deployer.address         // delegate = owner
    );
    
    await contract.deployed();
    
    console.log("✅ EscrowOAppV2Fixed deployed to:", contract.address);
    console.log("🌐 Explorer:", `https://sepolia.etherscan.io/address/${contract.address}`);
    
    console.log("\n📋 LAYERZERO V2 BREAKTHROUGH!");
    console.log("============================");
    console.log("Contract:", contract.address);
    console.log("V2 Endpoint:", LZ_ENDPOINT_V2_SEPOLIA);
    console.log("Key fixes:");
    console.log("  ✅ Correct Sepolia V2 endpoint");
    console.log("  ✅ Path verification");
    console.log("  ✅ Proper OAppOptionsType3.newOptions()");
    console.log("  ✅ V2 endpoint validation");
    
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