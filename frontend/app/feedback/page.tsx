"use client"
import React from 'react';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-4xl mx-auto py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--gold)] transition-colors mb-12 text-sm font-semibold uppercase tracking-widest">
           <ArrowLeft size={16}/> Back to Home
        </Link>
        
        <header className="mb-12 text-center">
           <h1 className="font-display italic text-5xl md:text-6xl text-white mb-4">Share Your <span className="gold-gradient-text">Feedback</span></h1>
           <p className="text-gray-400 max-w-lg mx-auto">Help us refine the ReliefMesh protocol. Your insights drive the next iteration of decentralized aid delivery.</p>
        </header>

        <div className="glass-card p-4 md:p-8 gold-border gold-glow">
           <div className="flex items-center gap-3 mb-8 px-4">
              <div className="p-3 rounded-xl bg-[rgba(167,139,113,0.1)] text-[var(--gold)]">
                 <MessageSquare size={24} />
              </div>
              <div>
                 <h3 className="text-white font-semibold">ReliefMesh Beta Survey</h3>
                 <p className="text-xs text-gray-500">Takes approximately 2 minutes to complete.</p>
              </div>
           </div>

           <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 min-h-[800px] relative">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSfD_lS_B_I7NndjL8qFpDEXXv-qR7E3QWl2O-96VfCqU_e_0A/viewform?embedded=true"
                width="100%"
                height="800"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                style={{
                  borderRadius: '16px',
                  background: 'transparent'
                }}
              >
                Loading feedback form...
              </iframe>
           </div>
        </div>
        
        <div className="mt-12 text-center">
           <p className="text-gray-600 text-xs font-mono uppercase tracking-widest">Your feedback is strictly used for platform optimization and hackathon evaluation.</p>
        </div>
      </div>
    </div>
  );
}
