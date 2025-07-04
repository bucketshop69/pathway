// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EscrowClaimerV2
 * @dev Simplified cross-chain escrow claimer for LayerZero V2 testing
 */
contract EscrowClaimerV2 is Ownable, ReentrancyGuard {
    
    // Claim data structure
    struct ClaimData {
        uint256 amount;
        address claimer;
        bool claimed;
        uint256 timestamp;
    }
    
    // State variables
    mapping(string => ClaimData) public claims;
    mapping(address => uint256) public userClaimCount;
    
    uint256 public totalClaims;
    uint256 public successfulClaims;
    uint256 public totalValueClaimed;
    
    // Constants
    uint32 public constant SOLANA_EID = 10232;
    uint256 public constant MAX_CLAIM_AMOUNT = 100 ether;
    uint256 public constant CLAIM_EXPIRY = 7 days;
    
    // Events
    event EscrowMessageReceived(string indexed claimCode, uint256 amount, address indexed claimer);
    event TokensClaimed(string indexed claimCode, uint256 amount, address indexed claimer);
    event VerificationRequested(string indexed claimCode, address indexed claimer, uint32 solanaEid);
    
    // Errors
    error InvalidClaimCode();
    error NotAuthorizedClaimer();
    error AlreadyClaimed();
    error ClaimExpiredError();
    error InvalidAmount();
    error InsufficientContractBalance();
    error TransferFailed();
    
    constructor() {}
    
    /**
     * @dev Simulated LayerZero message receiver for testing
     */
    function simulateReceiveMessage(
        string calldata claimCode,
        uint256 amount,
        address claimer
    ) external onlyOwner {
        require(amount > 0 && amount <= MAX_CLAIM_AMOUNT, "Invalid amount");
        require(claimer != address(0), "Invalid claimer address");
        require(claims[claimCode].timestamp == 0, "Claim code already exists");
        
        claims[claimCode] = ClaimData({
            amount: amount,
            claimer: claimer,
            claimed: false,
            timestamp: block.timestamp
        });
        
        totalClaims++;
        
        emit EscrowMessageReceived(claimCode, amount, claimer);
    }
    
    /**
     * @dev Claim tokens with claim code
     */
    function claimTokens(string calldata claimCode) external payable nonReentrant {
        ClaimData storage claim = claims[claimCode];
        
        // If claim doesn't exist, emit verification request event
        if (claim.timestamp == 0) {
            emit VerificationRequested(claimCode, msg.sender, SOLANA_EID);
            return;
        }
        
        // Validate claimer authorization
        if (claim.claimer != msg.sender) revert NotAuthorizedClaimer();
        
        // Validate not already claimed
        if (claim.claimed) revert AlreadyClaimed();
        
        // Validate not expired
        if (block.timestamp > claim.timestamp + CLAIM_EXPIRY) {
            revert ClaimExpiredError();
        }
        
        // Check contract has sufficient balance
        if (address(this).balance < claim.amount) {
            revert InsufficientContractBalance();
        }
        
        // Mark as claimed
        claim.claimed = true;
        successfulClaims++;
        totalValueClaimed += claim.amount;
        userClaimCount[msg.sender]++;
        
        // Transfer tokens to claimer
        (bool success, ) = payable(msg.sender).call{value: claim.amount}("");
        if (!success) revert TransferFailed();
        
        emit TokensClaimed(claimCode, claim.amount, msg.sender);
    }
    
    /**
     * @dev Check if claim code is valid and available
     */
    function isClaimValid(string calldata claimCode) external view returns (bool) {
        ClaimData memory claim = claims[claimCode];
        
        return claim.timestamp > 0 && 
               !claim.claimed && 
               block.timestamp <= claim.timestamp + CLAIM_EXPIRY;
    }
    
    /**
     * @dev Get claim details
     */
    function getClaimDetails(string calldata claimCode) external view returns (
        uint256 amount,
        address claimer,
        bool claimed,
        uint256 timestamp,
        bool expired
    ) {
        ClaimData memory claim = claims[claimCode];
        
        return (
            claim.amount,
            claim.claimer,
            claim.claimed,
            claim.timestamp,
            claim.timestamp > 0 && block.timestamp > claim.timestamp + CLAIM_EXPIRY
        );
    }
    
    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (
        uint256 _totalClaims,
        uint256 _successfulClaims,
        uint256 _totalValueClaimed,
        uint256 contractBalance
    ) {
        return (
            totalClaims,
            successfulClaims,
            totalValueClaimed,
            address(this).balance
        );
    }
    
    /**
     * @dev Fund contract
     */
    receive() external payable {}
    
    /**
     * @dev Emergency withdraw
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}