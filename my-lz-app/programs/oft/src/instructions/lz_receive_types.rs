use crate::*;
use anchor_spl::token_interface::Mint;
use oapp::endpoint_cpi::LzAccount;

#[derive(Accounts)]
pub struct LzReceiveTypes<'info> {
    #[account(
        seeds = [OFT_SEED, oft_store.token_escrow.as_ref()],
        bump = oft_store.bump
    )]
    pub oft_store: Account<'info, OFTStore>,
    #[account(address = oft_store.token_mint)]
    pub token_mint: InterfaceAccount<'info, Mint>,
}

// account structure
// account 0 - payer (executor)
// account 1 - peer
// account 2 - oft store
// account 3 - token escrow
// account 4 - to address / wallet address
// account 5 - token dest
// account 6 - token mint
// account 7 - mint authority (optional)
// account 8 - token program
// account 9 - associated token program
// account 10 - system program
// account 11 - event authority
// account 12 - this program
// account remaining accounts
//      0..9 - accounts for clear
//      9..16 - accounts for compose
impl LzReceiveTypes<'_> {
    pub fn apply(
        ctx: &Context<LzReceiveTypes>,
        params: &LzReceiveParams,
    ) -> Result<Vec<LzAccount>> {
        // 1. OFT Store (writable state)
        let store = ctx.accounts.oft_store.key();

        // 2. Peer that sent the message (read-only)
        let (peer, _) = Pubkey::find_program_address(
            &[PEER_SEED, &store.to_bytes(), &params.src_eid.to_be_bytes()],
            ctx.program_id,
        );

        let mut accs = vec![
            LzAccount { pubkey: store, is_signer: false, is_writable: true },
            LzAccount { pubkey: peer, is_signer: false, is_writable: false },
        ];

        // 3. Accounts for Endpoint::clear()
        accs.extend(oapp::endpoint_cpi::get_accounts_for_clear(
            ctx.accounts.oft_store.endpoint_program,
            &store,
            params.src_eid,
            &params.sender,
            params.nonce,
        ));

        // 4. If compose message, add send_compose accounts  
        if let Some(_compose_msg) = msg_codec::compose_msg(&params.message) {
            accs.extend(oapp::endpoint_cpi::get_accounts_for_send_compose(
                ctx.accounts.oft_store.endpoint_program,
                &store,     // payer = this PDA
                &store,     // receiver (self-compose)
                &params.guid,
                0,          // fee = 0, Executor pre-funds
                &params.message,
            ));
        }

        Ok(accs)
    }
}
