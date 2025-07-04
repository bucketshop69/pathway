use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_instruction, program::invoke};

declare_id!("4wxzrFQo82j4Vko2HABtmCochFh6uLwJXgmfTTXEwrWw");

#[program]
pub mod escrow_locker {
    use super::*;

    pub fn create_gift(
        ctx: Context<CreateGift>,
        amount: u64,
        claim_code: String,
        expiry_days: u32,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.depositor = ctx.accounts.depositor.key();
        escrow.amount = amount;
        escrow.claim_code = claim_code;
        escrow.claimed = false;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.expires_at = Clock::get()?.unix_timestamp + (expiry_days as i64 * 24 * 3600);
        escrow.bump = ctx.bumps.escrow_account;

        // Transfer SOL from depositor to escrow account
        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.escrow_account.key(),
            amount,
        );

        invoke(
            &transfer_ix,
            &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn initiate_claim(
        ctx: Context<InitiateClaim>,
        claim_code: String,
        dst_eid: u32,
        token_type: TokenType,
        recipient: [u8; 32],
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;
        require!(!escrow.claimed, ErrorCode::AlreadyClaimed);
        require!(escrow.claim_code == claim_code, ErrorCode::InvalidClaimCode);

        let claim_request = &mut ctx.accounts.claim_request;
        claim_request.escrow_key = ctx.accounts.escrow_account.key();
        claim_request.claim_code = claim_code.clone();
        claim_request.dst_eid = dst_eid;
        claim_request.token_type = token_type.clone();
        claim_request.recipient = recipient;
        claim_request.status = ClaimStatus::Pending;
        claim_request.created_at = Clock::get()?.unix_timestamp;
        claim_request.bump = ctx.bumps.claim_request;

        // Send LayerZero message to destination chain
        let message = ClaimNotificationMessage {
            claim_code,
            amount: escrow.amount,
            token_type,
            recipient,
            expiry: escrow.expires_at,
        };

        // TODO: Integrate with actual LayerZero OFT send
        // For now, just emit an event
        emit!(ClaimInitiated {
            claim_code: message.claim_code,
            dst_eid,
            amount: message.amount,
            recipient
        });

        Ok(())
    }

    pub fn init_oapp_store(
        ctx: Context<InitOAppStore>,
        endpoint: Pubkey,
    ) -> Result<()> {
        let store = &mut ctx.accounts.store;
        store.owner = ctx.accounts.owner.key();
        store.endpoint = endpoint;
        store.bump = ctx.bumps.store;

        Ok(())
    }

    pub fn set_peer(
        ctx: Context<SetPeer>,
        eid: u32,
        peer_address: [u8; 32],
    ) -> Result<()> {
        let peer = &mut ctx.accounts.peer;
        peer.eid = eid;
        peer.peer_address = peer_address;
        peer.bump = ctx.bumps.peer;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, claim_code: String)]
pub struct CreateGift<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        init,
        payer = depositor,
        space = 8 + TokenEscrow::INIT_SPACE,
        seeds = [b"escrow", claim_code.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, TokenEscrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(claim_code: String)]
pub struct InitiateClaim<'info> {
    #[account(
        init,
        payer = depositor,
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
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitOAppStore<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + OAppStore::INIT_SPACE,
        seeds = [b"oapp_store"],
        bump
    )]
    pub store: Account<'info, OAppStore>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(eid: u32)]
pub struct SetPeer<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Peer::INIT_SPACE,
        seeds = [b"peer", &eid.to_le_bytes()],
        bump
    )]
    pub peer: Account<'info, Peer>,

    #[account(
        seeds = [b"oapp_store"],
        bump = store.bump,
        has_one = owner
    )]
    pub store: Account<'info, OAppStore>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct TokenEscrow {
    pub depositor: Pubkey,
    pub amount: u64,
    #[max_len(10)]
    pub claim_code: String,
    pub claimed: bool,
    pub created_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ClaimRequest {
    pub escrow_key: Pubkey,
    #[max_len(10)]
    pub claim_code: String,
    pub dst_eid: u32,
    pub token_type: TokenType,
    pub recipient: [u8; 32],
    pub status: ClaimStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum TokenType {
    Native,
    USDC,
    USDT,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum ClaimStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[account]
#[derive(InitSpace)]
pub struct OAppStore {
    pub owner: Pubkey,
    pub endpoint: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Peer {
    pub eid: u32,
    pub peer_address: [u8; 32],
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClaimNotificationMessage {
    pub claim_code: String, // Remove max_len for now
    pub amount: u64,
    pub token_type: TokenType,
    pub recipient: [u8; 32],
    pub expiry: i64,
}

#[event]
pub struct ClaimInitiated {
    pub claim_code: String,
    pub dst_eid: u32,
    pub amount: u64,
    pub recipient: [u8; 32],
}

#[error_code]
pub enum ErrorCode {
    #[msg("Claim code already used")]
    AlreadyClaimed,
    #[msg("Invalid claim code")]
    InvalidClaimCode,
}
