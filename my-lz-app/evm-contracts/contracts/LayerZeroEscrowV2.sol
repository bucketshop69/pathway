// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OApp } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

contract LayerZeroEscrowV2 is OApp {
    using OptionsBuilder for bytes;

    // Constants - Real LayerZero V2 EIDs
    uint32 public constant SOLANA_EID = 10232;
    uint32 public constant SEPOLIA_EID = 10161;

    // Message types
    uint8 public constant VERIFICATION_REQUEST = 0;
    uint8 public constant VERIFICATION_RESPONSE = 1;

    // Events
    event VerificationRequested(bytes32 indexed requestId, address indexed requester, uint256 amount);
    event VerificationReceived(bytes32 indexed requestId, bool verified);
    event EscrowClaimed(bytes32 indexed requestId, address indexed claimer, uint256 amount);

    // Errors
    error InvalidSourceChain(uint32 srcEid);
    error InsufficientFee(uint256 required, uint256 provided);
    error InvalidOptions(bytes options);
    error MessageFailed(bytes32 messageId);
    error InvalidClaimCode();
    error AlreadyClaimed();
    error InsufficientBalance();

    // Claim data
    struct ClaimData {
        uint256 amount;
        address claimer;
        bool claimed;
        uint256 timestamp;
        bool verified;
    }

    mapping(bytes32 => ClaimData) public claims;
    mapping(address => uint256) public userClaimCount;

    constructor(
        address _endpoint,
        address _owner
    ) OApp(_endpoint, _owner) {}

    /**
     * @dev Build LayerZero V2 options with correct format
     */
    function buildOptions() public pure returns (bytes memory) {
        return OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(200000, 0);  // Only this method exists in V2
    }

    /**
     * @dev LayerZero V2 message receiver
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        if (_origin.srcEid != SOLANA_EID) {
            revert InvalidSourceChain(_origin.srcEid);
        }

        // Decode message with proper format
        uint8 msgType = uint8(_message[0]);
        
        if (msgType == VERIFICATION_RESPONSE) {
            _handleVerificationResponse(_message[1:]);
        }
    }

    /**
     * @dev Handle verification response from Solana
     */
    function _handleVerificationResponse(bytes calldata _message) internal {
        // Decode: request_id (32) + verified (1)
        bytes32 requestId = bytes32(_message[0:32]);
        bool verified = _message[32] == 0x01;
        
        if (verified && claims[requestId].timestamp == 0) {
            // Set as verified and ready for claim
            claims[requestId].verified = true;
        }
        
        emit VerificationReceived(requestId, verified);
    }

    /**
     * @dev Request verification from Solana with proper encoding
     */
    function requestVerification(
        bytes32 requestId,
        uint256 amount
    ) external payable {
        // Encode message: type (1) + request_id (32) + sender (20) + amount (32)
        bytes memory message = abi.encodePacked(
            uint8(VERIFICATION_REQUEST),     // Message type
            requestId,                       // Keep byte order consistent
            msg.sender,                      // Ethereum address as is
            amount                          // Use uint256
        );
        
        bytes memory options = buildOptions();
        
        // Get accurate fees
        MessagingFee memory fee = _quote(SOLANA_EID, message, options, false);
        
        if (msg.value < fee.nativeFee) {
            revert InsufficientFee(fee.nativeFee, msg.value);
        }

        try this._lzSendWrapper{value: fee.nativeFee}(
            SOLANA_EID,
            message,
            options,
            fee,
            payable(msg.sender)
        ) {
            // Store pending claim
            claims[requestId] = ClaimData({
                amount: amount,
                claimer: msg.sender,
                claimed: false,
                timestamp: block.timestamp,
                verified: false
            });
            
            emit VerificationRequested(requestId, msg.sender, amount);
        } catch (bytes memory reason) {
            revert MessageFailed(requestId);
        }
    }

    /**
     * @dev Wrapper for _lzSend to handle errors
     */
    function _lzSendWrapper(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        MessagingFee memory _fee,
        address payable _refundAddress
    ) external payable {
        require(msg.sender == address(this), "Only self");
        _lzSend(_dstEid, _message, _options, _fee, _refundAddress);
    }

    /**
     * @dev Claim verified escrow
     */
    function claimEscrow(bytes32 requestId) external {
        ClaimData storage claim = claims[requestId];
        
        if (claim.claimer != msg.sender) revert InvalidClaimCode();
        if (claim.claimed) revert AlreadyClaimed();
        if (!claim.verified) revert InvalidClaimCode();
        if (address(this).balance < claim.amount) revert InsufficientBalance();
        
        claim.claimed = true;
        userClaimCount[msg.sender]++;
        
        (bool success, ) = payable(msg.sender).call{value: claim.amount}("");
        require(success, "Transfer failed");
        
        emit EscrowClaimed(requestId, msg.sender, claim.amount);
    }

    /**
     * @dev Get fee quote for verification request
     */
    function quoteVerification(
        bytes32 requestId,
        uint256 amount
    ) external view returns (MessagingFee memory) {
        bytes memory message = abi.encodePacked(
            uint8(VERIFICATION_REQUEST),
            requestId,
            msg.sender,
            amount
        );
        
        bytes memory options = buildOptions();
        return _quote(SOLANA_EID, message, options, false);
    }

    /**
     * @dev Fund contract for claims
     */
    receive() external payable {}

    /**
     * @dev Get configured peer for verification
     * @dev setPeer already inherited from OAppCore
     */
    function getPeer(uint32 _eid) external view returns (bytes32) {
        return peers[_eid];
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}