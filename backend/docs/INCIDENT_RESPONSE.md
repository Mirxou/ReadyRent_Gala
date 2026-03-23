# Escrow Incident Response Plan
**System:** ReadyRent.Gala Financial Core
**Date:** 2026-02-15
**Role:** Operational Procedure

## 1. Trigger Conditions
This plan MUST be executed immediately if any of the following occur:
1.  **Invariant Violation:** `EscrowEngine` raises an unexpected `SystemError` or `InvariantError`.
2.  **Audit Divergence:** The sum of `WalletTransaction`s does not match `Wallet.balance`.
3.  **Webhook Flooding:** Detecting >100 requests/second from the payment gateway IPs.
4.  **Database Corruption:** PostgreSQL reports checksum errors or corruption in `payments` schemas.

## 2. Immediate Containment (The "Freeze")
**Objective:** Stop the bleeding. Prevent any further funds from leaving the system.

### Step 1: Activate Maintenance Mode
Stop all incoming HTTP traffic to the API.
```bash
python manage.py sovereign_lockdown --reason="Financial Integrity Check"
```

### Step 2: Disable Payment Gateways
Revoke API keys or disable processing at the Gateway level (e.g., Stripe/BaridiMob Dashboard).

### Step 3: Snapshot Database
Create an immediate backup of the current state for forensics.
```bash
pg_dump -U sovereign sovereign > forensic_snapshot_$(date +%s).sql
```

## 3. Diagnosis & Forensics
**Objective:** Identify the root cause without mutating state.

1.  **Check Audit Logs:**
    Query `AuditLog` for the last 50 entries to see who triggered the anomaly.
    ```sql
    SELECT * FROM audit_auditlog ORDER BY timestamp DESC LIMIT 50;
    ```

2.  **Verify Wallets:**
    Run the `verify_ledger` management command (to be implemented) or manually sum transactions.
    ```sql
    SELECT user_id, SUM(amount) FROM payments_wallettransaction GROUP BY user_id;
    -- Compare with:
    SELECT user_id, balance FROM payments_wallet;
    ```

3.  **Analyze Scope:**
    Is it global (all users affected) or local (specific booking)?

## 4. Remediation
**Objective:** Restore integrity.

### Scenario A: Code Logic Error
1.  Deploy Hotfix to `EscrowEngine`.
2.  Run `test_property_engine.py` to verify fix.
3.  Deploy.

### Scenario B: Data Corruption
1.  Identify affected Rows.
2.  **Calculated Adjustment:** Create `WalletTransaction` of type `correction` to restore balance. **NEVER UPDATE BALANCE DIRECTLY.**
3.  Log the detailed reason in `description`.

## 5. Recovery
1.  Re-enable Payment Gateways.
2.  Lift Maintenance Mode.
3.  Monitor `EscrowEngine` logs for 24 hours.
4.  Publish Post-Mortem Report.
