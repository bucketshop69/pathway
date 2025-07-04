use crate::*;

#[derive(Accounts)]
#[instruction(params: VerifyEscrowParams)]
pub struct VerifyEscrow<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The escrow account to verify
    #[account(
        seeds = [b"escrow", params.claim_code.as_bytes()],
        bump = escrow_account.bump,
    )]
    pub escrow_account: Account<'info, TokenEscrow>,

    /// OFT store for LayerZero configuration
    #[account(
        seeds = [OFT_SEED],
        bump = oft_store.bump,
    )]
    pub oft_store: Account<'info, OFTStore>,

    /// Peer configuration for Ethereum
    #[account(
        seeds = [PEER_SEED, &params.dst_eid.to_be_bytes()],
        bump = peer.bump
    )]
    pub peer: Account<'info, PeerConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct VerifyEscrowParams {
    pub claim_code: String,
    pub requesting_claimer: [u8; 32], // Ethereum address that wants to claim
    pub dst_eid: u32, // Ethereum chain ID
    pub options: Vec<u8>,
}

impl VerifyEscrow<'_> {
    pub fn apply(ctx: &mut Context<VerifyEscrow>, params: &VerifyEscrowParams) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;
        
        // Verify escrow exists and is valid
        require!(!escrow.claimed, EscrowError::AlreadyClaimed);
        require!(
            Clock::get()?.unix_timestamp < escrow.expires_at,
            EscrowError::EscrowExpired
        );

        // Create verification response message
        let verification_response = EscrowVerificationResponse {
            claim_code: params.claim_code.clone(),
            amount: escrow.amount,
            claimer: params.requesting_claimer,
            expires_at: escrow.expires_at,
            verified: true,
        };

        let message = verification_response.encode();

        // Send LayerZero response back to Ethereum
        let msg_receipt = oapp::endpoint_cpi::send(
            ctx.accounts.oft_store.endpoint_program,
            ctx.accounts.oft_store.key(),
            ctx.remaining_accounts,
            &[OFT_SEED, &[ctx.accounts.oft_store.bump]],
            oapp::endpoint::instructions::SendParams {
                dst_eid: params.dst_eid,
                receiver: params.requesting_claimer, // Ethereum contract
                message,
                options: ctx.accounts.peer.enforced_options.combine_options(&None, &params.options)?,
                native_fee: 0,
                lz_token_fee: 0,
            },
        )?;

        emit!(EscrowVerificationSent {
            claim_code: params.claim_code.clone(),
            amount: escrow.amount,
            claimer: params.requesting_claimer,
            dst_eid: params.dst_eid,
            verified: true,
        });

        msg!("Escrow verification sent to Ethereum. GUID: {:?}", msg_receipt.guid);

        Ok(())
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct EscrowVerificationResponse {
    pub claim_code: String,
    pub amount: u64,
    pub claimer: [u8; 32],
    pub expires_at: i64,
    pub verified: bool,
}

impl EscrowVerificationResponse {
    pub fn encode(&self) -> Vec<u8> {
        // Encode verification response for Ethereum
        let mut encoded = Vec::new();
        
        // Message type (1 = verification response)
        encoded.push(1u8);
        
        // Encode claim code
        let code_bytes = self.claim_code.as_bytes();
        encoded.extend_from_slice(&(code_bytes.len() as u32).to_le_bytes());
        encoded.extend_from_slice(code_bytes);
        
        // Encode amount
        encoded.extend_from_slice(&self.amount.to_le_bytes());
        
        // Encode claimer address
        encoded.extend_from_slice(&self.claimer);
        
        // Encode verified flag
        encoded.push(if self.verified { 1u8 } else { 0u8 });
        
        encoded
    }
}