"use client"
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function FreighterCheck() {
  const [installed, setInstalled] = useState(true)
  
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const { isConnected } = await import(
          '@stellar/freighter-api'
        )
        const connected = await isConnected()
        setInstalled(connected !== undefined)
      } catch {
        setInstalled(false)
      }
    }
    
    setTimeout(checkFreighter, 1000)
  }, [])
  
  if (installed) return null
  
  return (
    <div className="fixed bottom-4 right-4 
      z-50 max-w-sm
      bg-[#111111] border border-yellow-600/30
      rounded-2xl p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg
          bg-yellow-600/20 flex items-center 
          justify-center flex-shrink-0">
          <Download className="w-4 h-4 
            text-yellow-500"/>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm 
            font-medium mb-1">
            Freighter Required
          </p>
          <p className="text-white/50 text-xs 
            mb-3 leading-relaxed">
            Install the Freighter browser 
            extension to connect your 
            Stellar wallet.
          </p>
          <a
            href="https://www.freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center 
              gap-1.5 px-3 py-1.5 rounded-lg
              bg-yellow-600/20 
              border border-yellow-600/30
              text-yellow-500 text-xs 
              font-medium
              hover:bg-yellow-600/30
              transition-colors">
            <Download className="w-3 h-3"/>
            Install Freighter
          </a>
        </div>
        <button
          onClick={() => setInstalled(true)}
          className="text-white/30 
            hover:text-white/60 text-lg 
            leading-none">
          ×
        </button>
      </div>
    </div>
  )
}
