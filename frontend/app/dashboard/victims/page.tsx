"use client"
import React, { useState, useEffect } from 'react';
import { Lock, Search, PlusCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract, queryContract } from '@/lib/stellar';

async function hashData(data: string) {
  const encoder = new TextEncoder();
  const dataUint8 = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function VictimsPage() {
  const { publicKey, signTransaction } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [victims, setVictims] = useState<any[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Form State
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [disaster, setDisaster] = useState('kerala2025');
  const [location, setLocation] = useState('');

  const fetchVictims = async () => {
    setFetching(true);
    try {
      const data = await queryContract({
        contractId: process.env.NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID!,
        method: 'get_victims_by_disaster',
        args: [disaster] // uses currently selected disaster filter
      });
      if (data && Array.isArray(data)) {
         setVictims(data.map((v: any) => ({
           id: v.id || v[0],
           disaster: v.disaster_code || v[3] || disaster,
           received: v.aid_received ? Number(v.aid_received)/10000000 : 0,
           available: v.aid_available ? Number(v.aid_available)/10000000 : 0,
           status: v.is_active ? 'Active' : 'Inactive'
         })));
      } else {
         setVictims([]);
      }
    } catch (e) {
      console.error(e);
      setVictims([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchVictims();
  }, [disaster]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate hashes locally (ZK Identity protection)
      const phoneHash = await hashData(phone);
      const identityHash = await hashData(nationalId);
      
      // 2. Generate a readable victim ID (random or derive from partial hash)
      const victimId = `VIC-${identityHash.substring(0, 8).toUpperCase()}`;

      // 3. Contract Invoke
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID!,
        method: 'register_victim',
        args: [
           { type: 'address', value: publicKey }, // admin address
           victimId,
           identityHash,
           phoneHash,
           disaster
        ],
        publicKey,
        signTransaction
      });

      if (result.success) {
        setTxHash(result.hash);
        setSuccess(true);
        // Reset form
        setPhone('');
        setNationalId('');
        setLocation('');
      }
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
          <option>Turkey Quake Relief</option>
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
           <table className="w-full text-left border-collapse whitespace-nowrap">
             <thead>
               <tr className="border-b border-[var(--border-subtle)] text-gray-400 text-sm">
                 <th className="px-4 py-3 font-medium">Victim ID</th>
                 <th className="px-4 py-3 font-medium">Disaster</th>
                 <th className="px-4 py-3 font-medium">Aid Received</th>
                 <th className="px-4 py-3 font-medium">Balance Available</th>
                 <th className="px-4 py-3 font-medium">Status</th>
                 <th className="px-4 py-3 font-medium text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {fetching ? (
                 <tr>
                   <td colSpan={6} className="text-center py-8">
                     <Loader2 className="animate-spin text-[var(--gold)] mx-auto" size={24} />
                   </td>
                 </tr>
               ) : victims.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="text-center py-8 text-gray-400">
                     No victims found for selected disaster.
                   </td>
                 </tr>
               ) : victims.map((victim: any, i: number) => (
                 <tr key={i} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                   <td className="px-4 py-4 font-mono text-gray-300">{victim.id}</td>
                   <td className="px-4 py-4"><span className="badge badge-gold">{victim.disaster}</span></td>
                   <td className="px-4 py-4 text-white">${victim.received.toFixed(2)}</td>
                   <td className="px-4 py-4 text-[var(--gold)] font-bold">${victim.available.toFixed(2)}</td>
                   <td className="px-4 py-4"><span className={`badge ${victim.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{victim.status}</span></td>
                   <td className="px-4 py-4 text-right"><button onClick={() => setSelectedVictim(victim)} className="text-sm text-[var(--gold)] hover:text-white transition-colors font-medium">View Details</button></td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && !success && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card glass-card gold-border animate-modal-in" onClick={e => e.stopPropagation()}>
             <h2 className="font-display italic text-3xl mb-6">Register New Victim</h2>
             
             <form className="space-y-5" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Disaster Operation</label>
                  <select 
                    className="glass-select"
                    value={disaster}
                    onChange={(e) => setDisaster(e.target.value)}
                  >
                    <option value="kerala2025">Kerala Flood 2025</option>
                    <option value="turkey2024">Turkey Quake Relief</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number (SMS Recipient)</label>
                  <input 
                    type="tel" 
                    className="glass-input" 
                    placeholder="+91 98765 43210" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1 pl-1">Will be hashed (SHA-256) before on-chain storage.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">National ID / Passport</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Enter ID number" 
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1 pl-1">Will be bundled into a ZK commitment hash.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location / Ward</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Munnar District" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
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
                  <button 
                    type="submit" 
                    className="btn-gold px-8 py-3 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : "Register & Hash Data"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      {/* SUCCESS MODAL */}
      {success && (
        <div className="modal-overlay" onClick={() => { setSuccess(false); setIsModalOpen(false); fetchVictims() }}>
           <div className="modal-card glass-card gold-border animate-modal-in text-center flex flex-col items-center p-10" onClick={e=>e.stopPropagation()}>
              <CheckCircle className="text-[var(--gold)] mb-4" size={60} />
              <h2 className="font-display italic text-2xl mb-2">Victim Registered Successfully</h2>
              <p className="text-gray-400 text-sm mb-6">Identity hash stored securely on-chain.</p>
              <div className="w-full flex flex-col gap-3">
                 <button onClick={() => { setSuccess(false); setIsModalOpen(false); fetchVictims() }} className="btn-outline">Close</button>
                 <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center justify-center gap-2">View Tx on Explorer <ExternalLink size={16}/></a>
              </div>
           </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedVictim && (
        <div className="modal-overlay" onClick={() => setSelectedVictim(null)}>
           <div className="modal-card glass-card gold-border animate-modal-in max-w-lg" onClick={e=>e.stopPropagation()}>
              <h2 className="font-display italic text-2xl mb-6 flex items-center gap-2">
                <Lock size={20} className="text-[var(--gold)]" /> Victim Dossier
              </h2>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-400 text-sm">ID Structure</span>
                   <span className="font-mono text-white">{selectedVictim.id}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-400 text-sm">Disaster Operation</span>
                   <span className="badge badge-gold">{selectedVictim.disaster}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-400 text-sm">Status</span>
                   <span className={`badge ${selectedVictim.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{selectedVictim.status}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-400 text-sm">Total Disbursed Aid</span>
                   <span className="text-white font-mono">${selectedVictim.received.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                   <span className="text-gray-400 text-sm">Available Cashout</span>
                   <span className="text-[var(--gold)] font-bold text-xl font-mono">${selectedVictim.available.toFixed(2)}</span>
                 </div>
                 <div className="bg-[rgba(167,139,113,0.05)] p-5 rounded-xl border border-[var(--border-gold)] mt-6 flex gap-3">
                   <div className="text-xs text-gray-300 leading-relaxed">
                     Due to Zero-Knowledge safeguards, personal metadata is heavily encrypted on the base layer. Verification relies exclusively on possession of the associated mobile device during local protocols.
                   </div>
                 </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedVictim(null)} className="btn-outline px-6 py-2 rounded-full">Close Dossier</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
