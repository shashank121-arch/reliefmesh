"use client";
import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function WalletConnect({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { connected, walletType, publicKey, xlmBalance, usdcBalance, connectFreighter, connectAlbedo, connectManual } = useWallet();
  const [manualKey, setManualKey] = useState("");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-card gold-border animate-modal-in" onClick={(e) => e.stopPropagation()}>
        {!connected ? (
          <>
            <div className="text-center mb-8">
              <h2 className="font-display italic text-2xl mb-2">Connect Wallet</h2>
              <p className="label-text">Access the ReliefMesh network</p>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={connectFreighter} className="glass-card glass-card-hover p-6 flex items-center justify-between hover:gold-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center border border-blue-500">
                    <span className="text-xl font-bold">F</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Freighter</div>
                    <div className="text-sm text-gray-400">Browser Extension · Recommended</div>
                  </div>
                </div>
                <ArrowRight className="text-[var(--gold)]" size={20} />
              </button>

              <button onClick={connectAlbedo} className="glass-card glass-card-hover p-6 flex items-center justify-between hover:gold-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center border border-purple-500">
                    <span className="text-xl font-bold">A</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Albedo</div>
                    <div className="text-sm text-gray-400">Web-based · No Installation</div>
                  </div>
                </div>
                <ArrowRight className="text-[var(--gold)]" size={20} />
              </button>
            </div>

            <div className="my-6 text-center text-sm text-gray-500 relative">
              <span className="bg-[var(--bg-elevated)] px-4 relative z-10">or continue with</span>
              <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--border-subtle)] -z-0"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Stellar public key..."
                className="glass-input flex-1"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
              />
              <button 
                onClick={() => connectManual(manualKey)}
                className="btn-gold px-6"
              >
                Go
              </button>
            </div>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-400">New to Stellar? </span>
              <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
                Get Freighter
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="text-[var(--gold)] mx-auto mb-4 animate-glow-pulse" size={64} />
            <h2 className="font-display italic text-2xl mb-4">Wallet Connected</h2>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1 truncate">{publicKey}</div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">XLM</div>
                  <div className="font-semibold">{xlmBalance}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">USDC</div>
                  <div className="font-semibold text-[var(--gold)]">{usdcBalance}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
               <button onClick={onClose} className="btn-outline flex-1">Close</button>
               <Link href="/dashboard" className="btn-gold flex-1" onClick={onClose}>Enter App</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
