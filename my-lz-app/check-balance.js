const { ethers } = require('ethers');

const ADDRESS = "0x94e1B982b7fF8c0Bd4E7B87ee55d3c2D49A59694";
const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/qxqWLEbpIns_vA-nesFNZqy6iO9NtvK5";

async function checkBalance() {
    const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);
    const balance = await provider.getBalance(ADDRESS);
    
    console.log("💰 Current Balance:", ethers.formatEther(balance), "ETH");
    console.log("📍 Address:", ADDRESS);
    
    if (balance >= ethers.parseEther("0.01")) {
        console.log("✅ Sufficient funds for deployment!");
        return true;
    } else {
        console.log("❌ Need more ETH for deployment");
        return false;
    }
}

checkBalance().catch(console.error);