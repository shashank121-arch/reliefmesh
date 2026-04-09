"use client"
import React, { useState } from 'react';
import { Store, AlertTriangle, CheckCircle, PlusCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract } from '@/lib/stellar';

export default function ShopkeepersPage() {
  const { publicKey, signTransaction } = useWallet();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSK, setSelectedSK] = useState<any>(null);

  // Form State
  const [reason, setReason] = useState('Price Gouging (taking cut of aid)');

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !selectedSK) return;

    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
        method: 'flag_shopkeeper',
        args: [
           publicKey,
           selectedSK.id,
           reason
        ],
        publicKey,
        signTransaction
      });

      if (result.success) {
        alert(`Shopkeeper ${selectedSK.id} has been flagged. Dispute documented on-chain.`);
        setIsFlagModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Flagging failed");
    } finally {
      setLoading(false);
    }
  };

  const shopkeepers = [
    { id: 'SK008', name: "Rahul's Store", location: "Kerala, Ward 12", limit: 1000, current: 300, processed: 4500, disputes: 0, status: 'Active' },
    { id: 'SK012', name: "Munnar Trading Co", location: "Kerala, Ward 5", limit: 2000, current: 1100, processed: 12400, disputes: 1, status: 'Active' },
    { id: 'SK041', name: "Amin Grocers", location: "Kerala, Ward 9", limit: 500, current: 480, processed: 2100, disputes: 3, status: 'Flagged' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Shopkeeper Network</h1>
          <p className="text-gray-400 text-sm">Verified local cash-out points with daily limits.</p>
        </div>
        <button className="btn-gold whitespace-nowrap bg-[var(--gold)] text-black font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:bg-[var(--gold-hover)] transition-all">
          <PlusCircle size={18} /> Add Shopkeeper
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopkeepers.map((sk) => (
          <div key={sk.id} className="glass-card glass-card-hover p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-white text-lg flex items-center gap-2">
                   {sk.name} 
                   {sk.status === 'Active' ? <CheckCircle size={16} className="text-[var(--emerald)]" /> : null}
                 </h3>
                 <p className="text-sm text-gray-400">{sk.location}</p>
               </div>
               <span className={`badge ${sk.status === 'Flagged' ? 'badge-orange' : 'badge-green'} text-[10px]`}>
                 {sk.status}
               </span>
            </div>

            <div className="mb-4 bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
               <div className="flex justify-between text-xs mb-2">
                 <span className="text-gray-400">Daily Cashout Limit</span>
                 <span className="text-[var(--gold)] font-mono">${sk.current} / ${sk.limit}</span>
               </div>
               <div className="progress-bar h-2">
                 <div className="progress-bar-fill" style={{ width: `${(sk.current / sk.limit) * 100}%` }}></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center mb-6 py-3 border-y border-[var(--border-subtle)]">
               <div>
                  <div className="label-text">Lifetime Processed</div>
                  <div className="font-mono text-white mt-1">${sk.processed}</div>
               </div>
               <div className="border-l border-[var(--border-subtle)]">
                  <div className="label-text">Disputes</div>
                  <div className={`font-mono mt-1 ${sk.disputes > 0 ? 'text-[var(--orange)]' : 'text-gray-500'}`}>{sk.disputes}</div>
               </div>
            </div>

            <div className="mt-auto flex gap-3">
               <button className="btn-outline flex-1 py-2 text-xs h-10 rounded-full">View Log</button>
               <button 
                 onClick={() => { setSelectedSK(sk); setIsFlagModalOpen(true); }} 
                 className={`btn-gold flex-1 py-2 text-xs h-10 rounded-full bg-[var(--gold)] text-black font-bold ${sk.status === 'Flagged' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--gold-hover)]'}`}
                 disabled={sk.status === 'Flagged'}
               >
                 Flag / Audit
               </button>
            </div>
          </div>
        ))}
      </div>

      {isFlagModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFlagModalOpen(false)}>
           <div className="modal-card glass-card border-[rgba(245,158,11,0.3)] animate-modal-in" onClick={e=>e.stopPropagation()}>
              <h2 className="font-display italic text-3xl mb-2 flex items-center gap-3">
                <AlertTriangle className="text-[var(--orange)]"/> Flag {selectedSK?.id}
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-body">Reporting misconduct or price gouging for <strong>{selectedSK?.name}</strong>.</p>

              <form className="space-y-4" onSubmit={handleFlag}>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Reason for audit</label>
                   <select 
                    className="glass-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                   >
                     <option value="Price Gouging (taking cut of aid)">Price Gouging (taking cut of aid)</option>
                     <option value="Refusal of Service">Refusal of Service</option>
                     <option value="No Cash Available">No Cash Available</option>
                     <option value="Fraudulent Transaction">Fraudulent Transaction</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Evidence / Description</label>
                   <textarea className="glass-textarea h-24" placeholder="Victim VIC-X29A reported shopkeeper demanded a 20% cut of the $45 USDC aid to provide cash..."></textarea>
                 </div>

                 <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 mt-6">
                    <strong className="text-red-500 block text-sm mb-1">Warning: Clawback Next Steps</strong>
                    <p className="text-xs text-gray-400">Flagging will document the dispute on-chain. Chronic offenders will be suspended, and a smart contract Clawback can be initiated to recover stolen funds.</p>
                 </div>

                 <div className="pt-4 flex justify-end gap-3 mt-4">
                   <button type="button" onClick={() => setIsFlagModalOpen(false)} className="btn-outline py-3 px-6 h-12 rounded-full">Cancel</button>
                   <button 
                    type="submit" 
                    className="btn-red bg-red-600 text-white py-3 px-8 h-12 rounded-full font-bold flex items-center gap-2"
                    disabled={loading}
                   >
                     {loading ? <Loader2 className="animate-spin" size={20} /> : "Flag & Document"}
                   </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
