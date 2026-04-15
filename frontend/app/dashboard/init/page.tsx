"use client"
import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract } from '@/lib/stellar';
import { Address } from '@stellar/stellar-sdk';
import { CheckCircle, Loader2, Zap } from 'lucide-react';

export default function InitPool() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInitialize = async () => {
    if (!publicKey) return alert('Connect wallet first');
    setLoading(true);

    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
        method: 'initialize',
        args: [
          { type: 'address', value: publicKey }, // admin
          { type: 'address', value: process.env.NEXT_PUBLIC_USDC_CONTRACT_ID! }, // token_address
          { type: 'address', value: process.env.NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID! },
          { type: 'address', value: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID! },
          { type: 'address', value: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID! },
        ],
        publicKey,
        signTransaction
      });

      if (result.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      alert('Init failed (It may already be initialized if you succeeded earlier). Check console.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle className="text-[var(--gold)] mb-6" size={80} />
        <h1 className="text-3xl mb-4">Contract Initialized!</h1>
        <p className="text-gray-400 mb-8">Your Freighter wallet is now the official Admin of the Relief Pool.</p>
        <a href="/dashboard/fund" className="btn-gold">Go to Fund Pool</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Zap className="text-[var(--gold)] mb-6" size={60} />
      <h1 className="text-4xl font-display italic mb-4">Initialize Relief Pool</h1>
      <p className="text-gray-400 mb-8">
        We need to initialize the newly deployed contract on the blockchain and map <strong>your Freighter wallet</strong> as the Admin. 
        Click the button below to sign the transaction.
      </p>
      <button 
        onClick={handleInitialize} 
        disabled={loading || !publicKey}
        className="btn-gold flex items-center justify-center gap-2 px-8 py-4 text-lg"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign & Initialize'}
      </button>
    </div>
  );
}
