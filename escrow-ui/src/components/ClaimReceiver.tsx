import React, { useState } from 'react';
import { ethers } from 'ethers';

const ETHEREUM_CONTRACT = "0x29171bd2bB474f46158707ccCDe4da1b9144ffa7";
const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/qxqWLEbpIns_vA-nesFNZqy6iO9NtvK5";

const ClaimReceiver: React.FC = () => {
  const [claimCode, setClaimCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        // Switch to Sepolia network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Add Sepolia network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [SEPOLIA_RPC],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            });
          }
        }

        setIsConnected(true);
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask to claim gifts!');
    }
  };

  const claimGift = async () => {
    if (!isConnected || !claimCode.trim()) {
      alert('Please connect wallet and enter claim code');
      return;
    }

    setIsClaiming(true);

    try {
      // Convert claim code to bytes32 request ID
      const requestId = ethers.keccak256(ethers.toUtf8Bytes(claimCode));
      const amount = ethers.parseEther("0.1"); // Demo amount

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Contract ABI for verification request
      const contractABI = [
        "function requestVerification(bytes32 requestId, uint256 amount) external payable",
        "function quoteVerification(bytes32 requestId, uint256 amount) external view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
        "function claims(bytes32) external view returns (uint256 amount, address claimer, bool verified, bool claimed, uint256 timestamp)"
      ];

      const contract = new ethers.Contract(ETHEREUM_CONTRACT, contractABI, signer);

      // Get fee quote
      const fee = await contract.quoteVerification(requestId, amount);
      
      // Send verification request with LayerZero fee
      const tx = await contract.requestVerification(requestId, amount, {
        value: fee.nativeFee
      });

      const receipt = await tx.wait();

      setClaimResult({
        success: true,
        transactionHash: receipt.hash,
        claimCode,
        amount: "0.1",
        requestId,
        fee: ethers.formatEther(fee.nativeFee)
      });

    } catch (error: any) {
      console.error('Error claiming gift:', error);
      setClaimResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (claimResult) {
    return (
      <div className="claim-result">
        {claimResult.success ? (
          <div className="claim-success">
            <div className="success-icon">🎉</div>
            <h2>Verification Request Sent!</h2>
            
            <div className="claim-details">
              <div className="detail-row">
                <span className="label">Claim Code:</span>
                <span className="value">{claimResult.claimCode}</span>
              </div>
              <div className="detail-row">
                <span className="label">Expected Amount:</span>
                <span className="value">{claimResult.amount} ETH</span>
              </div>
              <div className="detail-row">
                <span className="label">LayerZero Fee:</span>
                <span className="value">{claimResult.fee} ETH</span>
              </div>
              <div className="detail-row">
                <span className="label">Transaction:</span>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${claimResult.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  View on Etherscan
                </a>
              </div>
            </div>

            <div className="next-steps">
              <h3>🔄 Next Steps:</h3>
              <ol>
                <li>Your verification request has been sent to Solana via LayerZero V2</li>
                <li>The Solana program will verify the gift exists</li>
                <li>Once verified, ETH will be available for claim</li>
                <li>This typically takes 1-2 minutes for cross-chain confirmation</li>
              </ol>
              
              <p className="layerzero-link">
                🔍 <a 
                  href={`https://testnet.layerzeroscan.com/tx/${claimResult.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Track on LayerZero Scan
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="claim-error">
            <div className="error-icon">❌</div>
            <h2>Claim Failed</h2>
            <p>{claimResult.error}</p>
          </div>
        )}

        <button 
          onClick={() => {
            setClaimResult(null);
            setClaimCode('');
          }}
          className="try-again-btn"
        >
          Try Another Claim
        </button>
      </div>
    );
  }

  return (
    <div className="claim-receiver">
      <div className="receiver-header">
        <h2>📥 Claim Your Cross-Chain Gift</h2>
        <p>Enter your claim code to receive ETH on Ethereum</p>
      </div>

      {!isConnected ? (
        <div className="wallet-prompt">
          <div className="prompt-icon">🦊</div>
          <h3>Connect Your Ethereum Wallet</h3>
          <p>Please connect MetaMask to claim your gift on Sepolia testnet</p>
          <button onClick={connectWallet} className="connect-btn">
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="claim-form">
          <div className="wallet-info">
            <div className="connected-indicator">✅ Connected</div>
            <div className="account-info">
              <span className="account-label">Account:</span>
              <span className="account-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <div className="network-info">
              <span className="network-label">Network:</span>
              <span className="network-name">Sepolia Testnet</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="claimCode">Claim Code</label>
            <input
              id="claimCode"
              type="text"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
              placeholder="Enter your gift claim code..."
              className="claim-code-input"
            />
            <small>Enter the claim code provided by the gift sender</small>
          </div>

          <div className="claim-info">
            <h3>💡 What happens when you claim:</h3>
            <ul>
              <li>A LayerZero V2 message is sent to Solana to verify the gift</li>
              <li>If valid, equivalent ETH will be made available on Ethereum</li>
              <li>Small LayerZero fee required (~$0.02 USD)</li>
              <li>Process typically takes 1-2 minutes for cross-chain confirmation</li>
            </ul>
          </div>

          <button
            onClick={claimGift}
            disabled={isClaiming || !claimCode.trim()}
            className="claim-btn"
          >
            {isClaiming ? (
              <>
                <span className="spinner">⏳</span>
                Sending Verification...
              </>
            ) : (
              <>
                🎁 Claim Gift
              </>
            )}
          </button>

          <div className="claim-disclaimer">
            <p><strong>Note:</strong> This is a testnet demonstration. You're receiving ETH on Sepolia testnet, which has no real value.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimReceiver;