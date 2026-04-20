"use client"
import React, { useState, useEffect } from 'react';
import { Smartphone, Download, DollarSign, ShieldCheck, ArrowRight, Loader2, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TransactionBuilder, Operation, Asset, Networks, BASE_FEE, Account, Transaction } from '@stellar/stellar-sdk';
import { horizonServer } from '@/lib/stellar';

export default function OnboardPage() {
  const { publicKey, signTransaction } = useWallet();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Step 2: Friendbot
  const fundWallet = async () => {
    if (!publicKey) return;
    setLoading(true);
    setStatus('Requesting XLM from Friendbot...');
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (response.ok) {
        setStatus('Successfully funded with 10,000 XLM!');
        setTimeout(() => setStep(3), 1500);
      } else {
        throw new Error('Friendbot limit reached or error.');
      }
    } catch (err: any) {
      console.warn("Friendbot error (often rate limited):", err.message);
      // Even if it fails, many users might already be funded. Move on to step 3 to avoid blocking the user flow.
      setStatus('Moving to next phase...');
      setTimeout(() => setStep(3), 1000);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Change Trust
  const addTrustline = async () => {
    if (!publicKey) return;
    setLoading(true);
    setStatus('Preparing Trustline Transaction...');
    try {
      const usdcAsset = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
      
      const account = await horizonServer.loadAccount(publicKey);
      
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(Operation.changeTrust({
          asset: usdcAsset,
          limit: '1000000'
        }))
        .setTimeout(30)
        .build();

      const xdr = tx.toXDR();
      const signedXdr = await signTransaction(xdr);
      
      const response = await horizonServer.submitTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as Transaction);
      
      if (response.successful) {
        setStatus('USDC Trustline Established!');
        setTimeout(() => setStep(4), 1500);
      } else {
        throw new Error('Trustline failed.');
      }
    } catch (err: any) {
      console.error('Trustline error:', err);
      const detail = err.response?.data?.extras?.result_codes?.transaction || err.message;
      alert(`Trustline failed: ${detail}. Ensure you have XLM and Freighter is unlocked.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
           {[1,2,3,4].map(i => (
             <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[var(--gold)]' : 'bg-gray-800'}`}></div>
           ))}
        </div>

        <div className="glass-card p-10 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-[rgba(10,10,10,0.8)] backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6">
               <Loader2 className="text-[var(--gold)] animate-spin mb-4" size={48} />
               <p className="text-white font-medium">{status}</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(167,139,113,0.1)] flex items-center justify-center mx-auto mb-8 text-[var(--gold)]">
                 <Download size={40} />
              </div>
              <h1 className="font-display italic text-4xl mb-4 text-white">Setup Your Wallet</h1>
              <p className="text-gray-400 mb-10">To interact with the ReliefMesh protocol, you need the Stellar Freighter browser extension.</p>
              
              <div className="space-y-4">
                <a href="https://www.freighter.app/" target="_blank" className="btn-gold w-full flex items-center justify-center gap-2">
                   Download Freighter <ExternalLink size={18}/>
                </a>
                <button onClick={() => setStep(2)} className="text-[var(--gold)] text-sm font-semibold hover:underline">
                  Already installed? Connect and Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mx-auto mb-8 text-[var(--emerald)]">
                 <RefreshCw size={40} className={loading ? 'animate-spin' : ''} />
              </div>
              <h1 className="font-display italic text-4xl mb-4 text-white">Fuel Your Account</h1>
              <p className="text-gray-400 mb-8">Requests 10,000 Testnet XLM to pay for network fees and smart contract resource storage.</p>
              
              <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] font-mono text-xs text-gray-500 mb-8 truncate">
                 {publicKey || 'Please connect wallet in top nav'}
              </div>

              <button 
                onClick={fundWallet} 
                disabled={!publicKey || loading}
                className="btn-gold w-full flex items-center justify-center gap-2"
              >
                 Fund via Friendbot <DollarSign size={18}/>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(167,139,113,0.1)] flex items-center justify-center mx-auto mb-8 text-[var(--gold)]">
                 <ShieldCheck size={40} />
              </div>
              <h1 className="font-display italic text-4xl mb-4 text-white">Authorize USDC</h1>
              <p className="text-gray-400 mb-8">Establish a trustline for Testnet USDC. This allows your wallet to receive disaster relief funds securely.</p>
              
              <button 
                onClick={addTrustline} 
                disabled={loading}
                className="btn-gold w-full flex items-center justify-center gap-2"
              >
                 Establish Trustline <ShieldCheck size={18}/>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(52,211,153,0.1)] flex items-center justify-center mx-auto mb-8 text-[var(--emerald)]">
                 <CheckCircle size={40} />
              </div>
              <h1 className="font-display italic text-4xl mb-4 text-white">You're Ready!</h1>
              <p className="text-gray-400 mb-10">Your wallet is now fully configured for the Level 3 ReliefMesh demonstration.</p>
              
              <div className="space-y-4">
                 <div className="glass-card p-4 text-left">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Stellar Assets</div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-white text-sm font-bold">XLM</span>
                       <span className="text-[var(--emerald)] font-mono text-sm">10,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-white text-sm font-bold">USDC</span>
                       <span className="text-[var(--gold)] font-mono text-sm">0.00</span>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <a href="https://stellar.org/faucet" target="_blank" className="btn-outline flex-1 py-3 text-xs">Get USDC Faucet</a>
                    <button onClick={() => window.location.href = '/dashboard'} className="btn-gold flex-1 py-3 text-xs flex items-center justify-center gap-2">
                       Launch Dashboard <ArrowRight size={16}/>
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">ReliefMesh Protocol • Protocol Version 0.3.0-TESTNET</p>
        </div>
      </div>
    </div>
  );
}
