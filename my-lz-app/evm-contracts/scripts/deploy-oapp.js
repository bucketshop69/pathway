const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying EscrowClaimerOApp to Sepolia...");
    
    // LayerZero V2 Sepolia endpoint
    const LZ_ENDPOINT_SEPOLIA = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy contract
    const EscrowClaimerOApp = await ethers.getContractFactory("EscrowClaimerOApp");
    
    console.log("📡 LayerZero Endpoint:", LZ_ENDPOINT_SEPOLIA);
    console.log("👑 Owner:", deployer.address);
    
    const escrowClaimer = await EscrowClaimerOApp.deploy(
        LZ_ENDPOINT_SEPOLIA,
        deployer.address
    );
    
    await escrowClaimer.deployed();
    
    console.log("✅ EscrowClaimerOApp deployed to:", escrowClaimer.address);
    console.log("🌐 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${escrowClaimer.address}`);
    
    // Fund contract with available ETH (leave 0.01 ETH for gas)
    const availableBalance = balance.sub(ethers.utils.parseEther("0.01"));
    console.log(`\n💵 Funding contract with ${ethers.utils.formatEther(availableBalance)} ETH...`);
    const fundTx = await deployer.sendTransaction({
        to: escrowClaimer.address,
        value: availableBalance
    });
    await fundTx.wait();
    
    console.log(`✅ Contract funded with ${ethers.utils.formatEther(availableBalance)} ETH`);
    console.log("🔗 Funding TX:", `https://sepolia.etherscan.io/tx/${fundTx.hash}`);
    
    // Verify deployment
    const contractBalance = await ethers.provider.getBalance(escrowClaimer.address);
    console.log("💰 Contract balance:", ethers.utils.formatEther(contractBalance), "ETH");
    
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log("Contract Address:", escrowClaimer.address);
    console.log("LayerZero Endpoint:", LZ_ENDPOINT_SEPOLIA);
    console.log("Owner:", deployer.address);
    console.log("Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
    console.log("Sepolia Explorer:", `https://sepolia.etherscan.io/address/${escrowClaimer.address}`);
    
    console.log("\n🔗 NEXT STEPS:");
    console.log("1. Configure peer with Solana program:", "2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v");
    console.log("2. Test cross-chain messaging");
    console.log("3. Generate LayerZero Scan transaction");
    
    return {
        contractAddress: escrowClaimer.address,
        endpoint: LZ_ENDPOINT_SEPOLIA,
        owner: deployer.address,
        balance: ethers.utils.formatEther(contractBalance)
    };
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