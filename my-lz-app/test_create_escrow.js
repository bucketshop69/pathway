const anchor = require('@coral-xyz/anchor');
const { SystemProgram } = require('@solana/web3.js');

describe('Create Real Escrow', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.Oft;
  
  it('Creates real escrow transaction', async () => {
    const claimCode = "DEMO1751643275";
    
    const [escrowPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(claimCode)],
      program.programId
    );
    
    console.log("📍 Escrow PDA:", escrowPDA.toString());
    console.log("👤 User:", provider.wallet.publicKey.toString());
    
    const tx = await program.methods
      .createEscrow({
        amount: new anchor.BN(1_000_000_000), // 1 SOL
        claimCode: claimCode,
        expiryDays: 7
      })
      .accounts({
        depositor: provider.wallet.publicKey,
        escrowAccount: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    console.log("✅ Transaction Hash:", tx);
    console.log("🌐 Explorer: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    
    // Fetch created account
    const escrow = await program.account.tokenEscrow.fetch(escrowPDA);
    console.log("📊 Escrow Data:", {
      depositor: escrow.depositor.toString(),
      amount: escrow.amount.toString(),
      claimCode: escrow.claimCode,
      claimed: escrow.claimed
    });
  });
});
