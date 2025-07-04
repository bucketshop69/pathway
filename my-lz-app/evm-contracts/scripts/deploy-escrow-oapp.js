const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying REAL LayerZero EscrowOApp...");
    
    const LZ_ENDPOINT_SEPOLIA = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    const EscrowOApp = await ethers.getContractFactory("EscrowOApp");
    
    const contract = await EscrowOApp.deploy(
        LZ_ENDPOINT_SEPOLIA,
        deployer.address
    );
    
    await contract.deployed();
    
    console.log("✅ EscrowOApp deployed to:", contract.address);
    console.log("🌐 Explorer:", `https://sepolia.etherscan.io/address/${contract.address}`);
    
    console.log("\n📋 REAL LAYERZERO OAPP DEPLOYED!");
    console.log("Contract:", contract.address);
    console.log("Based on official LayerZero template");
    
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