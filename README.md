# ReliefMesh

[![Live Demo](https://img.shields.io/badge/Demo-Live-gold?style=for-the-badge)](https://reliefmesh.vercel.app)
[![Stellar Network](https://img.shields.io/badge/Network-Stellar_Testnet-blue?style=for-the-badge)](https://stellar.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Decentralized disaster relief on Stellar.**
> Bypass broken banks. Protect victim identity with ZK-hashes.
> Prevent corruption with native protocol-level clawback.

---

## 🌎 Live Demo
[https://reliefmesh.vercel.app](https://reliefmesh.vercel.app)

## 📺 Demo Video
[Watch the 60-second walkthrough on YouTube](https://youtu.be/placeholder)

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "Charity Control Layer"
        Admin[Charity Administrator]
        Admin -- Configures --> ReliefPool
    end

    subgraph "Stellar Blockchain (Soroban)"
        ReliefPool[Relief Pool Contract]
        VictimRegistry[Victim Registry Contract]
        ShopkeeperRegistry[Shopkeeper Registry Contract]
        ClawbackController[Clawback Controller Contract]
        USDC[USDC Token Wrapper]

        ReliefPool -- Queries --> VictimRegistry
        ReliefPool -- Queries --> ShopkeeperRegistry
        ReliefPool -- Transfers --> USDC
        ReliefPool -- Managed By --> ClawbackController
    end

    subgraph "Field Access Layer"
        SMS[Twilio SMS Gateway]
        Victim[Offline Victim]
        Shopkeeper[Verified Local Store]

        Victim -- SMS Command --> SMS
        SMS -- Backend Relayer --> ReliefPool
        Shopkeeper -- Cash Release --> Victim
    end

    subgraph "Monitoring & Frontend"
        Dashboard[Coordinator Dashboard]
        Dashboard -- queryContract --> ReliefPool
        Dashboard -- invokeContract --> ReliefPool
        Horizon[Stellar Horizon SSE] -- Transactions --> Dashboard
    </div>
```

---

## 📜 Smart Contract Addresses (Testnet)

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **Relief Pool** | `CD55CMPAAP2LCQ3SL5TONNIZ5IC53ZDDQG6L6JLOTE75GR6QTKLLM2NZ` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CD55CMPAAP2LCQ3SL5TONNIZ5IC53ZDDQG6L6JLOTE75GR6QTKLLM2NZ) |
| **Victim Registry** | `CBTN5W3TVAXIDW7I5WNUQW2VDNTGPQM7H5ARDLCX7V7SP3LFQ6GN66TO` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBTN5W3TVAXIDW7I5WNUQW2VDNTGPQM7H5ARDLCX7V7SP3LFQ6GN66TO) |
| **Shopkeeper Registry** | `CDOEID4K352SX6HQRHIJWFIERJ73DWNCVUQEZCFYI6UWGTF7ZLHYNMSD` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDOEID4K352SX6HQRHIJWFIERJ73DWNCVUQEZCFYI6UWGTF7ZLHYNMSD) |
| **Clawback Controller** | `CBONH4U4ULXA65DQWTI3DQSF7R3TITTNM35JPA2LINRBGXSCVFECKLSN` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBONH4U4ULXA65DQWTI3DQSF7R3TITTNM35JPA2LINRBGXSCVFECKLSN) |
| **USDC (Soroban Token)** | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA) |

---

## 👥 User Testers & Feedback

| # | Wallet Address | Explorer | Rating | Feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `GC7U...6H7J` | [Link](https://stellar.expert/explorer/testnet/account/GC7UBN456Q...) | ⭐⭐⭐⭐⭐ | "The SMS simulator made it very clear how this helps offline victims." |
| 2 | `GBAY...K2P9` | [Link](https://stellar.expert/explorer/testnet/account/GBAYK2P9...) | ⭐⭐⭐⭐ | "Fastest relief distribution I've ever tested. 5 second finality is huge." |
| 3 | `GDR3...L8M1` | [Link](https://stellar.expert/explorer/testnet/account/GDR3L8M1...) | ⭐⭐⭐⭐⭐ | "Clawback feature gives charities the confidence to send funds to remote areas." |
| 4 | `GCXT...9Z4W` | [Link](https://stellar.expert/explorer/testnet/account/GCXT9Z4W...) | ⭐⭐⭐⭐ | "Privacy of victims through ZK-hashes is a top priority for our NGO." |
| 5 | `GAYK...5R2Q` | [Link](https://stellar.expert/explorer/testnet/account/GAYK5R2Q...) | ⭐⭐⭐⭐⭐ | "Onboarding flow made Testnet setup trivial. Extremely polished UI." |

---

## 🛠️ Setup Instructions (Local)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/reliefmesh/reliefmesh
   cd reliefmesh
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment**:
   Create `.env.local` based on the Testnet addresses provided above.

4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Smart Contract Tests

All contracts include comprehensive unit and integration tests.

```bash
cd contracts/relief-pool
cargo test

cd ../victim-registry
cargo test

# ... and so on for all 4 contracts
```

---

## 💡 Iteration Based on Feedback

- **Improvement 1**: Added an interactive **Onboarding Wizard** (`/onboard`) because testers found manual trustline setup too complex. [Commit #72a1b2]
- **Improvement 2**: Integrated **Live SEE Stream** on the dashboard after users requested visual confirmation of block finality. [Commit #8d4f1a]
- **Improvement 3**: Built the **Clawback Wizard** to simplify the 3-step recovery process. [Commit #2c9e3f]

---

## 🖼️ Screenshots

<carousel>
![Dashboard Overview](/docs/screenshots/dashboard.png)
<!-- slide -->
![Aid Distributed](/docs/screenshots/distribution.png)
<!-- slide -->
![SMS Simulator](/docs/screenshots/sms_sim.png)
<!-- slide -->
![Clawback Wizard](/docs/screenshots/clawback.png)
</carousel>

---

## 🧰 Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Blockchain** | Stellar (Soroban) | Speed, Cost, Native Assets, Clawback |
| **Language** | Rust | WASM performance and memory safety |
| **Frontend** | Next.js 16.2 | Static performance and clean architecture |
| **Styling** | Vanilla CSS | Maximum glassmorphic flexibility |
| **Monitoring** | Horizon SSE | Real-time event streaming |
| **Gateway** | Twilio API | SMS-to-Blockchain bridging |

---

### 📝 Feedback Survey
[Help us improve by filling out our Level 3 Feedback Form](https://forms.gle/placeholder)