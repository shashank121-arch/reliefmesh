"use client"
import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Zap, Loader2, CheckCircle, ArrowRight, ClipboardList, Gavel, Play } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract, queryContract } from '@/lib/stellar';
import { TableRowSkeleton } from '@/components/ui/skeleton';

export default function ClawbackPage() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [step, setStep] = useState(1); // 1: Initiate, 2: Approve, 3: Execute, 4: Complete
  
  // State Data
  const [cases, setCases] = useState<any[]>([]);
  const [totalRecovered, setTotalRecovered] = useState("0");
  const [currentCaseId, setCurrentCaseId] = useState('');
  const [txHash, setTxHash] = useState('');

  // Form State
  const [shopkeeperId, setShopkeeperId] = useState('SHOP-001');
  const [shopkeeperWallet, setShopkeeperWallet] = useState('');
  const [amount, setAmount] = useState('150.00');
  const [reason, setReason] = useState('Price Gouging');
  const [evidence, setEvidence] = useState('ipfs://QmXP2...');

  const fetchStats = async () => {
    setFetching(true);
    try {
      const total = await queryContract({
        contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
        method: 'get_total_recovered'
      });
      if (total) setTotalRecovered((Number(total) / 10000000).toString());
      
      const pending = await queryContract({
        contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
        method: 'get_pending_cases'
      });
      if (pending && Array.isArray(pending)) setCases(pending);
    } catch(err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
        method: 'initiate_clawback',
        args: [
           publicKey,
           shopkeeperId,
           shopkeeperWallet || publicKey, // For demo, use own wallet if empty
           { type: 'i128', value: BigInt(Math.floor(parseFloat(amount) * 10000000)) },
           reason,
           evidence
        ],
        publicKey,
        signTransaction
      });

      if (result.success) {
        // In a real app we'd extract the case ID from events
        // For Level 3 demo, we'll generate/simulate the ID if not returned
        setCurrentCaseId(`CASE-${Math.floor(Math.random() * 9000) + 1000}`);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert("Initiation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
        method: 'approve_clawback',
        args: [publicKey, currentCaseId],
        publicKey,
        signTransaction
      });
      if (result.success) setStep(3);
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
        method: 'execute_clawback',
        args: [publicKey, currentCaseId],
        publicKey,
        signTransaction
      });
      if (result.success) {
        setTxHash(result.hash);
        setStep(4);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      alert("Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display italic text-4xl mb-2">Clawback Controller</h1>
          <p className="text-gray-400">Programmable fund recovery for anti-corruption oversight.</p>
        </div>
        <div className="text-right">
          <div className="label-text mb-1 text-[var(--emerald)]">Total Recovered</div>
          <div className="text-3xl font-display italic text-white">${totalRecovered} USDC</div>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="glass-card p-6 flex justify-between items-center relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-1 bg-[var(--gold-gradient)] transition-all duration-500`} style={{ width: `${(step / 4) * 100}%` }}></div>
        
        <StepIcon icon={<ClipboardList size={20}/>} label="Initiate" active={step >= 1} current={step === 1} completed={step > 1} />
        <div className="flex-1 h-px bg-[var(--border-subtle)] mx-4"></div>
        <StepIcon icon={<ShieldCheck size={20}/>} label="Approve" active={step >= 2} current={step === 2} completed={step > 2} />
        <div className="flex-1 h-px bg-[var(--border-subtle)] mx-4"></div>
        <StepIcon icon={<Gavel size={20}/>} label="Execute" active={step >= 3} current={step === 3} completed={step > 3} />
        <div className="flex-1 h-px bg-[var(--border-subtle)] mx-4"></div>
        <StepIcon icon={<CheckCircle size={20}/>} label="Complete" active={step >= 4} current={step === 4} completed={step > 4} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {step === 1 && (
            <div className="glass-card p-8 animate-fade-in">
              <h2 className="text-2xl font-display italic mb-6">Step 1: Open Dispute Case</h2>
              <form onSubmit={handleInitiate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 uppercase">Shopkeeper ID</label>
                    <input type="text" className="glass-input" value={shopkeeperId} onChange={e=>setShopkeeperId(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 uppercase">Amount (USDC)</label>
                    <input type="number" className="glass-input" value={amount} onChange={e=>setAmount(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 uppercase">Shopkeeper Wallet</label>
                  <input type="text" className="glass-input font-mono text-sm" placeholder="G..." value={shopkeeperWallet} onChange={e=>setShopkeeperWallet(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 uppercase">Dispute Reason</label>
                  <select className="glass-select" value={reason} onChange={e=>setReason(e.target.value)}>
                    <option>Price Gouging</option>
                    <option>Identity Fraud</option>
                    <option>Service Not Rendered</option>
                  </select>
                </div>
                <button type="submit" className="btn-gold w-full py-4 flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={20}/> : "Initiate On-Chain Dispute"}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="glass-card p-8 animate-fade-in text-center">
              <ShieldCheck className="mx-auto text-[var(--gold)] mb-4" size={60} />
              <h2 className="text-2xl font-display italic mb-2">Step 2: Administrative Approval</h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">Case <span className="text-white font-mono">{currentCaseId}</span> is pending review. Authorized governors must sign to authorize the clawback.</p>
              
              <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] rounded-xl p-6 text-left mb-8">
                 <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-500">Shopkeeper</span><span className="text-white">{shopkeeperId}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                   <span className="text-gray-500">Amount</span><span className="text-[var(--gold)] font-bold">${amount} USDC</span>
                 </div>
                 <div className="flex justify-between py-2">
                   <span className="text-gray-500">Signatures Policy</span><span className="text-white">Admin Required</span>
                 </div>
              </div>

              <button onClick={handleApprove} className="btn-gold w-full py-4 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={20}/> : "Approve Recovery Request"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="glass-card p-8 animate-fade-in text-center">
              <Zap className="mx-auto text-[var(--red)] animate-glow-pulse mb-6" size={60} />
              <h2 className="text-2xl font-display italic mb-2">Step 3: Execute Recovery</h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">Authentication passed. Finalizing the transaction will atomatically pull funds from the destination wallet.</p>
              
              <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 flex gap-3 text-left mb-8">
                <AlertTriangle className="text-[var(--red)] shrink-0" size={20} />
                <p className="text-xs text-gray-300">This action utilizes Stellar's clawback-enabled trustlines to bypass individual authorization and enforce accountability.</p>
              </div>

              <button onClick={handleExecute} className="btn-red w-full py-4 bg-red-600 text-white rounded-full flex items-center justify-center gap-2 font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={20}/> : "Finalize & Recover Funds"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="glass-card p-8 animate-fade-in text-center">
              <CheckCircle className="mx-auto text-[var(--emerald)] mb-6" size={80} />
              <h2 className="text-3xl font-display italic mb-2">Funds Recovered</h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">Dispute closed. ${amount} USDC has been returned to the Relief Pool. Accountability established.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" className="btn-outline flex items-center justify-center gap-2 text-xs">View Tx <ArrowRight size={14}/></a>
                <button onClick={() => setStep(1)} className="btn-gold text-xs">New Case</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[var(--gold)]" /> Governance Rules
            </h3>
            <ul className="text-sm space-y-3 text-gray-400">
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--gold)] mt-2 shrink-0"></div>
                Clawbacks can only be initiated by authorized charity admins.
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--gold)] mt-2 shrink-0"></div>
                Evidence must be attached as an IPFS hash for audit trails.
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--gold)] mt-2 shrink-0"></div>
                Maximum recovery period is 12 months after distribution.
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 border-l-2 border-l-[var(--orange)]">
             <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-[var(--orange)] uppercase tracking-widest">Active Cases</span>
               <span className="text-white text-sm">{cases.length} pending</span>
             </div>
             <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
               {fetching ? (
                 <>
                   <TableRowSkeleton />
                   <TableRowSkeleton />
                 </>
               ) : cases.length === 0 ? (
                 <p className="text-xs text-gray-500 italic">No other pending cases.</p>
               ) : (
                 cases.map((c, i) => (
                   <div key={i} className="text-xs bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)] flex justify-between">
                     <div>
                       <div className="text-white font-mono">{c[0] || 'CASE-X'}</div>
                       <div className="text-gray-500">Shop: {c[1]}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-[var(--gold)]">${Number(c[3])/10000000}.00</div>
                       <div className="text-gray-500 text-[10px]">Awaiting Signatures</div>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ icon, label, active, current, completed }: { icon: any, label: string, active: boolean, current: boolean, completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 z-10">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
        completed ? 'bg-[var(--emerald)] text-black' : 
        current ? 'bg-[var(--gold)] text-black shadow-[0_0_15px_rgba(167,139,113,0.4)]' : 
        'bg-[var(--bg-elevated)] text-gray-500 border border-[var(--border-subtle)]'
      }`}>
        {completed ? <CheckCircle size={24}/> : icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
}
