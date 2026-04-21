"use client";


import Link from 'next/link';
import Image from 'next/image';

import { WalletConnect } from '@/components/ui/WalletConnect';
import SMSSimulator from '@/components/ui/SMSSimulator';
import { 
  Shield, Zap, Globe, Heart,
  ArrowRight, Lock, Users, 
  AlertTriangle, CheckCircle,
  WifiOff
} from 'lucide-react';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* SECTION 1 — FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[72px] bg-[rgba(10,10,10,0.8)] backdrop-blur-[20px] border-b border-[var(--border-subtle)] z-50 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ReliefMesh" width={32} height={32} className="rounded-lg" />
          <span className="font-display font-bold italic text-white text-xl">ReliefMesh</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-widest text-[rgba(255,255,255,0.5)]">
          <Link href="#how-it-works" className="hover:text-[var(--gold)] transition-colors">How It Works</Link>
          <Link href="#features" className="hover:text-[var(--gold)] transition-colors">For Charities</Link>
          <Link href="#features" className="hover:text-[var(--gold)] transition-colors">For Victims</Link>
          <Link href="/docs" className="hover:text-[var(--gold)] transition-colors text-[var(--gold)]">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <WalletConnect />
          <Link href="/dashboard" className="btn-gold py-2 px-4 text-xs font-semibold uppercase tracking-wider">Launch App</Link>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-4 overflow-hidden">
        
        <div className="glass-card px-4 py-2 border-[var(--gold)] rounded-full flex items-center gap-3 mb-12 animate-fade-in-up">
          <div className="status-dot status-dot-green"></div>
          <span className="text-[var(--emerald)] text-[8px] font-bold uppercase tracking-widest">LIVE</span>
          <span className="text-white text-xs">Stellar Testnet Active</span>
        </div>

        <h1 className="font-display italic text-[clamp(2.5rem,8vw,6rem)] leading-tight text-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">Relief That Reaches</span>
          <span className="gold-gradient-text block">Every Victim</span>
        </h1>

        <p className="font-body font-light text-lg md:text-xl text-[rgba(255,255,255,0.6)] text-center max-w-[560px] mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Bypass broken banks. Send digital aid directly to disaster victims via SMS. Powered by Stellar blockchain.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/onboard" className="btn-gold">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="btn-outline">
            Launch Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full max-w-3xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card rounded-full px-6 py-4 flex flex-1 items-center justify-center gap-3">
            <span className="text-[var(--gold)] font-bold font-display text-xl">$2.4M</span>
            <span className="text-[var(--text-secondary)] text-sm">Aid Distributed</span>
          </div>
          <div className="glass-card rounded-full px-6 py-4 flex flex-1 items-center justify-center gap-3">
            <span className="text-[var(--gold)] font-bold font-display text-xl">1,247</span>
            <span className="text-[var(--text-secondary)] text-sm">Victims Helped</span>
          </div>
          <div className="glass-card rounded-full px-6 py-4 flex flex-1 items-center justify-center gap-3">
            <span className="text-[var(--gold)] font-bold font-display text-xl">0%</span>
            <span className="text-[var(--text-secondary)] text-sm">Lost to Corruption</span>
          </div>
        </div>

        {/* Neural Connection Visual */}
        <div className="relative w-full max-w-4xl h-[400px] flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="glass-card w-[400px] h-[280px] rounded-3xl border-[var(--gold)] flex flex-col items-center justify-center relative z-10 animate-glow-pulse">
            <Shield className="text-[var(--gold)] mb-4" size={48} />
            <h3 className="font-display italic text-2xl text-white mb-2">ReliefMesh Network</h3>
            <p className="label-text mb-6">Active Relief Grid</p>
            <div className="grid grid-cols-2 gap-4 w-full px-8 text-xs text-white">
               <div className="flex items-center gap-2"><span>🟢</span> Pool Funded</div>
               <div className="flex items-center gap-2"><span>🟢</span> Victims Registered</div>
               <div className="flex items-center gap-2"><span>🟢</span> Shopkeepers Active</div>
               <div className="flex items-center gap-2"><span>🟢</span> Clawback Ready</div>
            </div>
          </div>
          
          <div className="hidden md:block absolute top-[10%] left-[5%] glass-card w-[220px] p-4 rounded-xl animate-float" style={{ animationDelay: '0s' }}>
            <div className="label-text mb-2 text-center">SMS Recipient</div>
            <div className="text-white text-sm text-center mb-1">+91 98765 XXXXX</div>
            <div className="text-[var(--gold)] text-sm font-bold text-center">Aid: $45 USDC</div>
          </div>

          <div className="hidden md:block absolute top-[15%] right-[5%] glass-card w-[240px] p-4 rounded-xl animate-float" style={{ animationDelay: '1s' }}>
            <div className="label-text mb-2 text-center">Local Shopkeeper</div>
            <div className="text-white text-sm text-center mb-1">Rahul's Store, Bihar</div>
            <div className="text-[var(--emerald)] text-sm font-bold text-center">Verified ✓</div>
          </div>

          <div className="hidden md:block absolute bottom-[5%] left-1/2 -translate-x-1/2 glass-card w-[200px] p-4 rounded-xl animate-float" style={{ animationDelay: '2s' }}>
            <div className="label-text mb-2 text-center">Clawback Active</div>
            <div className="text-white text-sm text-center mb-1">Protected Amount</div>
            <div className="text-[var(--gold)] text-sm font-bold text-center">$200 USDC</div>
          </div>
          
          <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
             <path d="M 200 120 L 450 200" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" opacity="0.5" fill="none"/>
             <path d="M 700 120 L 450 200" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" opacity="0.5" fill="none" style={{ animationDelay: '0.5s' }}/>
             <path d="M 450 350 L 450 200" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" opacity="0.5" fill="none" style={{ animationDelay: '1s' }}/>
             <defs>
               <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#c4a882" />
                 <stop offset="100%" stopColor="#8a7059" />
               </linearGradient>
             </defs>
          </svg>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="section relative">
        <p className="section-label label-text">THE PROCESS</p>
        <h2 className="section-heading text-white">How ReliefMesh Works (For Everyone)</h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          We ensure real people get the help they need in four simple, secure steps. You don't need to understand blockchain to use it.
        </p>

        <div className="grid-2">
          <div className="glass-card p-8">
            <div className="font-display font-bold text-5xl text-[var(--gold)] mb-6 opacity-80">01</div>
            <div className="icon-container mb-6"><Globe size={24} /></div>
            <h3 className="font-body font-bold text-xl text-white mb-3">Charities Pool Funds</h3>
            <p className="text-sm text-gray-400">Verified charities upload their relief funds into a secure, global digital vault. These funds can't be touched by anyone except the actual victims.</p>
          </div>
          
          <div className="glass-card p-8">
            <div className="font-display font-bold text-5xl text-[var(--gold)] mb-6 opacity-80">02</div>
            <div className="icon-container mb-6"><Users size={24} /></div>
            <h3 className="font-body font-bold text-xl text-white mb-3">Victims Enroll via SMS</h3>
            <p className="text-sm text-gray-400">People in disaster zones sign up using just a basic text message. Their identities are protected—no sensitive private data is ever exposed publicly.</p>
          </div>

          <div className="glass-card p-8">
            <div className="font-display font-bold text-5xl text-[var(--gold)] mb-6 opacity-80">03</div>
            <div className="icon-container mb-6"><Zap size={24} /></div>
            <h3 className="font-body font-bold text-xl text-white mb-3">Money Gets Sent Directly</h3>
            <p className="text-sm text-gray-400">Help is delivered straight to the victim's digital wallet in seconds. No waiting for banks, no standing in lines, and zero middlemen involved.</p>
          </div>

          <div className="glass-card p-8">
            <div className="font-display font-bold text-5xl text-[var(--gold)] mb-6 opacity-80">04</div>
            <div className="icon-container mb-6"><Shield size={24} /></div>
            <h3 className="font-body font-bold text-xl text-white mb-3">Safe & Local Exchange</h3>
            <p className="text-sm text-gray-400">Victims can exchange their digital funds for food, water, or cash at verified local shops. If a shop acts unfairly, our system easily pulls the money back to protect victims.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — SMS SIMULATION */}
      <section className="section bg-[rgba(167,139,113,0.02)] border-y border-[var(--border-subtle)]">
         <div className="container mx-auto px-6">
            <SMSSimulator />
         </div>
      </section>

      {/* SECTION 5 — FEATURES GRID */}
      <section id="features" className="section relative">
        <p className="section-label label-text">BUILT FOR CRISIS</p>
        <h2 className="section-heading text-white">Every Feature Matters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card glass-card-hover p-8 md:col-span-2">
            <WifiOff className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Works Offline</h3>
            <p className="text-gray-400 text-sm">SMS-based system works when internet is completely down. Victims can check balances and initiate cashouts without a smartphone or data connection.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 md:col-span-2">
            <Lock className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">ZK Identity Protection</h3>
            <p className="text-gray-400 text-sm">Victim personal details hashed on-chain. No data exposed to bad actors. Verifiable privacy that respects human dignity.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 sm:col-span-2">
            <AlertTriangle className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Clawback Protection</h3>
            <p className="text-gray-400 text-sm">Instant fund recovery from corrupt local distributors. Employs Stellar's built-in clawback powers.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 sm:col-span-2">
            <CheckCircle className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Verified Shopkeepers</h3>
            <p className="text-gray-400 text-sm">Trusted neighborhood stores act as secure cash-out points. Smart contracts enforce daily distribution limits to prevent hoarding.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 sm:col-span-2">
            <Globe className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Cross-Border USDC</h3>
            <p className="text-gray-400 text-sm">Send USDC globally. No FX fees. No bank account required by recipient. Settlement in seconds.</p>
          </div>

          <div className="glass-card glass-card-hover p-8 sm:col-span-2">
            <Heart className="text-[var(--gold)] mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Dignity First</h3>
            <p className="text-gray-400 text-sm">Victims receive aid with privacy, speed, and zero bureaucracy. Empowering recovery over standing in line.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — STATS WITH GLOW */}
      <section className="relative w-full py-24 mb-12">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-[800px] h-[400px] bg-[var(--gold)] rounded-full blur-[120px] opacity-[0.08]"></div>
        </div>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
           <div>
             <div className="font-display italic text-5xl md:text-6xl text-[var(--gold)] mb-4">$2.4M</div>
             <div className="label-text">Total Aid Distributed</div>
           </div>
           <div>
             <div className="font-display italic text-5xl md:text-6xl text-[var(--gold)] mb-4">1,247</div>
             <div className="label-text">Disaster Victims Helped</div>
           </div>
           <div>
             <div className="font-display italic text-5xl md:text-6xl text-[var(--gold)] mb-4">23</div>
             <div className="label-text">Active Disaster Zones</div>
           </div>
           <div>
             <div className="font-display italic text-5xl md:text-6xl text-[var(--gold)] mb-4">100%</div>
             <div className="label-text">Clawback Success Rate</div>
           </div>
        </div>
      </section>

      {/* SECTION 6 — CTA SECTION */}
      <section className="section pb-40">
        <div className="glass-card gold-border gold-glow p-12 md:p-20 text-center max-w-[700px] mx-auto rounded-3xl">
          <h2 className="font-display italic text-4xl md:text-[48px] text-white mb-6">Ready to Help?</h2>
          <p className="text-gray-400 text-base md:text-lg mb-10">
            Deploy ReliefMesh in your next disaster response operation. Efficient, accountable, and fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-gold btn-large">Deploy ReliefMesh</Link>
            <a href="https://github.com/reliefmesh" className="btn-outline btn-large">Read Documentation</a>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FOOTER */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="ReliefMesh" width={32} height={32} className="rounded-lg" />
                <span className="font-display font-bold italic text-white text-2xl">ReliefMesh</span>
              </Link>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">Connecting vital aid directly to victims. Zero-Corruption Guarantee, transparent tracking.</p>
              <div className="flex gap-4">
                 {/* Social placeholders */}
                 <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:gold-border text-gray-400 hover:text-[var(--gold)] transition-colors">𝕏</a>
                 <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:gold-border text-gray-400 hover:text-[var(--gold)] transition-colors">GH</a>
                 <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:gold-border text-gray-400 hover:text-[var(--gold)] transition-colors">DC</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><Link href="#how-it-works" className="hover:text-[var(--gold)] transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-[var(--gold)] transition-colors">For Charities</Link></li>
                <li><Link href="#" className="hover:text-[var(--gold)] transition-colors">For Victims</Link></li>
                <li><Link href="#" className="hover:text-[var(--gold)] transition-colors">Shopkeeper Network</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Developers</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><Link href="/docs" className="hover:text-[var(--gold)] transition-colors">Documentation</Link></li>
                <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Smart Contracts</a></li>
                <li><a href="#" className="hover:text-[var(--gold)] transition-colors">API</a></li>
                <li><a href="https://github.com/shashank121-arch/reliefmesh" className="hover:text-[var(--gold)] transition-colors">GitHub Repository</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Organization</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[var(--gold)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Mission</a></li>
                <li><a href="mailto:contact@reliefmesh.org" className="hover:text-[var(--gold)] transition-colors">Contact</a></li>
                <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSd7VAiR-8_yJbHhRH0kOUBNObSsxqm4P4gO9pLvjXwhiG6u3Q/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold)] transition-colors text-[var(--gold)]">Beta Feedback</a></li>
                <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Join Newsletter</h4>
              <div className="flex bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-xl overflow-hidden focus-within:border-[var(--gold)] transition-colors">
                 <input type="email" placeholder="hello@example.com" className="bg-transparent text-white px-4 py-3 flex-1 text-sm outline-none placeholder:text-gray-600" />
                 <button className="bg-[var(--gold-gradient)] text-black px-4 py-3 aspect-square flex items-center justify-center hover:brightness-110"><ArrowRight size={18}/></button>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
             <p>© 2025 ReliefMesh. Built on Stellar Soroban.</p>
             <p>Disaster Relief • Zero Corruption • Full Transparency</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
