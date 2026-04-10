"use client"
import { useWallet } from '@/context/WalletContext'
import { Wallet, LogOut, RefreshCw, 
  ExternalLink, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ 
  className = '' 
}: WalletConnectProps) {
  const { 
    isConnected, 
    isLoading,
    publicKey, 
    xlmBalance,
    usdcBalance,
    connect, 
    disconnect,
    refreshBalance
  } = useWallet()
  
  const [showDropdown, setShowDropdown] = 
    useState(false)
  const [refreshing, setRefreshing] = 
    useState(false)

  const truncate = (key: string) => 
    key.slice(0, 6) + '...' + key.slice(-4)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalance()
    setRefreshing(false)
  }

  // NOT CONNECTED STATE
  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isLoading}
        className={`
          flex items-center gap-2
          px-5 py-2.5 rounded-full
          border border-white/20
          text-white text-sm font-medium
          hover:border-yellow-600/60
          hover:text-yellow-400
          transition-all duration-300
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${className}
        `}>
        {isLoading ? (
          <>
            <div className="w-4 h-4 
              border-2 border-white/30 
              border-t-white rounded-full 
              animate-spin"/>
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4"/>
            Connect Wallet
          </>
        )}
      </button>
    )
  }

  // CONNECTED STATE — dropdown menu
  return (
    <div className="relative">
      <button
        onClick={() => 
          setShowDropdown(s => !s)
        }
        className={`
          flex items-center gap-2
          px-4 py-2 rounded-full
          bg-white/[0.04]
          border border-white/10
          hover:border-yellow-600/40
          transition-all duration-300
          text-sm
          ${className}
        `}>
        {/* Green connected dot */}
        <div className="w-2 h-2 rounded-full 
          bg-emerald-400 
          shadow-[0_0_6px_rgba(52,211,153,0.6)]"/>
        
        {/* Truncated address */}
        <span className="text-white font-mono 
          text-xs">
          {truncate(publicKey!)}
        </span>
        
        {/* USDC balance */}
        <span className="text-yellow-500/80 
          text-xs font-medium hidden sm:block">
          {usdcBalance.toFixed(2)} USDC
        </span>
        
        <ChevronDown className={`
          w-3 h-3 text-white/50 
          transition-transform duration-200
          ${showDropdown ? 'rotate-180' : ''}
        `}/>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 
            top-full mt-2 z-50
            w-72 rounded-2xl overflow-hidden
            bg-[#111111]
            border border-white/10
            shadow-2xl
            shadow-black/50">
            
            {/* Wallet info header */}
            <div className="p-4 
              border-b border-white/5">
              <div className="flex items-center 
                justify-between mb-3">
                <p className="text-white/50 
                  text-xs uppercase tracking-wider">
                  Connected Wallet
                </p>
                <div className="flex items-center 
                  gap-1">
                  <div className="w-1.5 h-1.5 
                    rounded-full bg-emerald-400"/>
                  <span className="text-emerald-400 
                    text-xs">Testnet</span>
                </div>
              </div>
              
              <p className="text-white font-mono 
                text-xs break-all mb-3">
                {publicKey}
              </p>
              
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1
                  text-yellow-600/70 text-xs
                  hover:text-yellow-500
                  transition-colors">
                <ExternalLink className="w-3 h-3"/>
                View on Stellar Expert
              </a>
            </div>
            
            {/* Balances */}
            <div className="p-4 
              border-b border-white/5">
              <div className="flex justify-between 
                items-center mb-2">
                <p className="text-white/50 
                  text-xs uppercase tracking-wider">
                  Balances
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-white/30 
                    hover:text-white/60 
                    transition-colors">
                  <RefreshCw className={`
                    w-3 h-3
                    ${refreshing 
                      ? 'animate-spin' 
                      : ''}
                  `}/>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 
                    text-sm">XLM</span>
                  <span className="text-white 
                    text-sm font-medium">
                    {xlmBalance.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 
                    text-sm">USDC</span>
                  <span className="text-yellow-400 
                    text-sm font-medium">
                    {usdcBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Disconnect */}
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect()
                  setShowDropdown(false)
                }}
                className="w-full flex items-center 
                  gap-2 px-3 py-2.5 rounded-xl
                  text-red-400/80 text-sm
                  hover:bg-red-500/10
                  hover:text-red-400
                  transition-all duration-200">
                <LogOut className="w-4 h-4"/>
                Disconnect Wallet
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
