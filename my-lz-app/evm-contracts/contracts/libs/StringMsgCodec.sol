// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library StringMsgCodec {
    uint16 public constant VANILLA_TYPE = 1;

    function encode(string memory _string) internal pure returns (bytes memory) {
        return abi.encodePacked(abi.encode(uint256(bytes(_string).length)), bytes(_string));
    }

    function decode(bytes calldata _payload) internal pure returns (string memory) {
        uint256 stringLength = abi.decode(_payload[:32], (uint256));
        return string(_payload[32:32 + stringLength]);
    }
}