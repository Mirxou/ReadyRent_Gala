# Escrow Engine Threat Model
**System:** ReadyRent.Gala Financial Core
**Date:** 2026-02-15
**Status:** HARDENED (Phase 3.5)

## 1. System Scope
The **EscrowEngine** is the authoritative state machine governing all financial transactions within the platform. It is a closed system that manages the lifecycle of `EscrowHold` objects and their associated `Wallet` transactions.

### Core Components
- **EscrowEngine:** Stateless logic class enforcing transitions.
- **EscrowHold:** The stateful model representing a locked transaction.
- **Wallet:** The ledger model storing user balances.
- **AuditLog:** Immutable record of all state mutations.

### Trust Boundaries
| Boundary | Trust Level | Description |
| :--- | :--- | :--- |
| **User → API** | Untrusted | All inputs (disputes, cancellations) are adversarial. |
| **API → Engine** | Semi-Trusted | API layers must assume engine enforces rules, but engine validates callers. |
| **Engine → DB** | Trusted | Engine assumes atomic access to PostgreSQL (enforced via locking). |
| **Gateway → Webhook** | Untrusted | Webhooks are authenticated via signature, but treated as potential replay attacks. |

## 2. Resolved Threats
The following threats have been mitigated through architectural hardening:

### 🛡️ Direct State Mutation
- **Threat:** A developer or service bypassing the engine to set `hold.state = RELEASED` directly.
- **Mitigation:**
    - **Model Guard:** `EscrowHold.save()` serves as a secondary check, raising errors if state changes outside the engine context (though currently soft-enforced).
    - **Architecture Guard:** CI/CD pipeline scans for any code matching `state =` assignment outside of `engine.py`.
    - **Status:** **BLOCKED**

### 🛡️ Double Spend / Race Conditions
- **Threat:** Two concurrent requests (e.g., "Cancel" and "Complete") attempting to release funds simultaneously, resulting in double payout.
- **Mitigation:**
    - **Pessimistic Locking:** `select_for_update()` is used on the `EscrowHold` row for the duration of any transition.
    - **Atomic Transactions:** All DB writes (Hold update + Wallet credit + Audit log) occur in a single `transaction.atomic()` block.
    - **Status:** **MITIGATED** (Verified via Concurrency Tests)

### 🛡️ Replay Attacks (Webhooks)
- **Threat:** An attacker capturing a valid "Payment Success" webhook and replaying it to trigger multiple credits.
- **Mitigation:**
    - **Idempotency Key:** `even_id` field in `PaymentWebhook` model with `unique=True` constraint.
    - **Status:** **PREVENTED**

### 🛡️ Unauthorized Release
- **Threat:** A user triggering a "Release Funds" action for a booking they don't own.
- **Mitigation:**
    - **Actor Validation:** `transition()` requires an `actor` argument. Permissions are checked upstream, but the Engine records the `actor` in the Audit Log for accountability.
    - **Status:** **MITIGATED** (Relies on upstream Auth, but Engine provides Audit Trail)

### 🛡️ Precision Errors
- **Threat:** Floating point arithmetic causing partial penny loss or gain during splits.
- **Mitigation:**
    - **Decimal Types:** All currency fields use `DecimalField`.
    - **Invariant Checks:** Engine validates `amount >= 0` before and after operations.
    - **Status:** **PREVENTED**

## 3. Remaining Threat Surface
While the application layer is hardened, the following risks remain at the infrastructure/operational level:

### ⚠️ Database Superuser Compromise
- **Risk:** An attacker with direct SQL access to the PostgreSQL database can bypass all application logic.
- **Mitigation:** Strict access controls, IP allow-listing, MFA for database access (Infrastructure Layer).

### ⚠️ Application Server RCE
- **Risk:** Remote Code Execution on the Django server would allow an attacker to import `EscrowEngine` and execute valid transitions.
- **Mitigation:** Container isolation, minimal privileges for app user (Infrastructure Layer).

### ⚠️ Insider Admin Abuse
- **Risk:** A staff member with "Super Admin" privileges using the Django Admin to modify data.
- **Mitigation:** 
    - **Audit Logs:** All admin actions are logged.
    - **Read-Only Admin:** Critical fields should be marked `readonly_fields` in `admin.py`.

## 4. Security Requirements for Future Changes
Any modification to `apps/payments/` MUST:
1.  Pass `test_architecture_enforcement.py`.
2.  Include a new test case in `test_property_engine.py` (Hypothesis).
3.  Be reviewed by at least one Senior Engineer.
