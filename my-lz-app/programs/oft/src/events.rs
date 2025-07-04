use crate::*;

#[event]
pub struct OFTSent {
    pub guid: [u8; 32],
    pub dst_eid: u32,
    pub from: Pubkey,
    pub amount_sent_ld: u64,
    pub amount_received_ld: u64,
}

#[event]
pub struct OFTReceived {
    pub guid: [u8; 32],
    pub src_eid: u32,
    pub to: Pubkey,
    pub amount_received_ld: u64,
}

#[event]
pub struct EscrowCreated {
    pub claim_code: String,
    pub amount: u64,
    pub depositor: Pubkey,
    pub expires_at: i64,
}

#[event]
pub struct ClaimInitiated {
    pub claim_code: String,
    pub dst_eid: u32,
    pub amount: u64,
    pub recipient: [u8; 32],
}

#[event]
pub struct CrossChainClaim {
    pub claim_code: String,
    pub amount: u64,
    pub src_eid: u32,
    pub claimer: Pubkey,
}

#[event]
pub struct CrossChainMessageSent {
    pub claim_code: String,
    pub dst_eid: u32,
    pub claimer: [u8; 32],
    pub amount: u64,
}

#[event]
pub struct EscrowVerificationSent {
    pub claim_code: String,
    pub amount: u64,
    pub claimer: [u8; 32],
    pub dst_eid: u32,
    pub verified: bool,
}

#[event]
pub struct EthereumVerificationResponse {
    pub request_id: [u8; 32],
    pub eth_sender: [u8; 20],
    pub amount: u64,
    pub verified: bool,
    pub response_length: u32,
}
