import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReliefMesh - Decentralized Disaster Relief',
  description: 'A decentralized disaster relief platform on Stellar Soroban with SMS integration.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased font-serif-italic font-serif-bold label-text">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
