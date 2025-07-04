// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OApp } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

contract WorkingOApp is OApp {
    uint32 public constant SOLANA_EID = 10232;
    
    event MessageReceived(uint32 srcEid, bytes32 sender, bytes message);
    event MessageSent(uint32 dstEid, bytes message);

    // Your exact solution with compatible OpenZeppelin version
    constructor(
        address _endpoint,
        address _owner
    ) OApp(_endpoint, _owner) {}

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Fixed: _origin.sender is bytes32, not bytes
        emit MessageReceived(_origin.srcEid, _origin.sender, _message);
    }

    function sendMessage(
        uint32 _dstEid,
        bytes memory _message
    ) external payable {
        bytes memory options = "";
        MessagingFee memory fee = _quote(_dstEid, _message, options, false);
        
        require(msg.value >= fee.nativeFee, "Insufficient fee");
        
        _lzSend(_dstEid, _message, options, fee, payable(msg.sender));
        
        emit MessageSent(_dstEid, _message);
    }

    function quote(
        uint32 _dstEid,
        bytes memory _message
    ) external view returns (MessagingFee memory) {
        bytes memory options = "";
        return _quote(_dstEid, _message, options, false);
    }
}