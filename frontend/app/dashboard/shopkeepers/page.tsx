"use client"
import React, { useState, useEffect } from 'react';
import { Store, AlertTriangle, CheckCircle, PlusCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract, queryContract } from '@/lib/stellar';
import { monitor } from '@/lib/monitoring';

export default function ShopkeepersPage() {
  const { publicKey, signTransaction } = useWallet();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedSK, setSelectedSK] = useState<any>(null);
  const [shopkeepers, setShopkeepers] = useState<any[]>([]);
  const [successAction, setSuccessAction] = useState<'flag' | 'add' | null>(null);
  const [txHash, setTxHash] = useState('');

  // Flag Form State
  const [reason, setReason] = useState('Price Gouging (taking cut of aid)');

  // Add SK Form State
  const [newSkId, setNewSkId] = useState('');
  const [newSkWallet, setNewSkWallet] = useState('');
  const [newSkName, setNewSkName] = useState('');
  const [newSkLocation, setNewSkLocation] = useState('');
  const [newSkPhone, setNewSkPhone] = useState('');
  const [newSkLimit, setNewSkLimit] = useState('1000');

  const fetchShopkeepers = async () => {
    setFetching(true);
    try {
      const data = await queryContract({
        contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
        method: 'get_active_shopkeepers',
        args: []
      });
      // Assuming data is an array of objects
      if (data && Array.isArray(data)) {
         setShopkeepers(data.map((sk: any) => ({
           id: sk.id || sk[0],
           name: sk.name || sk[2] || "Unknown",
           location: sk.location || sk[3] || "Unknown",
           limit: sk.max_daily_limit ? Number(sk.max_daily_limit) / 10000000 : 1000,
           current: sk.today_cashouts ? Number(sk.today_cashouts) / 10000000 : 0,
           processed: sk.total_cashouts ? Number(sk.total_cashouts) / 10000000 : 0,
           disputes: sk.dispute_count || 0,
           status: sk.is_active ? 'Active' : 'Flagged'
         })));
      } else {
         setShopkeepers([]);
      }
    } catch (e) {
      console.error(e);
      setShopkeepers([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchShopkeepers();
  }, []);

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !selectedSK) return;

    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
        method: 'flag_shopkeeper',
        args: [
           { type: 'address', value: publicKey },
           selectedSK.id,
           reason
        ],
        publicKey,
        signTransaction
      });

      if (result.success) {
        setTxHash(result.hash);
        setSuccessAction('flag');
        setIsFlagModalOpen(false);
        fetchShopkeepers();
      }
    } catch (err) {
      console.error(err);
      alert("Flagging failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
       const result = await invokeContract({
         contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
         method: 'register_shopkeeper',
         args: [
           { type: 'address', value: publicKey },
           newSkId,
           { type: 'address', value: newSkWallet },
           newSkName,
           newSkLocation,
           newSkPhone,
           { type: 'i128', value: BigInt(Math.floor(parseFloat(newSkLimit) * 10000000)) }
         ],
         publicKey,
         signTransaction
       });

       if (result.success) {
          // Auto-verify them so they become active on the network immediately
          try {
            await invokeContract({
              contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
              method: 'verify_shopkeeper',
              args: [{ type: 'address', value: publicKey }, newSkId],
              publicKey,
              signTransaction
            });
          } catch(err) {
             console.error("Auto-verify failed, but SK is registered:", err);
          }

          setTxHash(result.hash);
          setSuccessAction('add');
          setIsAddModalOpen(false);
          monitor.shopkeeperRegistered(newSkLocation);
          // Wait briefly for ledger close then fetch
          setTimeout(() => fetchShopkeepers(), 1000);
       }
    } catch (err) {
      console.error("Failed to add sk:", err);
      alert("Failed to register shopkeeper.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Shopkeeper Network</h1>
          <p className="text-gray-400 text-sm">Verified local cash-out points with daily limits.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-gold whitespace-nowrap bg-[var(--gold)] text-black font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:bg-[var(--gold-hover)] transition-all">
          <PlusCircle size={18} /> Add Shopkeeper
        </button>
      </div>

      {fetching ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--gold)]" size={32} /></div>
      ) : shopkeepers.length === 0 ? (
        <div className="glass-card text-center p-12 text-gray-400">
           No active shopkeepers found on network. Register one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopkeepers.map((sk, index) => (
            <div key={index} className="glass-card glass-card-hover p-6 flex flex-col">
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
                   <div className="progress-bar-fill" style={{ width: `${Math.min((sk.current / sk.limit) * 100, 100)}%` }}></div>
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
      )}

      {/* FLAG MODAL */}
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

      {/* ADD SHOPKEEPER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
           <div className="modal-card glass-card border-[rgba(167,139,113,0.3)] animate-modal-in" onClick={e=>e.stopPropagation()}>
              <h2 className="font-display italic text-3xl mb-2 flex items-center gap-3">
                <Store className="text-[var(--gold)]"/> Register Shopkeeper
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-body">Add a verified neighborhood location for victim cash-outs.</p>

              <form className="space-y-4" onSubmit={handleAdd}>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Stellar Public Key (Wallet)</label>
                   <input type="text" required className="glass-input text-sm font-mono" placeholder="G..." value={newSkWallet} onChange={(e) => setNewSkWallet(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm text-gray-300 mb-1">Shopkeeper ID</label>
                     <input type="text" required className="glass-input" placeholder="SK-..." value={newSkId} onChange={(e) => setNewSkId(e.target.value)} />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-300 mb-1">Daily Limit (USDC)</label>
                     <input type="number" required className="glass-input" placeholder="1000" value={newSkLimit} onChange={(e) => setNewSkLimit(e.target.value)} />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Business Name</label>
                   <input type="text" required className="glass-input" placeholder="Rahul's Store" value={newSkName} onChange={(e) => setNewSkName(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Location</label>
                   <input type="text" required className="glass-input" placeholder="Kerala, Ward 12" value={newSkLocation} onChange={(e) => setNewSkLocation(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Phone Contact (Optional)</label>
                   <input type="text" className="glass-input" placeholder="+91..." value={newSkPhone} onChange={(e) => setNewSkPhone(e.target.value)} />
                 </div>

                 <div className="pt-4 flex justify-end gap-3 mt-4">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-outline py-3 px-6 h-12 rounded-full">Cancel</button>
                   <button 
                    type="submit" 
                    className="btn-gold bg-[var(--gold)] text-black py-3 px-8 h-12 rounded-full font-bold flex items-center gap-2 hover:bg-[var(--gold-hover)]"
                    disabled={loading}
                   >
                     {loading ? <Loader2 className="animate-spin" size={20} /> : "Record On-Chain"}
                   </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* SUCCESS MODALS */}
      {successAction === 'flag' && (
        <div className="modal-overlay" onClick={() => setSuccessAction(null)}>
           <div className="modal-card glass-card gold-border animate-modal-in text-center flex flex-col items-center p-10" onClick={e=>e.stopPropagation()}>
              <CheckCircle className="text-[var(--orange)] mb-4" size={60} />
              <h2 className="font-display italic text-2xl mb-2">Shopkeeper Flagged</h2>
              <p className="text-gray-400 text-sm mb-6">Dispute documented securely on-chain.</p>
              <div className="w-full flex flex-col gap-3">
                 <button onClick={() => setSuccessAction(null)} className="btn-outline">Close</button>
                 <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center justify-center gap-2">View Tx on Explorer <ExternalLink size={16}/></a>
              </div>
           </div>
        </div>
      )}

      {successAction === 'add' && (
        <div className="modal-overlay" onClick={() => setSuccessAction(null)}>
           <div className="modal-card glass-card gold-border animate-modal-in text-center flex flex-col items-center p-10" onClick={e=>e.stopPropagation()}>
              <CheckCircle className="text-[var(--gold)] mb-4" size={60} />
              <h2 className="font-display italic text-2xl mb-2">Shopkeeper Added</h2>
              <p className="text-gray-400 text-sm mb-6">Location registered and recorded on-chain.</p>
              <div className="w-full flex flex-col gap-3">
                 <button onClick={() => setSuccessAction(null)} className="btn-outline">Close</button>
                 <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center justify-center gap-2">View Tx on Explorer <ExternalLink size={16}/></a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
