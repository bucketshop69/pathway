// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockLZEndpoint
 * @dev Mock LayerZero endpoint for testing cross-chain message reception
 */
contract MockLZEndpoint {
    
    // Events to simulate LayerZero behavior
    event PacketSent(uint32 indexed dstEid, bytes message);
    event PacketReceived(address indexed receiver, uint32 indexed srcEid, bytes message);
    
    /**
     * @dev Simulate receiving a message from another chain
     */
    function simulateReceive(
        address _receiver,
        uint32 _srcEid,
        bytes calldata _message
    ) external {
        // Call the receiver's simplified receiveMessage function
        (bool success, ) = _receiver.call(
            abi.encodeWithSignature("receiveMessage(uint32,bytes)", _srcEid, _message)
        );
        require(success, "Message delivery failed");
        
        emit PacketReceived(_receiver, _srcEid, _message);
    }
    
    /**
     * @dev Simulate sending a message (for completeness)
     */
    function send(
        uint32 _dstEid,
        bytes calldata _message
    ) external payable {
        emit PacketSent(_dstEid, _message);
    }
    
    /**
     * @dev Mock quote function
     */
    function quote(
        uint32 _dstEid,
        bytes calldata _message,
        bytes calldata _options,
        bool _payInLzToken
    ) external pure returns (uint256 nativeFee, uint256 lzTokenFee) {
        // Return mock fees
        return (0.001 ether, 0);
    }
}