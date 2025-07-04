use crate::*;

#[derive(Accounts)]
#[instruction(params: HandleEthereumMessageParams)]
pub struct HandleEthereumMessage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// OFT store for LayerZero configuration
    #[account(
        seeds = [OFT_SEED],
        bump = oft_store.bump,
    )]
    pub oft_store: Account<'info, OFTStore>,

    /// Peer configuration for Ethereum
    #[account(
        seeds = [PEER_SEED, &params.src_eid.to_be_bytes()],
        bump = peer.bump
    )]
    pub peer: Account<'info, PeerConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct HandleEthereumMessageParams {
    pub src_eid: u32,
    pub message: Vec<u8>,
    pub executor: Pubkey,
    pub extra_data: Vec<u8>,
}

// Message structure matching Ethereum format
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct IncomingMessage {
    pub msg_type: u8,
    pub request_id: [u8; 32],
    pub sender: [u8; 20],  // Ethereum address
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct VerificationResponse {
    pub msg_type: u8,
    pub request_id: [u8; 32],
    pub verified: u8,  // 0x01 for true, 0x00 for false
}

impl HandleEthereumMessage<'_> {
    pub fn apply(ctx: &mut Context<HandleEthereumMessage>, params: &HandleEthereumMessageParams) -> Result<()> {
        // Verify source is Ethereum Sepolia
        require!(params.src_eid == 10161, EscrowError::InvalidSourceChain);
        
        // Parse incoming message with proper format
        let message = &params.message;
        if message.len() < 85 {  // 1 + 32 + 20 + 32 = 85 bytes minimum
            return Err(EscrowError::InvalidMessage.into());
        }

        let incoming_msg = IncomingMessage {
            msg_type: message[0],
            request_id: {
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&message[1..33]);
                arr
            },
            sender: {
                let mut arr = [0u8; 20];
                arr.copy_from_slice(&message[33..53]);
                arr
            },
            amount: {
                // Convert from bytes to u64 (Ethereum sends uint256, we take lower 64 bits)
                let mut arr = [0u8; 8];
                arr.copy_from_slice(&message[77..85]);  // Take last 8 bytes of uint256
                u64::from_le_bytes(arr)
            },
        };

        msg!("Received verification request: {:?}", hex::encode(incoming_msg.request_id));
        msg!("From Ethereum address: {:?}", hex::encode(incoming_msg.sender));
        msg!("Amount: {}", incoming_msg.amount);

        // Process verification based on message type
        if incoming_msg.msg_type == 0 {  // VERIFICATION_REQUEST
            // Check if escrow exists (simplified - you'd implement real verification)
            let verified = true;  // Your escrow verification logic here

            // Create response message
            let response = VerificationResponse {
                msg_type: 1,  // VERIFICATION_RESPONSE
                request_id: incoming_msg.request_id,
                verified: if verified { 0x01 } else { 0x00 },
            };

            // Encode response for Ethereum
            let mut response_message = Vec::new();
            response_message.push(response.msg_type);
            response_message.extend_from_slice(&response.request_id);
            response_message.push(response.verified);

            // Send response back to Ethereum via LayerZero
            let msg_receipt = oapp::endpoint_cpi::send(
                ctx.accounts.oft_store.endpoint_program,
                ctx.accounts.oft_store.key(),
                ctx.remaining_accounts,
                &[OFT_SEED, &[ctx.accounts.oft_store.bump]],
                oapp::endpoint::instructions::SendParams {
                    dst_eid: params.src_eid,  // Send back to Ethereum
                    receiver: incoming_msg.sender.to_vec(),  // Send to original requester
                    message: response_message,
                    options: ctx.accounts.peer.enforced_options.combine_options(&None, &vec![])?,
                    native_fee: 0,
                    lz_token_fee: 0,
                },
            )?;

            emit!(VerificationResponseSent {
                request_id: incoming_msg.request_id,
                verified,
                dst_eid: params.src_eid,
            });

            msg!("Verification response sent. GUID: {:?}", msg_receipt.guid);
        }

        Ok(())
    }
}