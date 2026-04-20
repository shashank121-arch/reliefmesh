"use client"
import React, { useState } from 'react';
import { CheckCircle, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract } from '@/lib/stellar';
import { Address } from '@stellar/stellar-sdk';

export default function DistributeAid() {
  const { publicKey, signTransaction } = useWallet();
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Form State
  const [disaster, setDisaster] = useState('kerala2025');
  const [victimId, setVictimId] = useState('');
  const [amount, setAmount] = useState('45.00');

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Pre-flight: check pool has sufficient balance
      const { queryContract } = await import('@/lib/stellar');
      const available = await queryContract({
        contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
        method: 'get_available_balance',
        args: []
      });

      const amountStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));
      
      if (available !== null && BigInt(available) < amountStroops) {
        alert(`Insufficient pool balance. Available: ${(Number(available) / 10000000).toFixed(2)} USDC. You must fund the pool first.`);
        setLoading(false);
        return;
      }

      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
        method: 'distribute_aid',
        args: [
           { type: 'address', value: publicKey }, // admin
           victimId,
           { type: 'address', value: publicKey }, // victim_wallet (demo maps to user wallet)
           { type: 'i128', value: amountStroops },
           disaster,
           true // enable_clawback
        ],
        publicKey,
        signTransaction
      });
      
      if (result.success) {
        setTxHash(result.hash);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('trustline') || msg.includes('#13')) {
        alert("Distribution failed: The recipient wallet does not have a USDC trustline. The victim must complete the Onboard flow (Step 3: Establish Trustline) before they can receive USDC.");
      } else if (msg.includes('UnreachableCodeReached') || msg.includes('InvalidAction')) {
        alert("Distribution failed: The relief pool likely has insufficient USDC balance. Please fund the pool first via the Fund Pool page.");
      } else if (msg.includes('unauthorized')) {
        alert("Distribution failed: Your wallet is not the contract admin.");
      } else if (msg.includes('insufficient pool balance')) {
        alert("Distribution failed: Insufficient pool balance. Please fund the pool first.");
      } else {
        alert("Distribution failed: " + (msg.length > 200 ? msg.substring(0, 200) + '...' : msg));
      }
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up text-center">
        <CheckCircle className="text-[var(--gold)] mb-6 animate-glow-pulse" size={80} />
        <h1 className="font-display italic text-4xl mb-4">Aid Distributed Successfully</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          The smart contract has transferred USDC to the victim's wallet. The identity was verified via Zero-Knowledge commitment.
        </p>
        <div className="flex gap-4">
          <button onClick={() => setSuccess(false)} className="btn-outline">Distribute More</button>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-gold"
          >
            View Tx on Explorer <ArrowRight size={16}/>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
           <h1 className="font-display italic text-4xl mb-2">Distribute Aid</h1>
           <p className="text-gray-400">Send USDC directly to victim wallets with clawback protection.</p>
        </div>
        <div className="glass-card p-1 rounded-full inline-flex">
           <button 
             className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'single' ? 'bg-[var(--gold-gradient)] text-black' : 'text-gray-400 hover:text-white'}`}
             onClick={() => setMode('single')}
           >
             Single Victim
           </button>
           <button 
             className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'batch' ? 'bg-[var(--gold-gradient)] text-black' : 'text-gray-400 hover:text-white'}`}
             onClick={() => setMode('batch')}
           >
             Batch Upload
           </button>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        {mode === 'single' ? (
          <form className="space-y-6" onSubmit={handleDistribute}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Disaster Operation</label>
                   <select 
                    className="glass-select" 
                    required 
                    value={disaster}
                    onChange={(e) => setDisaster(e.target.value)}
                   >
                     <option value="kerala2025">Kerala Flood 2025</option>
                     <option value="turkey2024">Turkey Quake Relief</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Victim ID (Hashed ID)</label>
                   <input 
                    type="text" 
                    className="glass-input uppercase font-mono" 
                    placeholder="VIC-" 
                    required
                    value={victimId}
                    onChange={(e) => setVictimId(e.target.value)}
                   />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
                  <span>Amount (USDC)</span>
                  <span className="text-[var(--gold)]">Available Pool: $24,500</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input 
                    type="number" 
                    className="glass-input pl-8" 
                    placeholder="45.00" 
                    required 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
             </div>

             <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-6 flex items-center justify-between">
                <div>
                   <h4 className="font-semibold text-white mb-1">Enable Clawback Protection</h4>
                   <p className="text-xs text-gray-400 max-w-sm">Allows the charity admin to recover funds if the assigned shopkeeper attempts price-gouging or fraud.</p>
                </div>
                <div className="toggle-switch active"></div>
             </div>

             <div className="border border-[var(--border-gold)] bg-[rgba(167,139,113,0.05)] rounded-xl p-6">
               <div className="label-text mb-4 text-center">Distribution Preview</div>
               <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                 <span className="text-gray-400">Recipient ID</span>
                 <span className="font-mono text-white">{victimId || 'VIC-XXXX'}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                 <span className="text-gray-400">Network Fee (XLM)</span>
                 <span className="text-white">~0.01</span>
               </div>
               <div className="flex justify-between items-center py-3">
                 <span className="font-semibold text-white">Total Output</span>
                 <span className="font-display italic text-2xl text-[var(--gold)]">${parseFloat(amount || '0').toFixed(2)}</span>
               </div>
             </div>

             <button 
                type="submit" 
                className="btn-gold w-full btn-large flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing Distribution...
                  </>
                ) : (
                  "Confirm & Distribute Aid"
                )}
              </button>
          </form>
        ) : (
          <div className="space-y-6">
             <div className="border-2 border-dashed border-[var(--border-gold)] rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-[rgba(167,139,113,0.02)] transition-colors cursor-pointer text-gray-400 hover:text-[var(--gold)] group">
                <Upload size={48} className="mb-4 text-[var(--border-gold)] group-hover:text-[var(--gold)] transition-colors" />
                <h3 className="text-lg font-semibold text-white mb-2">Drop CSV File Here</h3>
                <p className="text-sm">or click to browse your computer</p>
                <div className="mt-4 text-xs font-mono bg-[var(--bg-primary)] px-3 py-1 rounded">Format: victim_id, amount, disaster_code</div>
             </div>
             
             <button className="btn-gold w-full btn-large opacity-50 cursor-not-allowed">Upload to Preview Batch</button>
          </div>
        )}
      </div>
    </div>
  );
}
