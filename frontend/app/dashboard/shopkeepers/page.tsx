"use client"
import React, { useState } from 'react';
import { Store, AlertTriangle, CheckCircle, PlusCircle } from 'lucide-react';

export default function ShopkeepersPage() {
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Shopkeeper Network</h1>
          <p className="text-gray-400 text-sm">Verified local cash-out points with daily limits.</p>
        </div>
        <button className="btn-gold whitespace-nowrap">
          <PlusCircle size={18} /> Add Shopkeeper
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card glass-card-hover p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-white text-lg flex items-center gap-2">
                   Rahul's Store 
                   {i !== 3 ? <CheckCircle size={16} className="text-[var(--emerald)]" /> : null}
                 </h3>
                 <p className="text-sm text-gray-400">Kerala, Ward 12</p>
               </div>
               {i === 3 ? (
                 <span className="badge badge-orange text-[10px]">Flagged</span>
               ) : (
                 <span className="badge badge-green text-[10px]">Active</span>
               )}
            </div>

            <div className="mb-4 bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
               <div className="flex justify-between text-xs mb-2">
                 <span className="text-gray-400">Daily Cashout Limit</span>
                 <span className="text-[var(--gold)] font-mono">$300 / $1000</span>
               </div>
               <div className="progress-bar h-2">
                 <div className="progress-bar-fill w-[30%]"></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center mb-6 py-3 border-y border-[var(--border-subtle)]">
               <div>
                  <div className="label-text">Lifetime Processed</div>
                  <div className="font-mono text-white mt-1">$4,500</div>
               </div>
               <div className="border-l border-[var(--border-subtle)]">
                  <div className="label-text">Disputes</div>
                  <div className={`font-mono mt-1 ${i === 3 ? 'text-[var(--orange)]' : 'text-gray-500'}`}>{i === 3 ? 2 : 0}</div>
               </div>
            </div>

            <div className="mt-auto flex gap-3">
               <button className="btn-outline flex-1 py-2 text-xs">View Log</button>
               <button 
                 onClick={() => setIsFlagModalOpen(true)} 
                 className={`btn-gold flex-1 py-2 text-xs ${i === 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 Flag / Audit
               </button>
            </div>
          </div>
        ))}
      </div>

      {isFlagModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFlagModalOpen(false)}>
           <div className="modal-card glass-card border-[var(--orange)] animate-modal-in" onClick={e=>e.stopPropagation()}>
              <h2 className="font-display italic text-3xl mb-2 flex items-center gap-3">
                <AlertTriangle className="text-[var(--orange)]"/> Flag Shopkeeper
              </h2>
              <p className="text-sm text-gray-400 mb-6">Reporting misconduct or price gouging.</p>

              <form className="space-y-4">
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Reason for audit</label>
                   <select className="glass-select">
                     <option>Price Gouging (taking cut of aid)</option>
                     <option>Refusal of Service</option>
                     <option>No Cash Available</option>
                     <option>Fraudulent Transaction</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm text-gray-300 mb-1">Evidence / Description</label>
                   <textarea className="glass-textarea" placeholder="Victim VIC-X29A reported shopkeeper demanded a 20% cut of the $45 USDC aid to provide cash..."></textarea>
                 </div>

                 <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 mt-6">
                    <strong className="text-[var(--red)] block text-sm mb-1">Warning: Clawback Next Steps</strong>
                    <p className="text-xs text-gray-400">Flagging will suspend the shopkeeper's account. This is the first step before initiating a smart contract Clawback to recover stolen funds.</p>
                 </div>

                 <div className="pt-4 flex justify-end gap-3 mt-4">
                   <button type="button" onClick={() => setIsFlagModalOpen(false)} className="btn-outline">Cancel</button>
                   <button type="button" className="btn-red">Flag & Suspend</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
