use crate::*;

#[derive(Accounts)]
#[instruction(claim_code: String)]
pub struct InitiateClaim<'info> {
    #[account(
        init,
        payer = claimer,
        space = 8 + ClaimRequest::INIT_SPACE,
        seeds = [b"claim", claim_code.as_bytes()],
        bump
    )]
    pub claim_request: Account<'info, ClaimRequest>,

    #[account(
        seeds = [b"escrow", claim_code.as_bytes()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, TokenEscrow>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitiateClaimParams {
    pub claim_code: String,
    pub dst_eid: u32,
    pub token_type: TokenType,
    pub recipient: [u8; 32],
}

impl InitiateClaim<'_> {
    pub fn apply(ctx: &mut Context<InitiateClaim>, params: &InitiateClaimParams) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;
        
        // Validate escrow
        require!(!escrow.claimed, EscrowError::AlreadyClaimed);
        require!(escrow.claim_code == params.claim_code, EscrowError::InvalidClaimCode);
        require!(
            Clock::get()?.unix_timestamp <= escrow.expires_at,
            EscrowError::EscrowExpired
        );

        let claim_request = &mut ctx.accounts.claim_request;
        claim_request.escrow_key = ctx.accounts.escrow_account.key();
        claim_request.claim_code = params.claim_code.clone();
        claim_request.dst_eid = params.dst_eid;
        claim_request.token_type = params.token_type.clone();
        claim_request.recipient = params.recipient;
        claim_request.status = ClaimStatus::Pending;
        claim_request.created_at = Clock::get()?.unix_timestamp;
        claim_request.bump = ctx.bumps.claim_request;

        // Create cross-chain message
        let message = ClaimNotificationMessage {
            claim_code: params.claim_code.clone(),
            amount: escrow.amount,
            token_type: params.token_type.clone(),
            recipient: params.recipient,
            expiry: escrow.expires_at,
        };

        // TODO: Integrate with actual LayerZero OFT send
        emit!(ClaimInitiated {
            claim_code: params.claim_code.clone(),
            dst_eid: params.dst_eid,
            amount: escrow.amount,
            recipient: params.recipient,
        });

        Ok(())
    }
}