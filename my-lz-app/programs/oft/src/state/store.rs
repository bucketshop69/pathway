use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Store {
    pub admin: Pubkey,
    pub endpoint_program: Pubkey,
    pub bump: u8,
    #[max_len(100)]
    pub string: String,
}

#[account]
#[derive(InitSpace)]
pub struct LzComposeTypesAccounts {
    pub store_key: Pubkey,
}