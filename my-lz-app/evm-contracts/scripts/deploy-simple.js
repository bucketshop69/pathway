const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SimpleEscrowOApp to Sepolia...");
    
    const LZ_ENDPOINT_SEPOLIA = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    const SimpleEscrowOApp = await ethers.getContractFactory("SimpleEscrowOApp");
    
    const contract = await SimpleEscrowOApp.deploy(
        LZ_ENDPOINT_SEPOLIA,
        deployer.address
    );
    
    await contract.deployed();
    
    console.log("✅ SimpleEscrowOApp deployed to:", contract.address);
    console.log("🌐 Explorer:", `https://sepolia.etherscan.io/address/${contract.address}`);
    
    // Fund with available balance
    const fundAmount = balance.sub(ethers.utils.parseEther("0.005"));
    if (fundAmount.gt(0)) {
        const fundTx = await deployer.sendTransaction({
            to: contract.address,
            value: fundAmount
        });
        await fundTx.wait();
        console.log("✅ Contract funded with", ethers.utils.formatEther(fundAmount), "ETH");
    }
    
    console.log("\n📋 DEPLOYMENT COMPLETE");
    console.log("Contract:", contract.address);
    console.log("LayerZero Endpoint:", LZ_ENDPOINT_SEPOLIA);
    
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