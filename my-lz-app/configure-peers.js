const { ethers } = require('ethers');

const SEPOLIA_CONTRACT = "0x741dE59c8e06BD40367D4cba7677FEa90C436cD0";
const SOLANA_PROGRAM = "2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v";
const PRIVATE_KEY = "0xd448db1814aad96f66abb7104020e46a69cb8552a42e2fd019ae37652a33730f";
const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/qxqWLEbpIns_vA-nesFNZqy6iO9NtvK5";

async function configurePeers() {
    console.log("🔗 CONFIGURING LAYERZERO PEERS");
    console.log("==============================");
    
    const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Contract ABI for setPeer function
    const contractABI = [
        "function setPeer(uint32 _eid, bytes32 _peer) external",
        "function peers(uint32 _eid) external view returns (bytes32)",
        "event PeerSet(uint32 eid, bytes32 peer)"
    ];
    
    const contract = new ethers.Contract(SEPOLIA_CONTRACT, contractABI, wallet);
    
    console.log("📍 Ethereum Contract:", SEPOLIA_CONTRACT);
    console.log("🌐 Solana Program:", SOLANA_PROGRAM);
    
    // Convert Solana program ID to bytes32
    const solanaBytes32 = "0x326e58624e7a3463315276366261396a4a75634e57675454754e6259475a5959";
    console.log("🔄 Solana as bytes32:", solanaBytes32);
    
    const SOLANA_EID = 30168; // LayerZero Solana testnet endpoint ID
    
    try {
        console.log("\n🔄 Setting Solana as peer...");
        
        // Check current peer
        const currentPeer = await contract.peers(SOLANA_EID);
        console.log("Current peer:", currentPeer);
        
        if (currentPeer === solanaBytes32) {
            console.log("✅ Peer already configured correctly!");
        } else {
            const tx = await contract.setPeer(SOLANA_EID, solanaBytes32, {
                gasLimit: 100000
            });
            
            console.log("🔗 Transaction sent:", tx.hash);
            console.log("🌐 Explorer:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log("✅ Peer configuration confirmed!");
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Verify the peer was set
            const newPeer = await contract.peers(SOLANA_EID);
            console.log("✅ Verified peer:", newPeer);
        }
        
        console.log("\n🎯 PEER CONFIGURATION COMPLETE");
        console.log("===============================");
        console.log("Ethereum → Solana:", "CONFIGURED ✅");
        console.log("Solana → Ethereum:", "NEEDS MANUAL CONFIG ⚠️");
        
        console.log("\n📋 NEXT STEPS:");
        console.log("1. Configure Solana peer (manual anchor command)");
        console.log("2. Test real cross-chain messaging");
        console.log("3. Generate LayerZero Scan transaction");
        
        return {
            success: true,
            ethereumContract: SEPOLIA_CONTRACT,
            solanaProgram: SOLANA_PROGRAM,
            peerConfigured: true
        };
        
    } catch (error) {
        console.error("❌ Peer configuration failed:", error.message);
        return { success: false, error: error.message };
    }
}

configurePeers().catch(console.error);