use anchor_lang::prelude::*;

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClaimNotificationMessage {
    pub claim_code: String,
    pub amount: u64,
    pub token_type: TokenType,
    pub recipient: [u8; 32],
    pub expiry: i64,
}

impl ClaimNotificationMessage {
    pub fn encode(&self) -> Result<Vec<u8>> {
        let mut encoded = Vec::new();
        self.serialize(&mut encoded)?;
        Ok(encoded)
    }

    pub fn decode(data: &[u8]) -> Result<Self> {
        Self::deserialize(&mut &data[..])
            .map_err(|_| crate::errors::EscrowError::InvalidMessage.into())
    }
}