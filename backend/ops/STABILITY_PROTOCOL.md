# 🛡️ Stability Window Protocol (Silent Running)

**Status:** ACTIVE
**Start Date:** 2026-02-16
**Duration:** Minimum 14 Days
**Exit Criteria:** 14 Days of Zero Unexplained Anomalies.

## 🛑 The Prime Directive
**"Infrastructure earns trust by surviving boredom."**
- **NO** new features.
- **NO** refactors.
- **NO** manual database edits.
- **NO** "quick fixes" unless critical severity.

---

## 📅 Daily Protocol (The Heartbeat)
*Execute every 24 hours.*

### 1. Financial Reconciliation
- **Command:** `venv\Scripts\python.exe scripts\verify_wallet_reconciliation.py`
- **Success Criteria:**
  - ✅ "RECONCILIATION PASSED"
  - ✅ Wallet Total + Escrow Total = System Total
  - ✅ 0 Mismatches
  - ✅ 0 Negative Balances
- **Action on Failure:**
  - 🛑 **STOP EVERYTHING.**
  - Capture DB snapshot immediately.
  - Do not restart server until root cause identified.

### 1.5 Snapshot Hashing (Tamper Signal)
- **Action:** After reconciliation passes, the script must:
  1. Export: `Total Wallet | Total Escrow | Wallet Count | Escrow Count`
  2. Generate SHA256 Hash of this string.
  3. Append to `ops/reconciliation_history.log`.
- **Purpose:** Detect historical drift or log tampering.

### 2. Log Review (Error Shape)
- **Check:** `error.log` or Sentry Dashboard.
- **Allowed Errors:**
  - `Throttled` (429) - Normal background radiation.
  - `ValidationError` (400) - User typos.
- **Forbidden Errors (Investigate Immediately):**
  - `500 Internal Server Error` (Logic crash).
  - `IntegrityError` (DB constraint violation).
  - `OperationalError` (DB connection/lock timeout > 1%).
- **Warning:** Watch for *Recurring Anomalies* (e.g. same 500 once/day, same slow query). Patterns kill stability.

---

## 🗓️ Weekly Protocol (The Health Check)
*Execute on Day 7 and Day 14.*

### 1. Trend Analysis
- **Volume:** Are transaction counts stable?
- **Log Volume:** Grows linearly with transactions? (Exponential = Retry Storm).
- **Latency:** Is P95 latency flat? (Rising latency = Memory leak / Table bloat).
- **Escrow:** Count `HELD` vs `RELEASED`. (Growing `HELD` pile = Stuck workflows).

### 2. Security Review
- **Throttle Events:** Spike in `login` throttling? (Brute force attack).
- **Admin Actions:** Any manual overrides logged?

---

## 💉 Controlled Injection (Day 7)
*Mid-window stress test.*
1. **Replay Webhook:**
   - Valid replay (Verify Idempotency).
   - Replay after terminal state (Verify State Machine).
   - Replay after small delay (Verify Network Lag Idempotency).
2. **Attempt Split Verdict:** Verify Stability Guard raises error.
3. **Trigger Rate Limit:** Verify 429 response.

**Expected Result:** System rejects gracefully (400/409/429), Logs it, Does not panic.

---

## 🏁 Completion Criteria (Day 15)
- [ ] 14 Daily Reconciliations Passed.
- [ ] No variation in Error Categories.
- [ ] No unexplained performance drift.

**signed:** *Antigravity OPS*
