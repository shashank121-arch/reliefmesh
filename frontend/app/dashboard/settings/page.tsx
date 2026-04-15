"use client"
import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Loader2, Key, CheckCircle } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { transferAdmin, queryContract } from '@/lib/stellar';
import { Keypair } from '@stellar/stellar-sdk';

export default function SettingsPage() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentAdminSecret, setCurrentAdminSecret] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!publicKey) return;
      try {
        const state: any = await queryContract({
          contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
          method: 'get_pool_state',
        });
        if (state) {
          const storedAdmin = state.admin || state[0] || state['0'];
          if (storedAdmin === publicKey) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkAdmin();
  }, [publicKey, success]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Please connect your wallet (Freighter/Albedo) first to receive ownership.");
      return;
    }

    setLoading(true);
    try {
      const result = await transferAdmin({
        contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
        currentAdminSecret: currentAdminSecret,
        newAdminAddress: publicKey,
      });
      
      if (result.success) {
        setTxHash(result.hash);
        setSuccess(true);
      } else {
        alert("Transfer transaction failed at submission.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Transfer failed: ${err.message || 'Unknown error'}. Ensure the secret key is correct and owns the contract.`);
    } finally {
      setLoading(false);
    }
  };

  // Re-thinking: I'll update stellar.ts to support a direct secret key signTransaction or a separate function.
  // For now, let's just build the UI.

  if (success || isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up text-center">
        <CheckCircle className="text-[var(--gold)] mb-6 animate-glow-pulse" size={80} />
        <h1 className="font-display italic text-4xl mb-4">Ownership Verified</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Your connected wallet ({publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}) is <strong>ALREADY</strong> the authorized administrator of the Relief Pool. You hold full governance control over the smart contracts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display italic text-4xl mb-2">Platform Settings</h1>
        <p className="text-gray-400">Manage administrative protocols and contract ownership.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-8 border-[var(--border-gold)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-[rgba(167,139,113,0.1)] text-[var(--gold)]">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Transfer Administration</h2>
              <p className="text-sm text-gray-400">Relinquish control from the deployer to your connected wallet.</p>
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Target Address (Your Wallet)</span>
              <span className="text-[var(--gold)] font-mono">{publicKey ? `${publicKey.slice(0,10)}...${publicKey.slice(-10)}` : 'Wallet Not Connected'}</span>
            </div>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Key size={14} className="text-[var(--gold)]" />
                Current Admin Secret Key (Deployer)
              </label>
              <input 
                type="password" 
                className="glass-input font-mono text-sm" 
                placeholder="S..." 
                required
                value={currentAdminSecret}
                onChange={(e) => setCurrentAdminSecret(e.target.value)}
              />
              <p className="mt-2 text-[10px] text-gray-500 italic">
                * This is only needed once to authorize your browser wallet as the new permanent admin.
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-gold w-full flex items-center justify-center gap-2 py-4"
              disabled={loading || !publicKey}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authorizing Transfer...
                </>
              ) : (
                <>
                  Transfer Mastery to Wallet <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="glass-card p-6 opacity-50">
           <h3 className="text-white font-medium mb-2">Advanced Protocol Config</h3>
           <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
             <span className="text-sm text-gray-400">Emergency Stop Valve</span>
             <div className="toggle-switch"></div>
           </div>
           <div className="flex items-center justify-between py-3">
             <span className="text-sm text-gray-400">Auto-Clawback Threshold</span>
             <span className="text-white font-mono">$500.00</span>
           </div>
        </div>
      </div>
    </div>
  );
}
