use crate::*;
use anchor_lang::solana_program::{system_instruction, program::invoke};

#[derive(Accounts)]
#[instruction(params: CreateEscrowParams)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        init,
        payer = depositor,
        space = 8 + TokenEscrow::INIT_SPACE,
        seeds = [b"escrow", params.claim_code.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, TokenEscrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateEscrowParams {
    pub amount: u64,
    pub claim_code: String,
    pub expiry_days: u32,
}

impl CreateEscrow<'_> {
    pub fn apply(ctx: &mut Context<CreateEscrow>, params: &CreateEscrowParams) -> Result<()> {
        let current_timestamp = Clock::get()?.unix_timestamp;
        let expires_at = current_timestamp + (params.expiry_days as i64 * 24 * 3600);
        
        // Store values we need before transferring
        let depositor_key = ctx.accounts.depositor.key();
        let escrow_key = ctx.accounts.escrow_account.key();
        
        // Transfer SOL from depositor to escrow account
        let transfer_ix = system_instruction::transfer(
            &depositor_key,
            &escrow_key,
            params.amount,
        );

        invoke(
            &transfer_ix,
            &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ],
        )?;

        // Now set up the escrow account data
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.depositor = depositor_key;
        escrow.amount = params.amount;
        escrow.claim_code = params.claim_code.clone();
        escrow.claimed = false;
        escrow.created_at = current_timestamp;
        escrow.expires_at = expires_at;
        escrow.bump = ctx.bumps.escrow_account;

        emit!(EscrowCreated {
            claim_code: params.claim_code.clone(),
            amount: params.amount,
            depositor: depositor_key,
            expires_at,
        });

        Ok(())
    }
}