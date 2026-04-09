"use client"
import React, { useState } from 'react';
import { Lock, Search, PlusCircle } from 'lucide-react';

export default function VictimsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Victim Registry</h1>
          <p className="text-gray-400 flex items-center gap-2 text-sm">
            <Lock size={14} className="text-[var(--gold)]" />
            All identities protected by ZK commitment hashes.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold whitespace-nowrap">
          <PlusCircle size={18} /> Register Victim
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 glass-card p-4">
        <div className="flex-1 relative">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
           <input type="text" placeholder="Search by Victim ID..." className="glass-input pl-11 w-full" />
        </div>
        <select className="glass-select md:w-48">
          <option>All Disasters</option>
          <option>Kerala Flood 2025</option>
        </select>
        <select className="glass-select md:w-48">
          <option>All Status</option>
          <option>Active</option>
          <option>Funded</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
           <table className="data-table">
             <thead>
               <tr>
                 <th>Victim ID</th>
                 <th>Disaster</th>
                 <th>Aid Received</th>
                 <th>Balance Available</th>
                 <th>Status</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {[1,2,3,4,5].map(i => (
                 <tr key={i}>
                   <td className="font-mono">VIC-X{i}9A</td>
                   <td><span className="badge badge-gold">Kerala 2025</span></td>
                   <td className="text-white">$145.00</td>
                   <td className="text-[var(--gold)] font-bold">$45.00</td>
                   <td><span className="badge badge-green">Active</span></td>
                   <td><button className="text-sm text-gray-400 hover:text-[var(--gold)] transition-colors">View Details</button></td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card glass-card gold-border animate-modal-in" onClick={e => e.stopPropagation()}>
             <h2 className="font-display italic text-3xl mb-6">Register New Victim</h2>
             
             <form className="space-y-5">
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Disaster Operation</label>
                 <select className="glass-select"><option>Kerala Flood 2025</option></select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number (SMS Recipient)</label>
                 <input type="tel" className="glass-input" placeholder="+91 98765 43210" />
                 <p className="text-xs text-gray-500 mt-1 pl-1">Will be hashed (SHA-256) before on-chain storage.</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">National ID / Passport</label>
                 <input type="text" className="glass-input" placeholder="Enter ID number" />
                 <p className="text-xs text-gray-500 mt-1 pl-1">Will be bundled into a ZK commitment hash.</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Location / Ward</label>
                 <input type="text" className="glass-input" placeholder="Munnar District" />
               </div>

               <div className="bg-[rgba(167,139,113,0.1)] border border-[var(--border-gold)] rounded-xl p-4 flex gap-3 text-sm mt-6">
                  <Lock className="text-[var(--gold)] shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block text-[var(--gold)] mb-1">Identity Protected</strong>
                    <span className="text-gray-400">Personal details are NEVER stored on the blockchain. The smart contract only records demographic hashes to prevent double-spending while preserving human dignity.</span>
                  </div>
               </div>

               <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)] mt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline px-6 py-3">Cancel</button>
                 <button type="button" className="btn-gold px-8 py-3">Register & Hash Data</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
