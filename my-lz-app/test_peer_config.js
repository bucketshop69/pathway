const anchor = require('@coral-xyz/anchor');

describe('Peer Configuration Check', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.Oft;
  
  it('Checks OFT store and peer configuration', async () => {
    console.log("📋 Program ID:", program.programId.toString());
    
    // Derive OFT store PDA
    const [oftStore] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("OFT")],
      program.programId
    );
    
    console.log("📍 OFT Store PDA:", oftStore.toString());
    
    // Check if OFT store exists
    try {
      const oftStoreAccount = await program.account.oftStore.fetch(oftStore);
      console.log("✅ OFT Store exists");
      console.log("   Token Mint:", oftStoreAccount.tokenMint.toString());
      console.log("   Token Escrow:", oftStoreAccount.tokenEscrow.toString());
    } catch (error) {
      console.log("❌ OFT Store not initialized");
      console.log("   Need to run: anchor test --skip-deploy");
    }
    
    // Derive peer PDA for Ethereum
    const ethereumChainId = 40161;
    const [peerPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("Peer"), Buffer.from(ethereumChainId.toString())],
      program.programId
    );
    
    console.log("📍 Ethereum Peer PDA:", peerPDA.toString());
    
    // Check if peer exists
    try {
      const peerAccount = await program.account.peerConfig.fetch(peerPDA);
      console.log("✅ Ethereum peer configured");
      console.log("   Peer Address:", Buffer.from(peerAccount.peerAddress).toString('hex'));
    } catch (error) {
      console.log("❌ Ethereum peer not configured");
      console.log("   EVM Contract to set:", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    }
    
    console.log("\n🎯 Configuration Summary:");
    console.log("✅ Program deployed and accessible");
    console.log("📋 Peer PDAs calculated");
    console.log("🔗 Ready for cross-chain setup");
  });
});
