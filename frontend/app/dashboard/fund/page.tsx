"use client"
import React, { useState, useEffect } from 'react';
import { DollarSign, ExternalLink, ArrowRight, Loader2, CheckCircle, AlertTriangle, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { invokeContract, queryContract } from '@/lib/stellar';
import { Address } from '@stellar/stellar-sdk';
import { monitor } from '@/lib/monitoring';

export default function FundPoolPage() {
  const { publicKey, signTransaction, usdcBalance, refreshBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('100.00');
  const [disaster, setDisaster] = useState('kerala2025');
  const [poolBalance, setPoolBalance] = useState<string | null>(null);

  // Fetch current pool balance
  useEffect(() => {
    async function fetchPool() {
      try {
        const available = await queryContract({
          contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
          method: 'get_available_balance',
          args: []
        });
        if (available !== null) {
          setPoolBalance((Number(available) / 10000000).toFixed(2));
        }
      } catch {
        setPoolBalance('0.00');
      }
    }
    fetchPool();
  }, [success]);

  const handleFundPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert('Please connect your wallet first.');
      return;
    }

    const amountStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));

    if (usdcBalance < parseFloat(amount)) {
      alert(`You only have ${usdcBalance.toFixed(2)} USDC. Get free testnet USDC from the Circle faucet first (link below).`);
      return;
    }

    setLoading(true);
    try {
      const result = await invokeContract({
        contractId: process.env.NEXT_PUBLIC_RELIEF_POOL_CONTRACT_ID!,
        method: 'fund_pool',
        args: [
          { type: 'address', value: publicKey }, // charity (you)
          { type: 'i128', value: amountStroops },
          disaster,
        ],
        publicKey,
        signTransaction,
      });

      if (result.success) {
        setTxHash(result.hash);
        setSuccess(true);
        monitor.poolFunded(Number(amount), disaster);
        refreshBalance();
      }
    } catch (err: any) {
      console.error('Fund pool error:', err);
      const msg = err?.message || '';
      if (msg.includes('insufficient') || msg.includes('balance')) {
        alert('Insufficient USDC balance. Please get testnet USDC from the Circle faucet first.');
      } else {
        alert('Funding failed: ' + (msg || 'See console for details.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up text-center">
        <CheckCircle className="text-[var(--gold)] mb-6 animate-glow-pulse" size={80} />
        <h1 className="font-display italic text-4xl mb-4">Pool Funded Successfully!</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          The relief pool now has USDC available for distribution. You can now distribute aid to victims.
        </p>
        <div className="flex gap-4">
          <button onClick={() => setSuccess(false)} className="btn-outline">Fund More</button>
          <a href="/dashboard/distribute" className="btn-gold flex items-center gap-2">
            Distribute Aid <ArrowRight size={16} />
          </a>
        </div>
        {txHash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm text-gray-500 hover:text-[var(--gold)] flex items-center gap-1"
          >
            View on Explorer <ExternalLink size={14} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display italic text-4xl mb-2">Fund Relief Pool</h1>
        <p className="text-gray-400">Deposit testnet USDC into the relief pool to enable aid distribution.</p>
      </div>

      {/* Step-by-step guide */}
      <div className="glass-card p-6 mb-8 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-yellow-500 mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-white mb-1">First Time? Get Free Testnet USDC</h3>
            <p className="text-sm text-gray-400">You need testnet USDC tokens (free) to fund the pool. Follow these steps:</p>
          </div>
        </div>
        <ol className="space-y-3 ml-8">
          <li className="flex items-start gap-3">
            <span className="bg-[var(--gold)] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <p className="text-sm text-white font-medium">Get testnet USDC from Circle's faucet</p>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gold)] text-xs hover:underline flex items-center gap-1 mt-1"
              >
                Open Circle Faucet <ExternalLink size={12} />
              </a>
              <p className="text-xs text-gray-500 mt-1">Select <strong>Stellar → Testnet</strong>, paste your wallet address, and request USDC.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-[var(--gold)] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div>
              <p className="text-sm text-white font-medium">Ensure you have a USDC trustline</p>
              <p className="text-xs text-gray-500">Visit the <a href="/onboard" className="text-[var(--gold)] hover:underline">Onboard page</a> if you haven't set up your trustline yet.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-[var(--gold)] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <p className="text-sm text-white font-medium">Fund the pool below</p>
              <p className="text-xs text-gray-500">Choose an amount and disaster operation, then submit.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Balance info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-gray-500" />
            <span className="label-text text-[9px]">Your USDC Balance</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${usdcBalance?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-gray-500" />
            <span className="label-text text-[9px]">Pool Available</span>
          </div>
          <div className="text-2xl font-bold text-[var(--gold)] font-mono">
            ${poolBalance || '—'}
          </div>
        </div>
      </div>

      {/* Fund form */}
      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleFundPool} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Disaster Operation</label>
            <select
              className="glass-input w-full"
              value={disaster}
              onChange={(e) => setDisaster(e.target.value)}
              required
            >
              <option value="kerala2025">Kerala Flood 2025</option>
              <option value="turkey2024">Turkey Quake Relief</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USDC)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number"
                className="glass-input w-full pl-8"
                placeholder="100.00"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {publicKey && (
            <div className="bg-[rgba(167,139,113,0.05)] border border-[rgba(167,139,113,0.2)] rounded-xl p-4">
              <div className="label-text mb-3 text-center">Funding Preview</div>
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-gray-400 text-sm">From</span>
                <span className="font-mono text-xs text-white">{publicKey.slice(0, 6)}...{publicKey.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-gray-400 text-sm">To</span>
                <span className="font-mono text-xs text-[var(--gold)]">Relief Pool Contract</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-semibold text-white">Total Deposit</span>
                <span className="font-display italic text-2xl text-[var(--gold)]">${parseFloat(amount || '0').toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-lg"
            disabled={loading || !publicKey}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Depositing USDC...
              </>
            ) : (
              <>
                <DollarSign size={20} />
                Fund Relief Pool
              </>
            )}
          </button>
        </form>
      </div>

      {/* Your wallet address for easy copy */}
      {publicKey && (
        <div className="mt-6 glass-card p-4">
          <div className="label-text text-[9px] mb-2">Your Wallet Address (paste into Circle faucet)</div>
          <div
            className="font-mono text-xs text-gray-400 bg-[rgba(0,0,0,0.3)] rounded-lg p-3 cursor-pointer hover:text-white transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(publicKey);
              alert('Address copied!');
            }}
          >
            {publicKey}
            <span className="text-[var(--gold)] text-[10px] ml-2">Click to copy</span>
          </div>
        </div>
      )}
    </div>
  );
}
