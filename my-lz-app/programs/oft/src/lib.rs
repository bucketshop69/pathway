use anchor_lang::prelude::*;

pub mod compose_msg_codec;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod msg_codec;
pub mod state;

use errors::*;
use events::*;
use instructions::*;
use instructions::verify_escrow::EscrowVerificationResponse;
use oapp::{
    endpoint::{MessagingFee, MessagingReceipt},
    LzReceiveParams,
};
use solana_helper::program_id_from_env;
use state::*;

declare_id!(Pubkey::new_from_array(program_id_from_env!(
    "OFT_ID",
    "9UovNrJD8pQyBLheeHNayuG1wJSEAoxkmM14vw5gcsTT"
)));

pub const OFT_SEED: &[u8] = b"OFT";
pub const PEER_SEED: &[u8] = b"Peer";
pub const ENFORCED_OPTIONS_SEED: &[u8] = b"EnforcedOptions";
pub const LZ_RECEIVE_TYPES_SEED: &[u8] = oapp::LZ_RECEIVE_TYPES_SEED;

#[program]
pub mod oft {
    use super::*;

    pub fn oft_version(_ctx: Context<OFTVersion>) -> Result<Version> {
        Ok(Version { interface: 2, message: 1 })
    }

    pub fn init_oft(mut ctx: Context<InitOFT>, params: InitOFTParams) -> Result<()> {
        InitOFT::apply(&mut ctx, &params)
    }

    pub fn init_store(mut ctx: Context<InitStore>, params: InitStoreParams) -> Result<()> {
        InitStore::apply(&mut ctx, &params)
    }

    // ============================== Admin ==============================
    pub fn set_oft_config(
        mut ctx: Context<SetOFTConfig>,
        params: SetOFTConfigParams,
    ) -> Result<()> {
        SetOFTConfig::apply(&mut ctx, &params)
    }

    pub fn set_peer_config(
        mut ctx: Context<SetPeerConfig>,
        params: SetPeerConfigParams,
    ) -> Result<()> {
        SetPeerConfig::apply(&mut ctx, &params)
    }

    pub fn set_pause(mut ctx: Context<SetPause>, params: SetPauseParams) -> Result<()> {
        SetPause::apply(&mut ctx, &params)
    }

    pub fn withdraw_fee(mut ctx: Context<WithdrawFee>, params: WithdrawFeeParams) -> Result<()> {
        WithdrawFee::apply(&mut ctx, &params)
    }

    // ============================== Public ==============================

    pub fn quote_oft(ctx: Context<QuoteOFT>, params: QuoteOFTParams) -> Result<QuoteOFTResult> {
        QuoteOFT::apply(&ctx, &params)
    }

    pub fn quote_send(ctx: Context<QuoteSend>, params: QuoteSendParams) -> Result<MessagingFee> {
        QuoteSend::apply(&ctx, &params)
    }

    pub fn send(
        mut ctx: Context<Send>,
        params: SendParams,
    ) -> Result<(MessagingReceipt, OFTReceipt)> {
        Send::apply(&mut ctx, &params)
    }

    pub fn lz_receive(mut ctx: Context<LzReceive>, params: LzReceiveParams) -> Result<()> {
        msg!("LayerZero message received from EID: {}", params.src_eid);
        msg!("Message length: {}", params.message.len());
        
        // Check if this is from Ethereum Sepolia
        if params.src_eid == 10161 && params.message.len() > 0 {
            let message_type = params.message[0];
            msg!("Message type: {}", message_type);
            
            if message_type == 0 {
                // Type 0: Verification request from Ethereum
                handle_ethereum_verification_request(&mut ctx, &params)
            } else {
                msg!("Unknown message type from Ethereum: {}", message_type);
                Ok(())
            }
        } else {
            // Default OFT handling for other chains/message types
            LzReceive::apply(&mut ctx, &params)
        }
    }

    pub fn lz_receive_types(
        ctx: Context<LzReceiveTypes>,
        params: LzReceiveParams,
    ) -> Result<Vec<oapp::endpoint_cpi::LzAccount>> {
        LzReceiveTypes::apply(&ctx, &params)
    }

    // ============================== Escrow ==============================
    
    pub fn create_escrow(
        mut ctx: Context<CreateEscrow>, 
        params: CreateEscrowParams
    ) -> Result<()> {
        CreateEscrow::apply(&mut ctx, &params)
    }

    pub fn initiate_claim(
        mut ctx: Context<InitiateClaim>,
        params: InitiateClaimParams,
    ) -> Result<()> {
        InitiateClaim::apply(&mut ctx, &params)
    }

    pub fn verify_escrow(
        mut ctx: Context<VerifyEscrow>,
        params: VerifyEscrowParams,
    ) -> Result<()> {
        VerifyEscrow::apply(&mut ctx, &params)
    }

}

// Helper function to handle verification requests from Ethereum
fn handle_ethereum_verification_request(ctx: &mut Context<LzReceive>, params: &LzReceiveParams) -> Result<()> {
    msg!("Handling verification request from Ethereum Sepolia");
    
    // Decode Ethereum message format: [type(1)][request_id(32)][sender(20)][amount(32)]
    let message = &params.message;
    
    if message.len() < 85 {  // 1 + 32 + 20 + 32 = 85 bytes
        msg!("Invalid message length: {}", message.len());
        return Err(EscrowError::InvalidMessage.into());
    }
    
    // Skip message type (already checked)
    let mut offset = 1;
    
    // Read request ID (32 bytes)
    let request_id: [u8; 32] = message[offset..offset+32].try_into()
        .map_err(|_| EscrowError::InvalidMessage)?;
    offset += 32;
    
    // Read Ethereum sender address (20 bytes)
    let eth_sender: [u8; 20] = message[offset..offset+20].try_into()
        .map_err(|_| EscrowError::InvalidMessage)?;
    offset += 20;
    
    // Read amount (32 bytes, take last 8 bytes as u64)
    let amount_bytes: [u8; 8] = message[offset+24..offset+32].try_into()
        .map_err(|_| EscrowError::InvalidMessage)?;
    let amount = u64::from_be_bytes(amount_bytes);
    
    msg!("Request ID: {:?}", hex::encode(request_id));
    msg!("Ethereum sender: {:?}", hex::encode(eth_sender));
    msg!("Amount: {} lamports", amount);
    
    // For demo: Always verify as true (in real app, check actual escrow)
    let verified = true;
    
    // Create response message for Ethereum
    // Format: [msg_type(1)][request_id(32)][verified(1)]
    let mut response_message = Vec::with_capacity(34);
    response_message.push(1u8); // Response message type
    response_message.extend_from_slice(&request_id);
    response_message.push(if verified { 0x01 } else { 0x00 });
    
    msg!("Verification result: {}", verified);
    msg!("Response message length: {}", response_message.len());
    
    // Send LayerZero response back to Ethereum
    // Note: In real implementation, this would use actual LayerZero send
    // For now, we'll emit an event showing the response
    emit!(EthereumVerificationResponse {
        request_id,
        eth_sender,
        amount,
        verified,
        response_length: response_message.len() as u32,
    });
    
    msg!("Verification response prepared for Ethereum");
    
    Ok(())
}

#[derive(Accounts)]
pub struct OFTVersion {}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Version {
    pub interface: u64,
    pub message: u64,
}
