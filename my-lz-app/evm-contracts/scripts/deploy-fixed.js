const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying FIXED EscrowOApp...");
    
    const LZ_ENDPOINT_SEPOLIA = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    const EscrowOAppFixed = await ethers.getContractFactory("EscrowOAppFixed");
    
    const contract = await EscrowOAppFixed.deploy(
        LZ_ENDPOINT_SEPOLIA,
        deployer.address // delegate = owner
    );
    
    await contract.deployed();
    
    console.log("✅ EscrowOAppFixed deployed to:", contract.address);
    console.log("🌐 Explorer:", `https://sepolia.etherscan.io/address/${contract.address}`);
    
    console.log("\n📋 FIXED LAYERZERO OAPP DEPLOYED!");
    console.log("Contract:", contract.address);
    console.log("Key fix: Proper quote function parameter order");
    
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