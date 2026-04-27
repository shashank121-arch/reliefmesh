import {
  TransactionBuilder,
  Networks,
  BASE_FEE
} from '@stellar/stellar-sdk'

export const FEE_SPONSOR_KEY =
  process.env.NEXT_PUBLIC_FEE_SPONSOR_KEY || ''

export function isGaslessEnabled(): boolean {
  return Boolean(FEE_SPONSOR_KEY)
}

export async function wrapWithFeeBump(
  innerXDR: string
): Promise<string> {
  try {
    const innerTx = TransactionBuilder.fromXDR(
      innerXDR,
      Networks.TESTNET
    )

    const feeBumpTx =
      TransactionBuilder.buildFeeBumpTransaction(
        FEE_SPONSOR_KEY,
        String(Number(BASE_FEE) * 10),
        innerTx as any,
        Networks.TESTNET
      )

    return feeBumpTx.toEnvelope().toXDR('base64')
  } catch (err) {
    console.error('Fee bump error:', err)
    throw err
  }
}
