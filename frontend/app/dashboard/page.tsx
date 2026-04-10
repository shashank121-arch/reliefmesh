"use client"
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { queryContract } from '@/lib/stellar';

export default function DashboardOverview() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [poolBalance, setPoolBalance] = useState("0");
  const [victimCount, setVictimCount] = useState(0);
  const [shopkeeperCount, setShopkeeperCount] = useState(0);
  const [pendingCases, setPendingCases] = useState(0);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        // Pool Balance
        const poolData = await queryContract({
          contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
          method: 'get_available_balance'
        });
        if (poolData) setPoolBalance((Number(poolData) / 10000000).toLocaleString(undefined, {minimumFractionDigits: 2}));

        // Victim Count
        const victimData = await queryContract({
          contractId: process.env.NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT_ID!,
          method: 'get_victim_count'
        });
        if (victimData !== null && victimData !== undefined) setVictimCount(Number(victimData));

        // Shopkeeper Count
        const skData = await queryContract({
          contractId: process.env.NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT_ID!,
          method: 'get_active_shopkeepers'
        });
        if (skData && Array.isArray(skData)) setShopkeeperCount(skData.length);

        // Distributions Array
        const distData = await queryContract({
          contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
          method: 'get_distributions_by_disaster',
          args: ["kerala2025"]
        });
        if (distData && Array.isArray(distData)) {
          // just taking the last 4
          setDistributions(distData.slice(-4).reverse());
        }

        // Pending Cases
        const pendingData = await queryContract({
          contractId: process.env.NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT_ID!,
          method: 'get_pending_cases'
        });
        if (pendingData && Array.isArray(pendingData)) setPendingCases(pendingData.length);

      } catch (e) {
        console.error("Dashboard data fetch error:", e);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display italic text-3xl mb-1">Good morning, Relief Coordinator</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span>{date}</span>
            <span className="text-[var(--border-subtle)]">|</span>
            <span className="text-[var(--gold)]">Operation: Kerala Flood 2025</span>
          </p>
        </div>
      </div>

      {/* ALERT BANNER */}
      {pendingCases > 0 && (
         <div className="glass-card border-[var(--orange)] bg-[rgba(245,158,11,0.05)] p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
               <AlertTriangle className="text-[var(--orange)]" size={20} />
               <span className="text-white text-sm font-medium">{pendingCases} Active Clawback Case(s) requires your attention</span>
            </div>
            <Link href="/dashboard/clawback" className="text-[var(--gold)] hover:underline text-sm font-medium flex items-center gap-1">
               View <ArrowRight size={14} />
            </Link>
         </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="label-text mb-2">Pool Balance</div>
          {fetching ? <Loader2 className="animate-spin text-[var(--gold)]" size={24} /> : (
            <div className="font-display italic text-3xl text-[var(--gold)]">${poolBalance} <span className="text-sm not-italic opacity-50">USDC</span></div>
          )}
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Victims Registered</div>
          {fetching ? <Loader2 className="animate-spin text-[var(--gold)]" size={24} /> : (
            <div className="font-display italic text-3xl text-[var(--gold)]">{victimCount}</div>
          )}
          <div className="text-[var(--emerald)] text-xs mt-2">Active on network</div>
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Total Aid Processed</div>
          <div className="font-display italic text-3xl text-[var(--gold)]">Tracking Live</div>
          <div className="text-gray-400 text-xs mt-2">from Soroban</div>
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Shopkeepers Active</div>
          {fetching ? <Loader2 className="animate-spin text-[var(--emerald)]" size={24} /> : (
            <div className="font-display italic text-3xl text-[var(--emerald)]">{shopkeeperCount} <span className="text-sm not-italic opacity-50 text-[var(--gold)]">Total</span></div>
          )}
          <div className="text-[var(--orange)] text-xs mt-2">0 Flagged today</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT DISTRIBUTIONS */}
        <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="font-body font-semibold text-lg">Recent Aid Distributions</h3>
            <Link href="/dashboard/distribute" className="text-[var(--gold)] text-sm hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto min-h-[220px]">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Victim ID</th>
                  <th>Amount</th>
                  <th className="desktop-only">Disaster</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr><td colSpan={4} className="text-center py-6"><Loader2 className="animate-spin text-[var(--gold)] mx-auto" /></td></tr>
                ) : distributions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-500">No recent distributions recorded.</td></tr>
                ) : distributions.map((dist, i) => (
                  <tr key={i}>
                    <td><div className="font-mono text-sm">{dist.victim_id || dist[1] || "-"}</div></td>
                    <td><div className="text-[var(--gold)] font-medium">${dist.amount ? Number(dist.amount)/10000000 : 0}.00</div></td>
                    <td className="desktop-only"><span className="badge badge-gold">Kerala 2025</span></td>
                    <td><span className="badge badge-green">Delivered</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVE DISASTERS */}
        <div className="glass-card p-6 flex flex-col h-full">
           <div className="label-text mb-4">Active Operations</div>
           <div className="space-y-4 flex-1">
              <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                 <h4 className="font-semibold text-sm mb-1">Kerala Flood 2025</h4>
                 <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
                   <span>Victims: {victimCount}/500</span>
                   <span className="text-[var(--gold)]">Live Coverage</span>
                 </div>
                 <div className="progress-bar">
                   <div className="progress-bar-fill" style={{ width: `${Math.min((victimCount / 500) * 100, 100)}%` }}></div>
                 </div>
              </div>
              <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] opacity-60">
                 <h4 className="font-semibold text-sm mb-1">Turkey Quake Relief</h4>
                 <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
                   <span>Archived</span>
                   <span className="text-gray-500">Completed</span>
                 </div>
                 <div className="progress-bar">
                   <div className="progress-bar-fill bg-gray-500 w-[100%]"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
