# ReliefMesh Architecture

## Overview

ReliefMesh is a decentralized disaster relief platform built on Stellar Soroban. It enables charities to send USDC directly to disaster victims, with SMS-based fund management, local shopkeeper cash-out points, clawback mechanisms to prevent corruption, and Zero-Knowledge identity protection for victims.

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        RELIEFMESH                           │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Charities  │    │    Victims   │    │ Shopkeepers  │  │
│  │  (Funders)   │    │  (SMS-based) │    │ (Cash-out)   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Stellar Soroban Layer                  │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ ReliefPool │  │VictimRegistry│  │Shopkeeper  │  │   │
│  │  │  Contract  │  │  Contract    │  │ Registry   │  │   │
│  │  └─────┬──────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  │        │                │                │          │   │
│  │        └────────────────┼────────────────┘          │   │
│  │                         │                           │   │
│  │                ┌────────▼────────┐                  │   │
│  │                │ClawbackController│                 │   │
│  │                │    Contract     │                  │   │
│  │                └─────────────────┘                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Next.js 14 Frontend                       │  │
│  │   Dashboard | Charity | Victim | Shopkeeper Views    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### 1. ReliefPool (`/contracts/relief-pool`)

**Purpose:** Main treasury contract. Holds charity USDC donations and distributes aid to registered victims.

**Key Functions:**
- `fund_pool` — Charities deposit USDC
- `distribute_aid` — Send USDC to individual victim wallet
- `batch_distribute` — Distribute to multiple victims at once
- `emergency_pause` — Pause all distributions
- `get_disaster_stats` — Disaster-level analytics

**State:**
- Total USDC received/distributed
- Per-disaster tracking
- Cross-contract references to all registries

---

### 2. VictimRegistry (`/contracts/victim-registry`)

**Purpose:** Privacy-preserving victim registry. Personal details are never stored on-chain — only ZK commitment hashes.

**Privacy Model:**
- Phone numbers → `SHA-256(phone + salt)` stored
- Identity documents → ZK commitment hash stored
- Verification done via hash comparison, never revealing raw data

**Key Functions:**
- `register_victim` — Admin registers with hashed identity
- `verify_victim` — Verify identity without exposing details
- `record_aid_received` — Called by ReliefPool on distribution
- `get_victims_by_disaster` — Disaster-scoped victim lists

---

### 3. ShopkeeperRegistry (`/contracts/shopkeeper-registry`)

**Purpose:** Registry of verified local cash-out points. Includes daily limits and dispute tracking.

**Anti-Corruption Features:**
- Daily cashout limits per shopkeeper
- Dispute/flag counter
- Admin verification requirement before activation

---

### 4. ClawbackController (`/contracts/clawback-controller`)

**Purpose:** Governance contract for recovering funds from fraudulent shopkeepers using Stellar's native clawback feature.

**Flow:**
1. Evidence submitted → Case created (Pending)
2. Admin reviews → Approved or Rejected
3. Execute clawback → USDC recovered on-chain

---

## Data Flow

### Charity → Victim Flow
```
1. Charity calls relief_pool.fund_pool(amount, disaster_code)
2. Admin calls relief_pool.distribute_aid(victim_id, wallet, amount)
3. ReliefPool transfers USDC to victim_wallet
4. ReliefPool calls victim_registry.record_aid_received(victim_id, amount)
5. Victim uses SMS to initiate cashout at local shopkeeper
6. Shopkeeper calls shopkeeper_registry.record_cashout(id, amount, victim_id)
```

### Clawback Flow
```
1. Charity reports price-gouging with evidence
2. admin.initiate_clawback(shopkeeper_wallet, amount, reason, evidence_hash)
3. admin.approve_clawback(case_id)
4. admin.execute_clawback(case_id) → USDC moved back to pool
```

---

## Zero-Knowledge Identity Protection

Victims' real identities are protected through a commitment scheme:

```
identity_hash = keccak256(
  victim_name || national_id || birth_date || secret_salt
)

phone_hash = sha256(phone_number || app_salt)
```

Only the hashes are stored on-chain. Verification is performed by:
1. Victim provides their original data off-chain
2. System rehashes and compares
3. On-chain contract confirms match without revealing data

---

## SMS Integration Architecture

Victims in disaster zones often lack smartphones. ReliefMesh supports SMS:

```
Victim SMS → Twilio Gateway → ReliefMesh API → Soroban Contract
                                     ↓
                              Balance inquiry
                              Cashout initiation
                              OTP verification
```

SMS commands:
- `BAL` → Check available balance
- `CASH <amount> <shopkeeper_id>` → Initiate cashout
- `HIST` → Transaction history

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Victim identity exposure | ZK commitment hash on-chain only |
| Shopkeeper price gouging | Daily limits + clawback mechanism |
| Unauthorized distributions | Admin-only distribution functions |
| Smart contract pause | Emergency pause on ReliefPool |
| Double-spending | Aid balance tracking on-chain |
| Corrupt admin | Multi-sig requirement (future) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar Soroban |
| Smart Contracts | Rust + Soroban SDK |
| Token | USDC (Circle) on Stellar |
| Frontend | Next.js 14, TypeScript |
| Styling | Tailwind CSS + Custom Design System |
| Wallet | Freighter, Albedo |
| Charts | Recharts |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |

---

## Deployment

- **Contracts:** Deployed to Stellar Testnet (Futurenet for development)
- **Frontend:** Vercel
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)

---

## Environment Variables

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
NEXT_PUBLIC_RELIEF_POOL_CONTRACT=C...
NEXT_PUBLIC_VICTIM_REGISTRY_CONTRACT=C...
NEXT_PUBLIC_SHOPKEEPER_REGISTRY_CONTRACT=C...
NEXT_PUBLIC_CLAWBACK_CONTROLLER_CONTRACT=C...
NEXT_PUBLIC_USDC_TOKEN=C...
```
