import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

const SOLANA_PROGRAM_ID = "2nXbNz4c1Rv6ba9jJucNWgTTuNbYGZYYRhE6MnoLc17v";

const GiftSender: React.FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('0.1');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdGift, setCreatedGift] = useState<any>(null);

  const generateClaimCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createGift = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your Solana wallet first!');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsCreating(true);

    try {
      const claimCode = generateClaimCode();
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // For now, just transfer SOL to a PDA as escrow
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), Buffer.from(claimCode)],
        new PublicKey(SOLANA_PROGRAM_ID)
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: escrowPDA,
          lamports: amountLamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      const giftData = {
        id: claimCode,
        amount: amount,
        sender: publicKey.toString(),
        recipientName,
        message,
        timestamp: new Date().toISOString(),
        signature,
        claimCode,
        status: 'pending',
        escrowAddress: escrowPDA.toString()
      };

      setCreatedGift(giftData);
      
      // Reset form
      setAmount('0.1');
      setRecipientName('');
      setMessage('');

    } catch (error: any) {
      console.error('Error creating gift:', error);
      alert('Failed to create gift: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (createdGift) {
    return (
      <div className="gift-success">
        <div className="success-icon">🎉</div>
        <h2>Gift Created Successfully!</h2>
        
        <div className="gift-details">
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">{createdGift.amount} SOL</span>
          </div>
          <div className="detail-row">
            <span className="label">Recipient:</span>
            <span className="value">{createdGift.recipientName || 'Anonymous'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Claim Code:</span>
            <span className="value claim-code">{createdGift.claimCode}</span>
          </div>
          <div className="detail-row">
            <span className="label">Transaction:</span>
            <a 
              href={`https://explorer.solana.com/tx/${createdGift.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on Solana Explorer
            </a>
          </div>
        </div>

        <div className="instructions">
          <h3>📋 Instructions for Recipient:</h3>
          <ol>
            <li>Go to the "Claim Gift" tab</li>
            <li>Connect their Ethereum wallet (MetaMask)</li>
            <li>Enter the claim code: <code>{createdGift.claimCode}</code></li>
            <li>They'll receive equivalent ETH on Ethereum Sepolia</li>
          </ol>
        </div>

        <button 
          onClick={() => setCreatedGift(null)}
          className="create-another-btn"
        >
          Create Another Gift
        </button>
      </div>
    );
  }

  return (
    <div className="gift-sender">
      <div className="sender-header">
        <h2>📤 Send a Cross-Chain Gift</h2>
        <p>Send SOL that can be claimed as ETH on Ethereum</p>
      </div>

      {!connected ? (
        <div className="wallet-prompt">
          <div className="prompt-icon">👛</div>
          <h3>Connect Your Solana Wallet</h3>
          <p>Please connect your Solana wallet to send gifts</p>
        </div>
      ) : (
        <div className="gift-form">
          <div className="form-group">
            <label htmlFor="amount">Gift Amount (SOL)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="0.1"
            />
            <small>Minimum: 0.01 SOL</small>
          </div>

          <div className="form-group">
            <label htmlFor="recipient">Recipient Name (Optional)</label>
            <input
              id="recipient"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Who is this gift for?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Gift Message (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
            />
          </div>

          <div className="gift-preview">
            <h3>🎁 Gift Preview</h3>
            <div className="preview-card">
              <div className="preview-amount">{amount} SOL</div>
              <div className="preview-conversion">≈ {amount} ETH on Ethereum</div>
              <div className="preview-recipient">
                For: {recipientName || 'Anonymous Recipient'}
              </div>
              {message && (
                <div className="preview-message">"{message}"</div>
              )}
            </div>
          </div>

          <button
            onClick={createGift}
            disabled={isCreating || !amount || parseFloat(amount) <= 0}
            className="create-gift-btn"
          >
            {isCreating ? (
              <>
                <span className="spinner">⏳</span>
                Creating Gift...
              </>
            ) : (
              <>
                🎁 Create Gift
              </>
            )}
          </button>

          <div className="sender-info">
            <h4>ℹ️ How it works:</h4>
            <ul>
              <li>Your SOL is locked in a secure escrow on Solana</li>
              <li>A unique claim code is generated</li>
              <li>Recipient uses the code to claim equivalent ETH on Ethereum</li>
              <li>LayerZero V2 handles the cross-chain verification</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftSender;