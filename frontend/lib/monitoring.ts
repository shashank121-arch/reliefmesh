"use client"

export type EventType =
  | 'user_connected'
  | 'aid_distributed'
  | 'victim_registered'
  | 'clawback_executed'
  | 'shopkeeper_registered'
  | 'pool_funded'
  | 'page_view'
  | 'error'

export interface MonitorEvent {
  event: EventType
  timestamp: string
  data: Record<string, any>
}

const STORAGE_KEY = 'reliefmesh_monitor_v1'

function saveEvent(e: MonitorEvent): void {
  if (typeof window === 'undefined') return
  try {
    const existing: MonitorEvent[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    existing.push(e)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(existing.slice(-2000))
    )
    console.log(
      '[ReliefMesh Monitor]',
      JSON.stringify(e)
    )
  } catch {}
}

export const monitor = {
  userConnected: (wallet: string) =>
    saveEvent({
      event: 'user_connected',
      timestamp: new Date().toISOString(),
      data: {
        wallet: wallet.slice(0, 8) + '...',
        fullWallet: wallet
      }
    }),

  aidDistributed: (
    amount: number,
    victimCount: number,
    disasterCode: string
  ) =>
    saveEvent({
      event: 'aid_distributed',
      timestamp: new Date().toISOString(),
      data: { amount, victimCount, disasterCode }
    }),

  victimRegistered: (disasterCode: string) =>
    saveEvent({
      event: 'victim_registered',
      timestamp: new Date().toISOString(),
      data: { disasterCode }
    }),

  clawbackExecuted: (
    amount: number,
    shopkeeperId: string
  ) =>
    saveEvent({
      event: 'clawback_executed',
      timestamp: new Date().toISOString(),
      data: { amount, shopkeeperId }
    }),

  shopkeeperRegistered: (location: string) =>
    saveEvent({
      event: 'shopkeeper_registered',
      timestamp: new Date().toISOString(),
      data: { location }
    }),

  poolFunded: (amount: number) =>
    saveEvent({
      event: 'pool_funded',
      timestamp: new Date().toISOString(),
      data: { amount }
    }),

  pageView: (page: string) =>
    saveEvent({
      event: 'page_view',
      timestamp: new Date().toISOString(),
      data: { page }
    }),

  error: (page: string, message: string) => {
    saveEvent({
      event: 'error',
      timestamp: new Date().toISOString(),
      data: { page, message }
    })
    console.error(
      '[ReliefMesh Error]',
      page,
      message
    )
  },

  getEvents: (): MonitorEvent[] => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      )
    } catch {
      return []
    }
  },

  getDAU: (): number => {
    const today = new Date().toDateString()
    const events = monitor.getEvents()
    return new Set(
      events
        .filter(
          e =>
            e.event === 'user_connected' &&
            new Date(e.timestamp).toDateString() ===
              today
        )
        .map(e => e.data.fullWallet || e.data.wallet)
    ).size
  },

  getTotalAidDistributed: (): number =>
    monitor
      .getEvents()
      .filter(e => e.event === 'aid_distributed')
      .reduce((s, e) => s + (e.data.amount || 0), 0),

  getTotalVictims: (): number =>
    monitor
      .getEvents()
      .filter(e => e.event === 'victim_registered')
      .length,

  getAllWallets: (): string[] => {
    const wallets = new Set<string>()
    monitor
      .getEvents()
      .filter(e => e.event === 'user_connected')
      .forEach(e => {
        if (e.data.fullWallet) {
          wallets.add(e.data.fullWallet)
        }
      })
    return Array.from(wallets)
  },

  getLast30Days: (): {
    date: string
    users: number
    volume: number
    victims: number
  }[] => {
    const events = monitor.getEvents()
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toDateString()

      const users = new Set(
        events
          .filter(
            e =>
              e.event === 'user_connected' &&
              new Date(e.timestamp).toDateString() ===
                dateStr
          )
          .map(e => e.data.fullWallet || e.data.wallet)
      ).size

      const volume = events
        .filter(
          e =>
            e.event === 'aid_distributed' &&
            new Date(e.timestamp).toDateString() ===
              dateStr
        )
        .reduce((s, e) => s + (e.data.amount || 0), 0)

      const victims = events.filter(
        e =>
          e.event === 'victim_registered' &&
          new Date(e.timestamp).toDateString() === dateStr
      ).length

      return {
        date: date.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric'
        }),
        users,
        volume: Number(volume.toFixed(2)),
        victims
      }
    })
  }
}
