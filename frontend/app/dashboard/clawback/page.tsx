"use client"
import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function ClawbackPage() {
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [isExecuteOpen, setIsExecuteOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Clawback Controller</h1>
          <p className="text-gray-400 text-sm">Anti-corruption fund recovery system powered by Stellar.</p>
        </div>
        <button onClick={() => setIsInitiateModalOpen(true)} className="btn-red whitespace-nowrap">
          <AlertTriangle size={18} /> Initiate Clawback
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
         <div className="glass-card p-6 border-l-4 border-l-[var(--orange)]">
            <div className="label-text mb-2">Pending Cases</div>
            <div className="font-display italic text-4xl text-[var(--orange)]">1</div>
         </div>
         <div className="glass-card p-6 border-l-4 border-l-[var(--gold)]">
            <div className="label-text mb-2">Executed Clawbacks</div>
            <div className="font-display italic text-4xl text-[var(--gold)]">3</div>
         </div>
         <div className="glass-card p-6 border-l-4 border-l-[var(--emerald)]">
            <div className="label-text mb-2">Total Recovered</div>
            <div className="font-display italic text-4xl text-[var(--emerald)]">$650</div>
         </div>
      </div>

      <div className="glass-card overflow-hidden">
         <h3 className="p-6 border-b border-[var(--border-subtle)] font-bold font-body text-lg">Active Cases</h3>
         <div className="overflow-x-auto">
            <table className="data-table">
               <thead>
                 <tr>
                   <th>Case ID</th>
                   <th>Shopkeeper</th>
                   <th>Amount</th>
                   <th>Reason</th>
                   <th>Status</th>
                   <th>Action</th>
                 </tr>
               </thead>
               <tbody>
                  <tr>
                    <td className="font-mono">CB-9921</td>
                    <td>SK008 (Rahul's)</td>
                    <td className="text-[var(--gold)] font-bold">$200.00</td>
                    <td>Price Gouging</td>
                    <td><span className="badge badge-orange">Pending Review</span></td>
                    <td>
                      <button onClick={()=>setIsExecuteOpen(true)} className="btn-outline px-3 py-1 text-xs hover:border-[var(--emerald)] hover:text-[var(--emerald)] hover:bg-[rgba(52,211,153,0.1)]">Approve</button>
                    </td>
                  </tr>
                  <tr className="opacity-70">
                    <td className="font-mono">CB-9810</td>
                    <td>SK041 (Amin)</td>
                    <td className="text-[var(--gold)] font-bold">$150.00</td>
                    <td>Fraud</td>
                    <td><span className="badge badge-green">Executed</span></td>
                    <td><span className="text-gray-500 text-xs">View Tx</span></td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>

      {isInitiateModalOpen && (
        <div className="modal-overlay" onClick={()=>setIsInitiateModalOpen(false)}>
           <div className="modal-card glass-card border-[var(--red)] animate-modal-in" onClick={e=>e.stopPropagation()}>
              <h2 className="font-display italic text-3xl mb-6">Initiate Clawback</h2>
              
              <div className="bg-[rgba(239,68,68,0.1)] rounded-xl p-4 border border-[rgba(239,68,68,0.3)] flex gap-3 mb-6">
                 <AlertTriangle className="text-[var(--red)] shrink-0" />
                 <p className="text-sm text-gray-300">This action will forcibly recover funds from the shopkeeper's Stellar wallet back to the main relief pool. This is permanently recorded on the blockchain.</p>
              </div>

              <form className="space-y-4">
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">Target Shopkeeper</label>
                   <select className="glass-select"><option>SK008 - Rahul's Store</option></select>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1 flex justify-between">
                      <span>Amount to Clawback (USDC)</span>
                      <span className="text-[var(--gold)]">Max: $340.00</span>
                   </label>
                   <input type="number" className="glass-input" placeholder="200.00"/>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">Reason Code</label>
                   <select className="glass-select">
                     <option>Price Gouging</option>
                     <option>Fraud</option>
                     <option>Non-Delivery of Cash</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">Evidence Hash</label>
                   <input type="text" className="glass-input font-mono text-sm" placeholder="ipfs://qm..."/>
                 </div>

                 <div className="pt-6 flex gap-3">
                   <button type="button" onClick={()=>setIsInitiateModalOpen(false)} className="btn-outline flex-1">Cancel</button>
                   <button type="button" className="btn-red flex-1">Submit Case</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isExecuteOpen && (
        <div className="modal-overlay" onClick={()=>setIsExecuteOpen(false)}>
           <div className="modal-card glass-card border-[var(--emerald)] animate-modal-in text-center" onClick={e=>e.stopPropagation()}>
              <Zap className="mx-auto text-[var(--emerald)] animate-glow-pulse mb-6" size={64}/>
              <h2 className="font-display italic text-3xl mb-2">Execute Clawback?</h2>
              <p className="text-gray-400 mb-6">Admin approval required. The smart contract will immediately pull $200.00 USDC from the shopkeeper wallet.</p>
              
              <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] mb-6 text-left text-sm space-y-2">
                 <div className="flex justify-between"><span className="text-gray-500">Case ID</span><span className="font-mono">CB-9921</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">From Wallet</span><span className="font-mono truncate w-32">G...X9L2</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-[var(--gold)]">$200.00</span></div>
              </div>

              <div className="flex gap-3">
                 <button onClick={()=>setIsExecuteOpen(false)} className="btn-outline flex-1">Cancel</button>
                 <button onClick={()=>setIsExecuteOpen(false)} className="btn-gold flex-1 bg-[var(--emerald)] text-white hover:brightness-110 shadow-none border-none">Sign & Execute</button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
