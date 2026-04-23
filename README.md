<p align="center">
  <img src="https://img.shields.io/badge/ReliefMesh-Institutional_Disaster_Relief-gold?style=for-the-badge&logo=stellar&logoColor=white" alt="ReliefMesh Banner" />
</p>

# 🌐 ReliefMesh: Decentralized Aid Infrastructure
> **The institutional bridge for trustless disaster relief on Stellar Soroban.**

[![Live Demo](https://img.shields.io/badge/Demo-Live-gold?style=for-the-badge)](https://reliefmesh.vercel.app)
[![Stellar Network](https://img.shields.io/badge/Network-Stellar_Testnet-blue?style=for-the-badge)](https://stellar.org)
[![Build Status](https://img.shields.io/github/actions/workflow/status/shashank121-arch/reliefmesh/deploy.yml?style=for-the-badge)](https://github.com/shashank121-arch/reliefmesh/actions)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📖 Executive Summary
ReliefMesh is an institutional-grade disaster relief platform designed to eliminate the **30% loss to corruption** in humanitarian aid. By leveraging the **Stellar Soroban** smart contract ecosystem, we provide a zero-knowledge, audited infrastructure that ensures funds move from donor vaults to victims' hands in under 5 seconds.

### 🏛️ Institutional Core
- **Zero-Corruption Clawback:** Absolute protection against shopkeeper fraud.
- **Zero-Knowledge Privacy:** Cryptographic victim identity protection.
- **Hyper-Localized Liquidity:** A distributed network of human-ATMs.

---

## ⚡ Quick Links
| Resource | Destination |
| :--- | :--- |
| **Relief Dashboard** | [https://reliefmesh.vercel.app](https://reliefmesh.vercel.app) |
| **Technical Docs** | [https://reliefmesh.vercel.app/docs](https://reliefmesh.vercel.app/docs) |
| **MVP Demo Video** | [Watch Walkthrough](https://www.loom.com/share/7f832fe9a4954247b2a7b114cdb57e43) |
| **Feedback Form** | [Submit Product Feedback (Google Form)](https://docs.google.com/forms/d/e/1FAIpQLSeorizQkfROi-zPbnD7yZMFkUUJ_kNpSrGuL-pEfGxaM7JliQ/viewform?usp=header) |
| **Response Sheet** | [View Live Feedback Responses](https://docs.google.com/spreadsheets/d/1PSzye-wuJ-IERrbvngL_10ZXESR9Wfln2hqRRMXbNpI/edit?gid=176044406#gid=176044406) |
| **Feedback Analysis** | [View user_onboarding_responses.csv](./user_onboarding_responses.csv) |

---

## 🏗️ Technical Architecture

ReliefMesh operates as a coordinated suite of 4 core smart contracts, communicating via cross-contract calls on the Stellar Testnet.

```mermaid
graph TD
    subgraph "Governance"
        Admin[Charity Admin]
        Admin -- Configures --> Pool[Relief Pool Contract]
    end

    subgraph "Soroban Core"
        Pool -- Verifies --> Registry[Victim Registry]
        Pool -- Authorizes --> Shopkeepers[Shopkeeper Registry]
        Clawback[Clawback Engine] -- Secures --> Pool
    end

    subgraph "Field Interaction"
        Victim[Victim / Refugee]
        Partner[Local Shopkeeper]
        Victim -- Proof of ID --> Pool
        Partner -- Fiat Cashout --> Victim
    end
```

---

## 📜 On-Chain Identity (Verified Testnet)

| Contract | Purpose | Explorer Link |
| :--- | :--- | :--- |
| **🏦 Relief Pool** | Vault & Logic | [`CC7YA6...7NDKOQ`](https://stellar.expert/explorer/testnet/contract/CC7YA6JI5RGCQRLLWOIXOYJB7OWTGFSA2ZBYH53NCEDDIFEKGF7NDKOQ) |
| **👤 Victim Registry** | Privacy Layer | [`CBKJIC...7E5BE`](https://stellar.expert/explorer/testnet/contract/CBKJIC6P7DIU45XUMWWGMK3ZU4Y5VE5DW5AKT7L46IN5YKUKC4XBC7NX) |
| **🏪 Shopkeeper Reg.** | Liquidity Logic | [`CBHOYQ...MAE2J`](https://stellar.expert/explorer/testnet/contract/CBHOYQJ5LQUSIK3A44QJTB4P7RGBOESLI5MTMA3KUFSRDFJ5MMAE2J4K) |
| **🛡️ Clawback Engine** | Asset Control | [`CDIZM7...AU54P`](https://stellar.expert/explorer/testnet/contract/CDIZM765ESUUB3SJ4XR645LJMWATDYVS222HOBYP7IBFZ7EQJXYAU54P) |

---

## 🛡️ Security & Trust Model

### 1. Zero-Corruption Clawback
ReliefMesh utilizes **Clawback-enabled Trustlines**. If a community reports shopkeeper fraud (backed by evidence), the Admin can execute a Soroban transaction that "yanks" the suspicious funds out of the shopkeeper's account instantly.

### 2. Privacy Architecture
No Names, Phone Numbers, or ID numbers are stored on-chain.
- **Process:** `Identity ID + Salt` -> `Client-side SHA-256` -> `Hex String`.
- **Result:** The ledger proves a unique individual received aid without revealing *who* that individual is.

### 3. Verification & AI-Audited
Our repository runs a strict **GitHub Actions (CI/CD)** pipeline:
- **Contract Tests:** 100% test coverage (59/59 tests passing).
- **Wasm Optimization:** Compiled with `opt-level = "z"` for lowest gas fees.

---

## 👥 Real-World Impact (User Onboarding & Feedback)

ReliefMesh has been successfully stress-tested by independent testers. This phase focused heavily on onboarding 5 unique users and gathering product feedback to drive development.

### User Onboarding

We engaged 5 unique users to test our infrastructure.

| User Name | User Email | User Wallet Address |
| :--- | :--- | :--- |
| **Yash Annadate** | yashannadate2005@gmail.com | [`GBHHRIX...N4SJ`](https://stellar.expert/explorer/testnet/account/GBHHRIX4A4VKB74UCN76EZQI35VFIJ5RIXR3UO2XKUFUSV4JSUAYN4SJ) |
| **Thanchan Bhumij** | thanchanb@gmail.com | [`GCJXX4R...ZVBZ`](https://stellar.expert/explorer/testnet/account/GCJXX4RSJAMH2RVCOES46AJRNEE6NYSGA6I3YTVLCVQCMPG3FWCLZVBZ) |
| **Mrunal Ghorpade** | mrunalghorpade16@gmail.com | [`GCMAU6J...NAAS`](https://stellar.expert/explorer/testnet/account/GCMAU6JG7JTBQ6UCDZQU2ZJOMNNPNJIDVQ2IYHAH5LTIZAK6THXRNAAS) |
| **Aditya Shisodiya** | adityasisodiya56412@gmail.com | [`GDONTRQ...J4QR`](https://stellar.expert/explorer/testnet/account/GDONTRQTWMUD5GELLKSBEXEZJ2VYB3FL2SC7HSQVXP4OZVUMFOTJ4LQR) |
| **Nishit Bhalerao** | nishitbhalerao@gmail.com | [`GBOALOA...NUKT`](https://stellar.expert/explorer/testnet/account/GBOALOAFBVSIH2Z2344H5Z2CXDPNLUIFTR4UKWBSMPY4TIF2GNUENUKT) |

## User Feedback Summary

### Google Form
[Product Feedback Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeorizQkfROi-zPbnD7yZMFkUUJ_kNpSrGuL-pEfGxaM7JliQ/viewform?usp=header)

### Live Responses
[Feedback Response Sheet](https://docs.google.com/spreadsheets/d/1PSzye-wuJ-IERrbvngL_10ZXESR9Wfln2hqRRMXbNpI/edit?gid=176044406#gid=176044406)

### What We Changed Based on Feedback

| Feedback Received | Change Made | Commit |
|---|---|---|
| App purpose not clear | Added How It Works section | [`5acfca2`](https://github.com/shashank121-arch/reliefmesh/commit/5acfca223dd43136587091899e72d121dbd28092) |
| Numbers confusing | Added stat tooltips | [`f8d8d91`](https://github.com/shashank121-arch/reliefmesh/commit/f8d8d91778c746aa2aebd3c4a1dd176a732cd589) |
| New users confused | Added getting started banner | [`d04f189`](https://github.com/shashank121-arch/reliefmesh/commit/d04f18968908c714f914a40ee28b5ea70feb02ec) |
| No confirmation shown | Added TX success screen | [`7cfbfc4`](https://github.com/shashank121-arch/reliefmesh/commit/7cfbfc49b45a6a7bdcc4041a865a9d56f452ad9f) |
| Contact link broken | Fixed mailto link | [`fc22f2b`](https://github.com/shashank121-arch/reliefmesh/commit/fc22f2b98bb61e16ec87fb1916c524fad02de73a) |

### Next Phase Improvements
Based on feedback we plan to:
1. Add SMS simulation for offline victims
2. Add multi-language support for India
3. Add disaster event management
4. Improve mobile experience
---

## 🚀 Product Evolution & Roadmap

Based on initial tester feedback, we've already completed our first development iteration.

- **Iteration 1 (Completed):** Optimized frontend connectivity and performed a comprehensive **UI/UX Audit** with 5 beta testers to verify wallet signing and trustline establishment.
- **Git Proof:** [Commit b34ab70: Permission Refinement](https://github.com/shashank121-arch/reliefmesh/commit/b34ab70)
- **Technical Focus:** This iteration focused on the **User Onboarding Bridge**—verifying that victims and shopkeepers can securely link their Stellar identities without technical friction.


---

## 🛠️ Local Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/shashank121-arch/reliefmesh
   cd reliefmesh/frontend && npm install
   ```
2. **Environment**: Update `.env.local` with the contract addresses above.
3. **Launch**: `npm run dev`

---

<p align="center">
  © 2025 ReliefMesh. Built for the Stellar Soroban Ecosystem. <br>
  <b>Open Source. Transparent. Human-Centric.</b>
</p>