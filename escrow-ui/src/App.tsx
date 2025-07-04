import React, { useState, useMemo } from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import GiftSender from './components/GiftSender';
import ClaimReceiver from './components/ClaimReceiver';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'claim'>('send');
  
  const network = 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), []);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <div className="App">
          <header className="app-header">
            <h1>🎁 Cross-Chain Escrow Gifts</h1>
            <p>Send SOL gifts that can be claimed as ETH on Ethereum</p>
            <WalletMultiButton />
          </header>

          <div className="tab-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                onClick={() => setActiveTab('send')}
              >
                📤 Send Gift (Solana)
              </button>
              <button 
                className={`tab ${activeTab === 'claim' ? 'active' : ''}`}
                onClick={() => setActiveTab('claim')}
              >
                📥 Claim Gift (Ethereum)
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'send' ? (
                <GiftSender />
              ) : (
                <ClaimReceiver />
              )}
            </div>
          </div>

          <footer className="app-footer">
            <p>✨ Powered by LayerZero V2 Cross-Chain Protocol</p>
            <div className="links">
              <a href="https://testnet.layerzeroscan.com" target="_blank" rel="noopener noreferrer">
                LayerZero Scan
              </a>
              <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer">
                Sepolia Explorer
              </a>
            </div>
          </footer>
        </div>
      </WalletModalProvider>
    </WalletProvider>
  );
}

export default App;
