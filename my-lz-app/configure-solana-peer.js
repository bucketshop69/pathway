const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

async function configureSolanaPeer() {
    console.log("🔗 CONFIGURING SOLANA PEER TO POINT TO ETHEREUM");
    console.log("=================================================");
    
    // Connection and program setup
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    // Load the deployed program
    const programId = new PublicKey("2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v");
    const idl = await anchor.Program.fetchIdl(programId, provider);
    const program = new anchor.Program(idl, programId, provider);
    
    // Configuration
    const ETHEREUM_EID = 10161; // Sepolia
    const ETHEREUM_CONTRACT = "0x29171bd2bB474f46158707ccCDe4da1b9144ffa7";
    
    try {
        // Convert Ethereum address to bytes32 format for Solana
        const ethAddressBytes = Buffer.from(ETHEREUM_CONTRACT.slice(2), 'hex');
        const ethBytes32 = Buffer.concat([
            Buffer.alloc(12), // Pad with 12 zeros
            ethAddressBytes   // 20 bytes of address
        ]);
        
        console.log("📋 CONFIGURATION:");
        console.log("  Ethereum EID:", ETHEREUM_EID);
        console.log("  Ethereum Contract:", ETHEREUM_CONTRACT);
        console.log("  Ethereum Address as bytes32:", '0x' + ethBytes32.toString('hex'));
        console.log("  Solana Program:", programId.toString());
        
        // Find the peer account PDA
        const [peerAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("Peer"),
                Buffer.from([...new Array(4)].map((_, i) => (ETHEREUM_EID >> (8 * (3 - i))) & 0xff))
            ],
            programId
        );
        
        console.log("  Peer Account PDA:", peerAccount.toString());
        
        // Find OFT config account
        const [oftConfigAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("OFT")],
            programId
        );
        
        console.log("  OFT Config Account:", oftConfigAccount.toString());
        
        // Set peer configuration
        console.log("\n🚀 SETTING PEER CONFIGURATION...");
        
        const setPeerTx = await program.methods
            .setPeerConfig({
                dstEid: ETHEREUM_EID,
                peer: Array.from(ethBytes32)
            })
            .accounts({
                admin: provider.wallet.publicKey,
                oftConfig: oftConfigAccount,
                peer: peerAccount,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
            
        console.log("✅ Peer configuration transaction:", setPeerTx);
        console.log("✅ Solana now configured to communicate with Ethereum!");
        
        // Verify the configuration
        console.log("\n🔍 VERIFYING CONFIGURATION...");
        const peerInfo = await program.account.peer.fetch(peerAccount);
        console.log("  Configured EID:", peerInfo.eid);
        console.log("  Configured Peer:", '0x' + Buffer.from(peerInfo.peer).toString('hex'));
        console.log("  Active:", peerInfo.active);
        
        console.log("\n🎯 BIDIRECTIONAL PEER SETUP COMPLETE!");
        console.log("✅ Ethereum → Solana: Configured");
        console.log("✅ Solana → Ethereum: Configured");
        console.log("✅ Ready for cross-chain messaging!");
        
        return {
            success: true,
            solanaPeerTx: setPeerTx,
            peerAccount: peerAccount.toString(),
            ethereumEid: ETHEREUM_EID,
            ethereumContract: ETHEREUM_CONTRACT
        };
        
    } catch (error) {
        console.error("❌ Failed to configure Solana peer:", error);
        return { success: false, error: error.message };
    }
}

// Run the configuration
configureSolanaPeer()
    .then((result) => {
        if (result.success) {
            console.log("\n🏆 SOLANA PEER CONFIGURATION: SUCCESS!");
            console.log("🎯 Cross-chain communication fully enabled!");
        } else {
            console.log("\n💥 Configuration failed:", result.error);
        }
    })
    .catch(console.error);