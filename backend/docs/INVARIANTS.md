# Escrow System Invariants
**System:** ReadyRent.Gala Financial Core
**Date:** 2026-02-15
**Type:** Formal Specification

## 1. The Immutable Laws
The following invariants MUST hold true at the beginning and end of every transaction. If any invariant is violated, the system is considered compromised and must halt all transfers immediately.

### Law 1: Conservation of Value
The sum of all credits and debits for a single transaction set must equal zero.
$$ \sum Credits + \sum Debits = 0 $$
*Practical Application:* A release of 100 DZD from Escrow must result in exactly 100 DZD credited to the Owner's wallet.

### Law 2: The Binary Outcome Principle
A `HELD` transaction can only resolve to one of two terminal states:
1.  **RELEASED:** 100% to Owner.
2.  **REFUNDED:** 100% to Tenant.
*Constraint:* No split processing is allowed in Engine v1.0.

### Law 3: State Monotonicity (Terminality)
Once a `EscrowHold` enters a terminal state (`RELEASED`, `REFUNDED`, `CANCELLED`), it can **never** transition to another state.
*Implementation:* `EscrowEngine.transition()` explicitly raises `TerminalStateError` if `current_state` is in `TERMINAL_STATES`.

### Law 4: Amount Immutability
The `amount` field of an `EscrowHold` object is **immutable** after creation.
*Implementation:* The engine does not expose any method to update `amount`.

### Law 5: The Singularity of Release
For any given `EscrowHold` in a terminal state (`RELEASED` or `REFUNDED`), there must exist **exactly one** corresponding `WalletTransaction` of type `scrow_release` or `escrow_refund`.
*Constraint:* `Count(WalletTransaction) == 1`.

## 2. Temporal Invariants (Flow)
1.  **Pre-Funded:** A booking cannot be confirmed (`HELD`) unless the Tenant's wallet has sufficient funds or the payment gateway has confirmed capture.
2.  **Lock-Before-Release:** Funds must be in `HELD` state before they can be `RELEASED`. Direct transition from `PENDING` to `RELEASED` is forbidden.

## 3. Verification Methods
These invariants are enforced by:
1.  **Runtime:** `EscrowEngine.validate_transition()` checks state machine rules.
2.  **Database:** `UniqueConstraint` on Event IDs prevents replays.
3.  **Testing:** `Hypothesis` Property-Based tests fuzz the engine to try and break these laws.
