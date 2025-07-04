// Quick script to convert Solana address to bytes32

const SOLANA_PROGRAM = "2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v";

// LayerZero expects address as bytes32, but Solana addresses are base58
// For LayerZero OApp, we typically use the address as a string in bytes32 format
// Since this is cross-chain, let's encode it properly

function addressToBytes32(address) {
    // Convert string to bytes, then pad to 32 bytes
    const addressBytes = Buffer.from(address, 'utf8');
    const paddedBytes = Buffer.alloc(32);
    
    if (addressBytes.length <= 32) {
        // Left-pad with zeros
        addressBytes.copy(paddedBytes, 32 - addressBytes.length);
    } else {
        // Truncate if too long
        addressBytes.copy(paddedBytes, 0, 0, 32);
    }
    
    return '0x' + paddedBytes.toString('hex');
}

const result = addressToBytes32(SOLANA_PROGRAM);
console.log("Solana Program:", SOLANA_PROGRAM);
console.log("As bytes32:", result);
console.log("Length:", result.length, "(should be 66 chars including 0x)");