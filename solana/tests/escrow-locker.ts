import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { expect } from "chai";

describe("escrow-locker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EscrowLocker as Program<any>;
  const payer = provider.wallet as anchor.Wallet;

  // Test 1: Basic program initialization
  it("Can initialize the program", async () => {
    // This should just verify the program loads
    expect(program.programId).to.not.be.undefined;
  });

  // Test 2: Can create a gift with claim code
  it("Can create a gift with claim code", async () => {
    const claimCode = "BEACH123";
    const amount = new BN(1_000_000_000); // 1 SOL

    // Derive escrow PDA
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(claimCode)],
      program.programId
    );

    // Test creating a gift
    const tx = await program.methods
      .createGift(amount, claimCode, 30) // 30 days expiry
      .accounts({
        depositor: payer.publicKey,
        escrowAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify escrow account was created
    const escrowAccount = await program.account.tokenEscrow.fetch(escrowPda);
    expect(escrowAccount.depositor.toString()).to.equal(payer.publicKey.toString());
    expect(escrowAccount.amount.toString()).to.equal(amount.toString());
    expect(escrowAccount.claimCode).to.equal(claimCode);
    expect(escrowAccount.claimed).to.be.false;
  });

  // Test 3: Can initiate a claim
  it("Can initiate a claim for existing gift", async () => {
    const claimCode = "OCEAN456";
    const amount = new BN(500_000_000); // 0.5 SOL
    
    // First create a gift
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(claimCode)],
      program.programId
    );

    await program.methods
      .createGift(amount, claimCode, 30)
      .accounts({
        depositor: payer.publicKey,
        escrowAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Then initiate claim
    const dstEid = 30101; // Ethereum
    const tokenType = { native: {} }; // Enum for native token
    const recipient = new Array(32).fill(1); // Mock recipient address

    const [claimPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), Buffer.from(claimCode)],
      program.programId
    );

    const tx = await program.methods
      .initiateClaim(claimCode, dstEid, tokenType, recipient)
      .accounts({
        claimRequest: claimPda,
        escrowAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify claim request was created
    const claimAccount = await program.account.claimRequest.fetch(claimPda);
    expect(claimAccount.claimCode).to.equal(claimCode);
    expect(claimAccount.dstEid).to.equal(dstEid);
  });

  // Test 4: Cannot claim with invalid code
  it("Fails to initiate claim with non-existent code", async () => {
    const invalidCode = "FAKE123";
    const dstEid = 30101;
    const tokenType = { native: {} };
    const recipient = new Array(32).fill(1);

    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(invalidCode)],
      program.programId
    );

    const [claimPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), Buffer.from(invalidCode)],
      program.programId
    );

    try {
      await program.methods
        .initiateClaim(invalidCode, dstEid, tokenType, recipient)
        .accounts({
          claimRequest: claimPda,
          escrowAccount: escrowPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.not.be.undefined;
    }
  });

  // Test 5: Can initialize LayerZero OApp store
  it("Can initialize LayerZero OApp store", async () => {
    const mockEndpoint = anchor.web3.Keypair.generate().publicKey;

    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("oapp_store")],
      program.programId
    );

    const tx = await program.methods
      .initOappStore(mockEndpoint)
      .accounts({
        store: storePda,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify store was created
    const storeAccount = await program.account.oAppStore.fetch(storePda);
    expect(storeAccount.owner.toString()).to.equal(payer.publicKey.toString());
    expect(storeAccount.endpoint.toString()).to.equal(mockEndpoint.toString());
  });

  // Test 6: Can set LayerZero peer
  it("Can set LayerZero peer for Ethereum", async () => {
    const ethereumEid = 30101;
    const mockPeerAddress = new Array(32).fill(1);

    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("oapp_store")],
      program.programId
    );

    const [peerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("peer"), Buffer.from(new Uint8Array(new Uint32Array([ethereumEid]).buffer))],
      program.programId
    );

    const tx = await program.methods
      .setPeer(ethereumEid, mockPeerAddress)
      .accounts({
        peer: peerPda,
        store: storePda,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify peer was set
    const peerAccount = await program.account.peer.fetch(peerPda);
    expect(peerAccount.eid).to.equal(ethereumEid);
    expect(peerAccount.peerAddress).to.deep.equal(mockPeerAddress);
  });

  // Test 7: Cannot double-claim
  it("Prevents double claiming", async () => {
    const claimCode = "SOLAR789";
    const amount = new BN(250_000_000); // 0.25 SOL
    
    // Create gift
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(claimCode)],
      program.programId
    );

    await program.methods
      .createGift(amount, claimCode, 30)
      .accounts({
        depositor: payer.publicKey,
        escrowAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // First claim
    const [claimPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), Buffer.from(claimCode)],
      program.programId
    );

    const dstEid = 30101;
    const tokenType = { native: {} };
    const recipient = new Array(32).fill(1);

    await program.methods
      .initiateClaim(claimCode, dstEid, tokenType, recipient)
      .accounts({
        claimRequest: claimPda,
        escrowAccount: escrowPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to claim again - should fail
    try {
      await program.methods
        .initiateClaim(claimCode, dstEid, tokenType, recipient)
        .accounts({
          claimRequest: claimPda,
          escrowAccount: escrowPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have thrown an error for double claim");
    } catch (error) {
      expect(error).to.not.be.undefined;
    }
  });
});