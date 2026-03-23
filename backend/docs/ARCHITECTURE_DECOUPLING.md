# Sovereign Decoupling Architecture

**Phase:** 26 (Preparatory Sovereignty)  
**Axis:** 3 (Sovereign Decoupling)  
**Status:** 📝 **Drafting**

---

## 🏛️ Executive Strategy

The goal of Sovereign Decoupling is to ensure that ReadyRent.Gala is not permanently tethered to any single technology stack, platform, or governance entity. We are preparing the system to survive the transition from **Centralized Web2** to a **Sovereign Hybrid** model.

We achieve this by treating **Identity**, **Logic**, and **Value** as three independent layers.

---

## 🔑 Layer 1: Identity Decoupling (The Soul)

Current systems equate "User" with a row in a database (`users_user` table). In a sovereign system, the user owns their identity; the system only recognizes it.

### Current State (Web2)
- **Primary Key:** `User.id` (Auto-increment integer)
- **Auth:** Django Session/Token
- **Risk:** If the database is lost or the host deletes the user, the user's judicial history vanishes.

### Decoupling Transition
- **Introduction of the "Sovereign Pointer":** Add a `did` (Decentralized Identifier) or `public_key_address` field to the User model as an optional but preferred identifier.
- **Abstracting the Profile:** Move PII (Name, Phone) into an encrypted "Profile Metadata" blob that could eventually reside on-chain or in IPFS, while the system only holds the hash.

---

## ⚖️ Layer 2: Dispute Logic Decoupling (The Mind)

The rules of justice should be verifiable, even if the backend code changes.

### Current State (Web2)
- **Logic:** Python functions in `apps.disputes.services`.
- **Verdict:** Stored as status strings in DB.
- **Risk:** Logic is opaque to the user.

### Decoupling Transition
- **The Protocol-First Model:** Formalize dispute logic into a "Standard Ruleset" that can be expressed as JSON Schema.
- **Judgment Fingerprinting:** For every final judgment, generate a unique cryptographic fingerprint (Hash of: Dispute Content + Evidence Hashes + Judge ID + Verdict). 
- **Verifiability:** A user should be able to verify that "Dispute X led to Verdict Y" using only the fingerprint and the raw data, without running the full Django stack.

---

## 💰 Layer 3: Funds Flow Decoupling (The Body)

Financial settlement is currently managed via traditional banking/payment gateways.

### Current State (Web2)
- **Escrow:** Managed by the system's ledger.
- **Payouts:** Triggered by API calls to payment providers.
- **Risk:** Funds can be frozen by banks or system hosts.

### Decoupling Transition
- **The Escrow Oracle Pattern:** The system currently acts as the "Owner" of funds. In a decoupled model, the system acts as an "Oracle" that provides a "Judgment Proof" to a third-party settlement layer (e.g., a multi-sig wallet or smart contract).
- **Abstracting the Payment Gateway:** Establish a `PaymentBroker` interface that doesn't care if the settlement is USD via Stripe or ETH via Metamask.

---

## ⛓️ On-Chain Transition Points (The Bridge)

ReadyRent.Gala will not move to a blockchain today, but it remains **Web3-Ready** through these bridges:

1. **Evidence Anchorage:** Periodic hashing of `EvidenceLog` entries into a public ledger to prove audit trail integrity.
2. **Judgment NFT (Future Concept):** Finalized judgments as immutable records that users carry with them across platforms.
3. **Decentralized Storage (IPFS):** Moving large evidence files out of local storage into content-addressed storage.

---

## 🏁 Summary for Architects
When writing new code in Phase 26, follow the **"Oracle Rule"**:
> _Design every feature as if the system is just an advisory oracle, and the actual execution happens elsewhere._
