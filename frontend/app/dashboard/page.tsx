"use client"
import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
      <div className="glass-card border-[var(--orange)] bg-[rgba(245,158,11,0.05)] p-4 flex items-center justify-between animate-pulse">
         <div className="flex items-center gap-3">
            <AlertTriangle className="text-[var(--orange)]" size={20} />
            <span className="text-white text-sm font-medium">1 Active Clawback Case requires your attention</span>
         </div>
         <Link href="/dashboard/clawback" className="text-[var(--gold)] hover:underline text-sm font-medium flex items-center gap-1">
            View <ArrowRight size={14} />
         </Link>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="label-text mb-2">Pool Balance</div>
          <div className="font-display italic text-3xl text-[var(--gold)]">$24,500 <span className="text-sm not-italic opacity-50">USDC</span></div>
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Victims Registered</div>
          <div className="font-display italic text-3xl text-[var(--gold)]">127</div>
          <div className="text-[var(--emerald)] text-xs mt-2">+12 today</div>
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Aid Distributed Today</div>
          <div className="font-display italic text-3xl text-[var(--gold)]">$3,200</div>
          <div className="text-gray-400 text-xs mt-2">71 recipients</div>
        </div>
        <div className="glass-card p-6">
          <div className="label-text mb-2">Shopkeepers Active</div>
          <div className="font-display italic text-3xl text-[var(--emerald)]">8 <span className="text-sm not-italic opacity-50 text-[var(--gold)]">Total</span></div>
          <div className="text-[var(--orange)] text-xs mt-2">1 Flagged</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT DISTRIBUTIONS */}
        <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="font-body font-semibold text-lg">Recent Aid Distributions</h3>
            <Link href="/dashboard/distribute" className="text-[var(--gold)] text-sm hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Victim ID</th>
                  <th>Amount</th>
                  <th className="desktop-only">Disaster</th>
                  <th className="desktop-only">Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td><div className="font-mono text-sm">VIC-X{i}9A</div></td>
                    <td><div className="text-[var(--gold)] font-medium">$45.00</div></td>
                    <td className="desktop-only"><span className="badge badge-gold">Kerala 2025</span></td>
                    <td className="desktop-only text-sm">{i * 2} hours ago</td>
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
                   <span>Victims: 127/500</span>
                   <span className="text-[var(--gold)]">$5,715 / $25,000</span>
                 </div>
                 <div className="progress-bar">
                   <div className="progress-bar-fill w-[22%]"></div>
                 </div>
              </div>
              <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                 <h4 className="font-semibold text-sm mb-1">Turkey Quake Relief</h4>
                 <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
                   <span>Victims: 1120/2000</span>
                   <span className="text-[var(--gold)]">$112,000 / $200,000</span>
                 </div>
                 <div className="progress-bar">
                   <div className="progress-bar-fill w-[56%]"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* LIVE FEED */}
      <div className="glass-card p-6 border-[var(--gold)]">
         <div className="flex items-center gap-3 mb-4">
           <div className="status-dot status-dot-green"></div>
           <span className="label-text text-[var(--emerald)]">LIVE STELLAR EVENTS</span>
         </div>
         <div className="space-y-3 font-mono text-xs">
           <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border-l-2 border-[var(--emerald)]">
              <span className="text-gray-400">14:02:11</span>
              <span>Distribution Success: <span className="text-white">VIC-X19A</span></span>
              <span className="text-[var(--gold)]">+45 USDC</span>
           </div>
           <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border-l-2 border-[var(--emerald)]">
              <span className="text-gray-400">14:01:45</span>
              <span>Shopkeeper Cashout: <span className="text-white">SK008</span></span>
              <span className="text-[var(--gold)]">-45 USDC</span>
           </div>
           <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-3 rounded-lg border-l-2 border-[var(--blue)]">
              <span className="text-gray-400">13:58:20</span>
              <span>Victim Registered: <span className="text-white">Kerala 2025</span></span>
              <span className="text-gray-500">ZK-Hash Confirmed</span>
           </div>
         </div>
      </div>
    </div>
  );
}
