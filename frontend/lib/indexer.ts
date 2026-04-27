export interface ChainTransaction {
  hash: string
  createdAt: string
  memo: string
  successful: boolean
  type: string
  explorerUrl: string
}

export async function getAccountTransactions(
  publicKey: string,
  limit = 20
): Promise<ChainTransaction[]> {
  try {
    const res = await fetch(
      `https://horizon-testnet.stellar.org` +
        `/accounts/${publicKey}/transactions` +
        `?limit=${limit}&order=desc`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []

    const data = await res.json()
    const records = data._embedded?.records || []

    return records.map((tx: any) => ({
      hash: tx.hash,
      createdAt: tx.created_at,
      memo: tx.memo || '',
      successful: tx.successful,
      type: classifyTx(tx.memo || ''),
      explorerUrl:
        `https://stellar.expert/explorer/testnet/tx/${tx.hash}`
    }))
  } catch {
    return []
  }
}

function classifyTx(memo: string): string {
  const m = memo.toUpperCase()
  if (m.includes('DIST') || m.includes('AID'))
    return 'Aid Distributed'
  if (m.includes('FUND')) return 'Pool Funded'
  if (m.includes('CLAW')) return 'Clawback'
  if (m.includes('REG') || m.includes('VIC'))
    return 'Victim Registered'
  if (m.includes('SHOP')) return 'Shopkeeper'
  return 'Contract Call'
}

export async function getContractTransactions(
  contractId: string,
  limit = 10
): Promise<ChainTransaction[]> {
  try {
    const res = await fetch(
      `https://horizon-testnet.stellar.org` +
        `/accounts/${contractId}/transactions` +
        `?limit=${limit}&order=desc`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data._embedded?.records || []).map(
      (tx: any) => ({
        hash: tx.hash,
        createdAt: tx.created_at,
        memo: tx.memo || '',
        successful: tx.successful,
        type: classifyTx(tx.memo || ''),
        explorerUrl:
          `https://stellar.expert/explorer/testnet/tx/${tx.hash}`
      })
    )
  } catch {
    return []
  }
}
