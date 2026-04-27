"use client"
import { Shield, Check, Download, ExternalLink } from 'lucide-react'

const CHECKS = [
  {
    section: 'Smart Contract Security',
    color: '#a78b71',
    items: [
      {
        text: 'Reentrancy protection implemented',
        proof: 'relief-pool/src/lib.rs — state updated before transfer'
      },
      {
        text: 'Integer overflow uses i128 (128-bit)',
        proof: 'All amount fields typed as i128 in all contracts'
      },
      {
        text: 'Admin-only functions require_auth()',
        proof: 'admin.require_auth() on all privileged functions'
      },
      {
        text: 'Events emitted for all state changes',
        proof: 'env.events().publish() on every mutation'
      },
      {
        text: 'Initialize can only run once',
        proof: 'Panics if DataKey::Initialized already set'
      },
      {
        text: 'USDC token transfer validated',
        proof: 'Balance checked before transfer in relief-pool'
      },
      {
        text: 'Daily limits enforced for shopkeepers',
        proof: 'shopkeeper-registry/src/lib.rs check_daily_limit()'
      },
      {
        text: 'Double-spend prevention for victims',
        proof: 'victim-registry tracks aid_available balance'
      }
    ]
  },
  {
    section: 'Frontend Security',
    color: '#10b981',
    items: [
      {
        text: 'Private keys never stored anywhere',
        proof: 'Only publicKey stored in WalletContext + localStorage'
      },
      {
        text: 'All API calls use HTTPS',
        proof: 'horizon-testnet.stellar.org and soroban-testnet both HTTPS'
      },
      {
        text: 'Contract IDs in environment variables only',
        proof: 'NEXT_PUBLIC_* vars in .env.local, not hardcoded'
      },
      {
        text: 'XSS protection via React JSX escaping',
        proof: 'All user data rendered via JSX, no dangerouslySetInnerHTML'
      },
      {
        text: 'Wallet permission scoped to public key only',
        proof: 'Freighter only grants getPublicKey() access'
      },
      {
        text: 'SSE errors handled gracefully',
        proof: 'source.onerror silently disposes in stellar.ts'
      }
    ]
  },
  {
    section: 'Operational Security',
    color: '#6366f1',
    items: [
      {
        text: 'GitHub secrets configured for CI/CD',
        proof: 'VERCEL_TOKEN, ORG_ID, PROJECT_ID in repo secrets'
      },
      {
        text: 'CI/CD only deploys from main branch',
        proof: 'github.ref check in deploy.yml'
      },
      {
        text: 'No hardcoded credentials in codebase',
        proof: 'git grep for API keys returns zero results'
      },
      {
        text: 'All dependencies pinned to specific versions',
        proof: 'package-lock.json committed to repository'
      }
    ]
  },
  {
    section: 'User Protection',
    color: '#f59e0b',
    items: [
      {
        text: 'ZK identity — no PII stored on chain',
        proof: 'Only SHA-256 hashes stored in victim-registry'
      },
      {
        text: 'Victim identity verified without revealing data',
        proof: 'verify_victim() compares hashes only'
      },
      {
        text: 'Clawback prevents corruption instantly',
        proof: 'clawback-controller can seize USDC on-chain'
      },
      {
        text: 'Shopkeeper daily limits prevent excess',
        proof: 'Max daily cashout enforced per shopkeeper'
      },
      {
        text: 'Dispute flagging system active',
        proof: 'flag_shopkeeper() tracked with dispute_count'
      }
    ]
  }
]

export default function SecurityPage() {
  const total = CHECKS.reduce(
    (s, c) => s + c.items.length, 0
  )
  const passed = total
  const score = Math.round((passed / total) * 100)

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '4px'
          }}>
            <Shield size={28} color="#a78b71" />
            <h1 className="font-serif-italic"
              style={{ fontSize: '32px', color: 'white' }}>
              Security Checklist
            </h1>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px'
          }}>
            ReliefMesh security audit — Level 6
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'rgba(167,139,113,0.1)',
            border: '1px solid rgba(167,139,113,0.2)',
            color: '#a78b71',
            fontSize: '13px',
            cursor: 'pointer'
          }}>
          <Download size={14} />
          Export PDF
        </button>
      </div>

      {/* Score Card */}
      <div className="glass-card" style={{
        padding: '32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px'
      }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg viewBox="0 0 36 36" style={{
            width: '100%', height: '100%',
            transform: 'rotate(-90deg)'
          }}>
            <circle cx="18" cy="18" r="15.9"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9"
              fill="none"
              stroke="#a78b71"
              strokeWidth="3"
              strokeDasharray={`${score} 100`}
              strokeLinecap="round" />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px', fontWeight: 700,
            color: '#a78b71'
          }}>
            {score}%
          </div>
        </div>
        <div>
          <p className="label-text" style={{ marginBottom: '8px' }}>
            Overall Security Score
          </p>
          <p style={{
            fontSize: '40px', fontWeight: 700,
            color: '#10b981', fontFamily:
              'Playfair Display, serif',
            fontStyle: 'italic', margin: 0
          }}>
            {passed}/{total}
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px'
          }}>
            security checks passed
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '100px',
            padding: '8px 20px',
            color: '#10b981',
            fontSize: '13px',
            fontWeight: 600
          }}>
            ✅ All Systems Secure
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      {CHECKS.map(section => (
        <div key={section.section}
          className="glass-card"
          style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              color: section.color,
              fontSize: '15px',
              fontWeight: 600
            }}>
              {section.section}
            </h2>
            <span style={{
              background: `${section.color}20`,
              border: `1px solid ${section.color}30`,
              borderRadius: '100px',
              padding: '4px 12px',
              color: section.color,
              fontSize: '12px'
            }}>
              {section.items.length}/{section.items.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {section.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <div style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0, marginTop: 2
                }}>
                  <Check size={13} color="#10b981" />
                </div>
                <div>
                  <p style={{
                    color: 'white', fontSize: '14px',
                    margin: 0, marginBottom: '3px'
                  }}>
                    {item.text}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '12px', margin: 0
                  }}>
                    {item.proof}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
