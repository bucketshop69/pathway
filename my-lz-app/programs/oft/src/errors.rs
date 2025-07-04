use anchor_lang::prelude::error_code;

#[error_code]
pub enum OFTError {
    Unauthorized,
    InvalidSender,
    InvalidDecimals,
    SlippageExceeded,
    InvalidTokenDest,
    RateLimitExceeded,
    InvalidFee,
    InvalidMintAuthority,
    Paused,
}

#[error_code]
pub enum EscrowError {
    #[msg("Claim code already used")]
    AlreadyClaimed,
    #[msg("Invalid claim code")]
    InvalidClaimCode,
    #[msg("Invalid message format")]
    InvalidMessage,
    #[msg("Escrow has expired")]
    EscrowExpired,
    #[msg("Invalid source chain")]
    InvalidSourceChain,
}
