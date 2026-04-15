"use client"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import { toast } from 'sonner'

interface WalletState {
  publicKey: string | null
  isConnected: boolean
  xlmBalance: number
  usdcBalance: number
  isLoading: boolean
  network: string
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  signTransaction: (xdr: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType>(
  {} as WalletContextType
)

const HORIZON_URL = 
  'https://horizon-testnet.stellar.org'

const USDC_ISSUER = 
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

async function fetchBalances(publicKey: string) {
  try {
    const res = await fetch(
      `${HORIZON_URL}/accounts/${publicKey}`
    )
    if (!res.ok) return { xlm: 0, usdc: 0 }
    
    const data = await res.json()
    let xlm = 0
    let usdc = 0
    
    for (const b of data.balances) {
      if (b.asset_type === 'native') {
        xlm = parseFloat(b.balance) || 0
      }
      if (
        b.asset_code === 'USDC' &&
        b.asset_issuer === USDC_ISSUER
      ) {
        usdc = parseFloat(b.balance) || 0
      }
    }
    
    return { xlm, usdc }
  } catch {
    return { xlm: 0, usdc: 0 }
  }
}

export function WalletProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    xlmBalance: 0,
    usdcBalance: 0,
    isLoading: false,
    network: 'TESTNET'
  })

  // Auto reconnect on page load
  useEffect(() => {
    const savedKey = localStorage.getItem(
      'reliefmesh_pubkey'
    )
    if (!savedKey) return
    
    fetchBalances(savedKey).then(({ xlm, usdc }) => {
      setState(s => ({
        ...s,
        publicKey: savedKey,
        isConnected: true,
        xlmBalance: xlm,
        usdcBalance: usdc
      }))
    })
  }, [])

  const connect = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }))
    
    try {
      // Dynamic import to avoid SSR issues
      const freighter = await import(
        '@stellar/freighter-api'
      )
      
      // Check if Freighter is installed
      const { isConnected } = freighter
      const { isConnected: installed } = await isConnected()
      
      if (!installed) {
        toast.error(
          'Freighter not found. Installing...',
          { duration: 3000 }
        )
        window.open(
          'https://www.freighter.app',
          '_blank'
        )
        setState(s => ({ ...s, isLoading: false }))
        return
      }
      
      // Check network — must be testnet
      const { getNetworkDetails } = freighter
      const networkDetails = await getNetworkDetails()
      
      if (
        networkDetails.error ||
        networkDetails.networkPassphrase !==
        'Test SDF Network ; September 2015'
      ) {
        toast.error(
          'Please switch Freighter to Testnet. ' +
          'Settings → Network → Testnet',
          { duration: 5000 }
        )
        setState(s => ({ ...s, isLoading: false }))
        return
      }
      
      // Request public key — triggers Freighter popup
      const { requestAccess } = freighter
      const { address: publicKey, error: accessError } = await requestAccess()
      
      if (accessError || !publicKey) {
        toast.error('Connection cancelled')
        setState(s => ({ ...s, isLoading: false }))
        return
      }
      
      // Fetch balances
      const { xlm, usdc } = await fetchBalances(
        publicKey
      )
      
      // Save to localStorage for auto-reconnect
      localStorage.setItem(
        'reliefmesh_pubkey', 
        publicKey
      )
      
      setState({
        publicKey,
        isConnected: true,
        xlmBalance: xlm,
        usdcBalance: usdc,
        isLoading: false,
        network: 'TESTNET'
      })
      
      toast.success('Wallet connected!')
      
    } catch (err: any) {
      console.error('Freighter error:', err)
      
      // Handle specific Freighter errors
      if (err?.message?.includes('User declined')) {
        toast.error('Connection declined in Freighter')
      } else if (err?.message?.includes('not found')) {
        toast.error(
          'Please install Freighter extension'
        )
        window.open(
          'https://www.freighter.app', 
          '_blank'
        )
      } else {
        toast.error(
          'Connection failed. ' +
          'Check Freighter is unlocked.'
        )
      }
      
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem('reliefmesh_pubkey')
    setState({
      publicKey: null,
      isConnected: false,
      xlmBalance: 0,
      usdcBalance: 0,
      isLoading: false,
      network: 'TESTNET'
    })
    toast.success('Wallet disconnected')
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!state.publicKey) return
    const { xlm, usdc } = await fetchBalances(
      state.publicKey
    )
    setState(s => ({ 
      ...s, 
      xlmBalance: xlm, 
      usdcBalance: usdc 
    }))
  }, [state.publicKey])

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      try {
        const { signTransaction } = await import(
          '@stellar/freighter-api'
        )
        
        const result = await signTransaction(
          xdr,
          {
            networkPassphrase: 
              'Test SDF Network ; September 2015',
            address: state.publicKey || 
              undefined
          }
        )

        if (result.error) {
          throw new Error(result.error as unknown as string)
        }
        
        return result.signedTxXdr
      } catch (err: any) {
        if (
          err?.message?.includes('User declined') ||
          err?.message?.includes('rejected')
        ) {
          throw new Error(
            'Transaction rejected in Freighter'
          )
        }
        throw new Error(
          'Failed to sign transaction: ' + 
          err?.message
        )
      }
    },
    [state.publicKey]
  )

  return (
    <WalletContext.Provider value={{
      ...state,
      connect,
      disconnect,
      refreshBalance,
      signTransaction
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error(
      'useWallet must be used within WalletProvider'
    )
  }
  return context
}
