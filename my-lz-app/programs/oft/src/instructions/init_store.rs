use crate::*;

#[derive(Accounts)]
pub struct InitStore<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Store::INIT_SPACE,
        seeds = [b"Store"],
        bump
    )]
    pub store: Account<'info, Store>,

    #[account(
        init,
        payer = admin,
        space = 8 + LzReceiveTypesAccounts::INIT_SPACE,
        seeds = [oapp::LZ_RECEIVE_TYPES_SEED, store.key().as_ref()],
        bump
    )]
    pub lz_receive_types_accounts: Account<'info, LzReceiveTypesAccounts>,

    #[account(
        init,
        payer = admin,
        space = 8 + LzComposeTypesAccounts::INIT_SPACE,
        seeds = [b"LzComposeTypes", store.key().as_ref()],
        bump
    )]
    pub lz_compose_types_accounts: Account<'info, LzComposeTypesAccounts>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitStoreParams {
    pub admin: Pubkey,
    pub endpoint: Pubkey,
}

impl InitStore<'_> {
    pub fn apply(ctx: &mut Context<InitStore>, params: &InitStoreParams) -> Result<()> {
        ctx.accounts.store.admin = params.admin;
        ctx.accounts.store.bump = ctx.bumps.store;
        ctx.accounts.store.endpoint_program = params.endpoint;
        ctx.accounts.store.string = "Nothing received yet.".to_string();

        // Set up the "types" PDAs so the SDK can find them
        ctx.accounts.lz_receive_types_accounts.oft_store = ctx.accounts.store.key();
        ctx.accounts.lz_receive_types_accounts.token_mint = ctx.accounts.store.key(); // placeholder for now
        ctx.accounts.lz_compose_types_accounts.store_key = ctx.accounts.store.key();

        // Register with the Endpoint
        let seeds: &[&[u8]] = &[b"Store", &[ctx.accounts.store.bump]];

        // Note: register_oapp call would go here in production
        // For now, we'll skip registration until we have proper endpoint setup

        Ok(())
    }
}