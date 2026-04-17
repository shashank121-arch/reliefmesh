"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Shield, Code, Server, CheckCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-body pb-32">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[72px] bg-[rgba(10,10,10,0.8)] backdrop-blur-[20px] border-b border-[var(--border-subtle)] z-50 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ReliefMesh" width={32} height={32} className="rounded-lg" />
          <span className="font-display font-bold italic text-white text-xl">ReliefMesh</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--gold)] hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto pt-32 px-6">
        <div className="mb-12 border-b border-[var(--border-subtle)] pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="icon-container w-12 h-12">
              <BookOpen className="text-[var(--gold)]" size={24} />
            </div>
            <h1 className="font-display italic text-5xl text-white">ReliefMesh Documentation</h1>
          </div>
          <p className="text-xl text-gray-400">
            A comprehensive guide to the decentralized architecture, privacy-preserving zero-knowledge protocols, and Soroban smart contracts powering ReliefMesh.
          </p>
        </div>

        <div className="space-y-16">
          {/* SECTION 1 */}
          <section className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="text-[var(--gold)]" /> 1. System Overview
            </h2>
            <div className="glass-card p-8 space-y-4 leading-relaxed">
              <p>
                <strong>ReliefMesh</strong> is a decentralized financial router designed to bypass corrupt bureaucratic bottlenecks during natural disasters. Instead of sending pallets of physical cash or routing funds through opaque central banks, relief agencies (Admins) deposit stablecoins (USDC) into an on-chain Relief Pool.
              </p>
              <p>
                From the Command Center Dashboard, Admins can route funds directly to affected victims. Victims withdraw these funds as local physical fiat from established, vetted Shopkeepers (local grocers or merchants). Every single transaction is settled on the Stellar ledger in ~4 seconds at a fraction of a cent.
              </p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Code className="text-[var(--gold)]" /> 2. Smart Contract Architecture
            </h2>
            <div className="space-y-6">
              <div className="glass-card p-6 border-l-4 border-[var(--gold)]">
                <h3 className="text-lg font-bold text-white mb-2">ReliefPool (Vault)</h3>
                <p className="text-sm">
                  Acts as the master escrow. Organizations fund the pool. When an admin executes `distribute_aid`, the Pool locks USDC for the victim's immediate claim.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-[#3b82f6]">
                <h3 className="text-lg font-bold text-white mb-2">VictimRegistry (Identity)</h3>
                <p className="text-sm">
                  Stores cryptographic hashes of victim identities (Zero-Knowledge Commitments). No human-readable PII (Names, Phone Numbers, ID cards) is ever committed to the ledger, protecting vulnerable refugees while maintaining Sybil resistance.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-[#10b981]">
                <h3 className="text-lg font-bold text-white mb-2">ShopkeeperRegistry (Agents)</h3>
                <p className="text-sm">
                  Maintains the decentralized network of verified cash-out points. Tracks their total daily liquidity limits, processed volume, and dispute counts. Shopkeepers act as the "last mile" to convert stablecoins into physical cash.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-[#f59e0b]">
                <h3 className="text-lg font-bold text-white mb-2">ClawbackController (Governance)</h3>
                <p className="text-sm">
                  Empowered by Stellar's Native Clawback Asset feature. If a shopkeeper defrauds a victim or attempts to charge exorbitant fees ("price gouging"), the Admin can execute an irrevocable clawback, ripping the stolen USDC out of the malicious shopkeeper's balance and restoring it to the Relief Pool.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Server className="text-[var(--gold)]" /> 3. Data Integrity & ZK Privacy
            </h2>
            <div className="glass-card p-8">
              <p className="mb-4">
                Public ledgers are immutable, which makes them dangerous for storing refugee and victim details. If a malicious actor knew an individual just received $5,000 in aid, it poses a severe physical security risk to the victim.
              </p>
              <ul className="space-y-3 mt-6">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[var(--gold)] shrink-0 mt-0.5" />
                  <span><strong>Client-Side Hashing:</strong> Before data leaves the browser, Identity & Phone Numbers are hashed via `crypto.subtle.digest(SHA-256)`.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[var(--gold)] shrink-0 mt-0.5" />
                  <span><strong>On-Chain Verification:</strong> The smart contract only stores the `identity_hash` string. Claim generation simply requires the user to prove they know the pre-image.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[var(--gold)] shrink-0 mt-0.5" />
                  <span><strong>Anonymous Routing:</strong> When "Distribute Aid" is clicked, USDC is technically credited to a mathematically derived Victim ID, completely isolated from real-world identities.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-bold text-white mb-6">4. Tech Stack Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-6">
                <h4 className="font-bold text-[var(--gold)] mb-2">Frontend Options</h4>
                <ul className="text-sm space-y-2">
                  <li>• Next.js 16.2 (App Router)</li>
                  <li>• Tailwind CSS v4 & PostCSS</li>
                  <li>• Lucide React (Iconography)</li>
                  <li>• Radix UI (Headless Primitives)</li>
                </ul>
              </div>
              <div className="glass-card p-6">
                <h4 className="font-bold text-[var(--gold)] mb-2">Blockchain Core</h4>
                <ul className="text-sm space-y-2">
                  <li>• Stellar Soroban Rust SDK</li>
                  <li>• 100% Wasm Compact Builds</li>
                  <li>• Horizon EventSource Streams</li>
                  <li>• Freighter Wallet Interop</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
