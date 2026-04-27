"use client"
import { useEffect, useState } from 'react'
import { monitor } from '@/lib/monitoring'
import { getAccountTransactions } from '@/lib/indexer'
import { useWallet } from '@/context/WalletContext'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

export default function MetricsPage() {
  const { publicKey } = useWallet()
  const [dau, setDau] = useState(0)
  const [totalAid, setTotalAid] = useState(0)
  const [totalVictims, setTotalVictims] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [wallets, setWallets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [chainTxs, setChainTxs] = useState<any[]>([])

  function loadMetrics() {
    setLoading(true)
    setDau(monitor.getDAU())
    setTotalAid(monitor.getTotalAidDistributed())
    setTotalVictims(monitor.getTotalVictims())
    setChartData(monitor.getLast30Days())
    setWallets(monitor.getAllWallets())
    setLastUpdated(
      new Date().toLocaleTimeString('en-IN')
    )
    setLoading(false)
  }

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!publicKey) return
    getAccountTransactions(publicKey, 20)
      .then(setChainTxs)
  }, [publicKey])

  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div
        style={{
          background: '#111',
          border: '1px solid rgba(167,139,113,0.3)',
          borderRadius: '12px',
          padding: '12px 16px'
        }}>
        <p
          style={{
            color: '#a78b71',
            fontSize: '12px',
            marginBottom: '8px'
          }}>
          {label}
        </p>
        {payload.map((p: any) => (
          <p
            key={p.dataKey}
            style={{
              color: 'white',
              fontSize: '13px',
              margin: '2px 0'
            }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px'
        }}>
        <div>
          <h1
            className="font-serif-italic"
            style={{
              fontSize: '32px',
              color: 'white',
              marginBottom: '4px'
            }}>
            Metrics Dashboard
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '13px'
            }}>
            Live ReliefMesh usage analytics
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
          <span
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '12px'
            }}>
            Updated {lastUpdated}
          </span>
          <button
            onClick={loadMetrics}
            style={{
              background: 'rgba(167,139,113,0.1)',
              border: '1px solid rgba(167,139,113,0.2)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#a78b71'
            }}>
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
        {[
          {
            label: 'Daily Active Users',
            value: dau,
            icon: Users,
            color: '#a78b71',
            suffix: ' today'
          },
          {
            label: 'Total Aid Distributed',
            value: `$${totalAid.toFixed(2)}`,
            icon: DollarSign,
            color: '#10b981',
            suffix: ' USDC'
          },
          {
            label: 'Total Victims Helped',
            value: totalVictims,
            icon: Activity,
            color: '#6366f1',
            suffix: ' registered'
          },
          {
            label: 'Connected Wallets',
            value: wallets.length,
            icon: TrendingUp,
            color: '#f59e0b',
            suffix: ' unique'
          }
        ].map(stat => (
          <div
            key={stat.label}
            className="glass-card"
            style={{
              padding: '24px',
              borderLeft: `3px solid ${stat.color}`
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
              <stat.icon
                size={16}
                style={{ color: stat.color }}
              />
              <span className="label-text">
                {stat.label}
              </span>
            </div>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: stat.color,
                fontFamily: 'Playfair Display, serif',
                fontStyle: 'italic',
                margin: 0
              }}>
              {stat.value}
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                marginTop: '4px'
              }}>
              {stat.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* DAU Chart */}
      <div
        className="glass-card"
        style={{ padding: '24px', marginBottom: '24px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
          Daily Active Users — Last 30 Days
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="dauGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="#a78b71"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#a78b71"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              interval={6}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="#a78b71"
              strokeWidth={2}
              fill="url(#dauGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div
        className="glass-card"
        style={{ padding: '24px', marginBottom: '24px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
          Aid Volume (USDC) — Last 30 Days
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient
                id="volGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="#10b981"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#10b981"
                  stopOpacity={0.3}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              interval={6}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="volume"
              name="USDC"
              fill="url(#volGrad)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Connected Wallets Table */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
          Connected User Wallets ({wallets.length})
        </h2>
        {wallets.length === 0 ? (
          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center',
              padding: '32px'
            }}>
            No wallets connected yet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Wallet Address', 'First Seen', 'Explorer'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 16px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, i) => {
                  const events = monitor
                    .getEvents()
                    .filter(
                      e =>
                        e.event === 'user_connected' &&
                        e.data.fullWallet === wallet
                    )
                  const firstSeen =
                    events[0]?.timestamp
                      ? new Date(
                          events[0].timestamp
                        ).toLocaleDateString()
                      : 'Unknown'
                  return (
                    <tr
                      key={wallet}
                      style={{
                        borderBottom:
                          '1px solid rgba(255,255,255,0.03)'
                      }}>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: '13px'
                        }}>
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'white',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}>
                        {wallet.slice(0, 8)}...
                        {wallet.slice(-6)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: '13px'
                        }}>
                        {firstSeen}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#a78b71',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}>
                          <ExternalLink size={12} />
                          View
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* On-Chain Transaction Index */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
          On-Chain Transaction Index
        </h2>
        {chainTxs.length === 0 ? (
          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center',
              padding: '32px'
            }}>
            No transactions found for connected wallet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Type', 'Hash', 'Date', 'Status', 'Explorer'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 16px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chainTxs.map((tx, i) => (
                  <tr
                    key={tx.hash}
                    style={{
                      borderBottom:
                        '1px solid rgba(255,255,255,0.03)'
                    }}>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'white',
                        fontSize: '13px'
                      }}>
                      {tx.type}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '13px'
                      }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: tx.successful ? '#10b981' : '#ef4444',
                        fontSize: '13px'
                      }}>
                      {tx.successful ? 'Success' : 'Failed'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#a78b71',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}>
                        <ExternalLink size={12} />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
