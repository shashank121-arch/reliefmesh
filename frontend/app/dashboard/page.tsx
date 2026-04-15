"use client"
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, Heart, DollarSign, Activity, Smartphone, Signal, Zap } from 'lucide-react';
import Link from 'next/link';
import { queryContract, streamTransactions } from '@/lib/stellar';
import { useWallet } from '@/context/WalletContext';
import SMSSimulator from '@/components/ui/SMSSimulator';
import { StatSkeleton, TableRowSkeleton, FeedSkeleton } from '@/components/ui/skeleton';

export default function DashboardOverview() {
  const { publicKey } = useWallet();
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [poolBalance, setPoolBalance] = useState("0");
  const [victimCount, setVictimCount] = useState(0);
  const [shopkeeperCount, setShopkeeperCount] = useState(0);
  const [pendingCases, setPendingCases] = useState(0);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Stats Fetching
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const poolData = await queryContract({ contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!, method: 'get_available_balance' });
        if (poolData) setPoolBalance((Number(poolData) / 10000000).toLocaleString(undefined, {minimumFractionDigits: 2}));

        const victimData = await queryContract({ contractId: process.env.NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID!, method: 'get_victim_count' });
        if (victimData !== null) setVictimCount(Number(victimData));

        const skData = await queryContract({ contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!, method: 'get_active_shopkeepers' });
        if (skData && Array.isArray(skData)) setShopkeeperCount(skData.length);

        const distData = await queryContract({ contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!, method: 'get_distributions_by_disaster', args: ["kerala2025"] });
        if (distData && Array.isArray(distData)) setDistributions(distData.slice(-4).reverse());

        const pendingData = await queryContract({ contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!, method: 'get_pending_cases' });
        if (pendingData && Array.isArray(pendingData)) setPendingCases(pendingData.length);
      } catch (e) {
        console.error("Dashboard stats error:", e);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  // Live Feed Stream
  useEffect(() => {
    if (!publicKey) return;
    setIsLive(true);
    const cleanup = streamTransactions(publicKey, (tx) => {
      setLiveFeed(prev => [tx, ...prev].slice(0, 10));
    });
    return () => {
      cleanup();
      setIsLive(false);
    };
  }, [publicKey]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="font-display italic text-3xl mb-1 text-white">Coordinator Dashboard</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span>{date}</span> <span className="opacity-30">|</span> <span className="text-[var(--gold)]">Op: Kerala Flood Relief</span>
          </p>
        </div>
        {!publicKey && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-red-900/30 px-4 py-2 rounded-lg text-xs text-red-500 animate-pulse">
            Connect Admin Wallet for Live Sync
          </div>
        )}
      </div>

      {/* ALERT */}
      {pendingCases > 0 && (
         <div className="glass-card border-[var(--orange)] bg-[rgba(245,158,11,0.05)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <AlertTriangle className="text-[var(--orange)]" size={20} />
               <span className="text-white text-sm">{pendingCases} Disputed Case(s) Pending Oversight</span>
            </div>
            <Link href="/dashboard/clawback" className="btn-gold py-1 px-4 text-xs">Resolve Now</Link>
         </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {fetching ? (
           <>
             <StatSkeleton />
             <StatSkeleton />
             <StatSkeleton />
             <StatSkeleton />
           </>
         ) : (
           <>
             <StatCard label="Pool Available" value={`$${poolBalance}`} sub="USDC" color="gold" />
             <StatCard label="Victims Registered" value={victimCount} sub="Verified Citizens" color="gold" />
             <StatCard label="Dispute Rate" value={`${pendingCases}`} sub="Active Cases" color="red" />
             <StatCard label="Shopkeeper Hubs" value={shopkeeperCount} sub="Local Partners" color="emerald" />
           </>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass-card flex flex-col h-full min-h-[400px]">
              <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <h3 className="font-semibold text-white">Recent Distributions</h3>
                <Link href="/dashboard/distribute" className="text-xs text-[var(--gold)] hover:underline flex items-center gap-1">New Distribution <ArrowRight size={14}/></Link>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-gray-400">
                      <th className="pb-3 px-4 font-medium">Identity Hash</th>
                      <th className="pb-3 px-4 font-medium">Amount</th>
                      <th className="pb-3 px-4 font-medium">Timestamp</th>
                      <th className="pb-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {fetching ? (
                       <tr>
                         <td colSpan={4} className="p-0">
                           <TableRowSkeleton />
                           <TableRowSkeleton />
                           <TableRowSkeleton />
                           <TableRowSkeleton />
                         </td>
                       </tr>
                    ) : distributions.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-20 text-gray-600 italic">No records found for current disaster.</td></tr>
                    ) : distributions.map((dist, i) => {
                      const vid = dist.victim_id || dist[1] || "Unknown";
                      const amountRaw = dist.amount || dist[3] || 0;
                      const dateRaw = dist.distributed_at || dist[5] || 0;
                      return (
                        <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[rgba(255,255,255,0.02)]">
                          <td className="py-3 px-4 font-mono text-gray-300">{String(vid).slice(0,12)}...</td>
                          <td className="py-3 px-4 text-[var(--gold)] font-bold">${(Number(amountRaw)/10000000).toFixed(2)}</td>
                          <td className="py-3 px-4 text-gray-500">{new Date(Number(dateRaw)*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="py-3 px-4"><span className="badge badge-green">On-Chain ✓</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
           </div>

           {/* SMS SIMULATOR SECTION */}
           <div className="glass-card p-8 border-[var(--border-subtle)]">
             <SMSSimulator />
           </div>
        </div>

        {/* LIVE ACTIVITY FEED */}
        <div className="glass-card flex flex-col h-full">
           <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Live Operations</h3>
                {isLive ? (
                   <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] animate-pulse"></div>
                      <span className="text-[8px] font-bold text-[var(--emerald)] uppercase tracking-tighter">Live</span>
                   </div>
                ) : (
                  <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Syncing...</span>
                )}
              </div>
              <Activity size={14} className="text-gray-500" />
           </div>
           
           <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {liveFeed.length === 0 ? (
                <div className="flex flex-col h-full py-4 space-y-6">
                   <div className="flex items-center gap-2 mb-4">
                     <Signal size={12} className="text-gray-700 animate-pulse" />
                     <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Initializing...</span>
                   </div>
                   <FeedSkeleton />
                </div>
              ) : liveFeed.map((tx, i) => (
                <a key={i} href={tx.explorerUrl} target="_blank" className="block glass-card p-3 border-none bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all group">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'aid_distributed' ? 'bg-[rgba(167,139,113,0.1)] text-[var(--gold)]' :
                        tx.type === 'pool_funded' ? 'bg-[rgba(16,185,129,0.1)] text-[var(--emerald)]' :
                        tx.type === 'clawback' ? 'bg-[rgba(239,68,68,0.1)] text-[var(--red)]' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {tx.type === 'aid_distributed' && <Heart size={14}/>}
                        {tx.type === 'pool_funded' && <DollarSign size={14}/>}
                        {tx.type === 'clawback' && <AlertTriangle size={14}/>}
                        {tx.type === 'transaction' && <Activity size={14}/>}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[11px] font-bold text-white capitalize">{tx.type.replace('_',' ')}</div>
                        <div className="text-[9px] text-gray-500 truncate">{tx.memo}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[9px] text-[var(--gold)] font-mono">{tx.hash}</div>
                         <div className="text-[8px] text-gray-600">Recently</div>
                      </div>
                   </div>
                </a>
              ))}
           </div>

           <div className="p-4 border-t border-[var(--border-subtle)]">
              <Link href="/onboard" className="btn-outline w-full py-2 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                 Join Network Monitor <Smartphone size={12}/>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: any) {
  const colorMap: any = {
    gold: 'text-[var(--gold)]',
    emerald: 'text-[var(--emerald)]',
    red: 'text-[var(--red)]'
  };
  return (
    <div className="glass-card p-6">
      <div className="label-text mb-2 opacity-60 uppercase">{label}</div>
      <div className={`font-display italic text-3xl ${colorMap[color] || 'text-white'}`}>{value}</div>
      <div className="text-gray-500 text-[10px] mt-2 uppercase tracking-widest">{sub}</div>
    </div>
  );
}
