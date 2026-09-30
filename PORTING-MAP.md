# PORTING MAP — Grafting «كراء بلا همّ» Trust Engine into STANDARD.Rent

Branch: `feat/escrow-trust-engine` (branched from `main` @ `393d47f`)
Source baseline: P0+P1+P2 trust-engine implementation (escrow accounting,
late-fee machine, email outbox, review gating) — squashed commit
`feat: complete escrow, late-fee cron, review gating, and email notifications`.

## Why a graft and not a merge/replace

The two codebases are **unrelated histories** describing the same product:

| | STANDARD.Rent (remote) | كراء بلا همّ (sandbox) |
|---|---|---|
| Width | Huge: Chargily Pay, KYC, contracts, disputes, payouts, admin, CMS, analytics | Narrow: one rental loop done end-to-end |
| Financial depth | `escrowStatus` **flag** (none/held/released) — **no amounts on Booking** | Full DZD accounting: held / returned / lateFee / cap |
| Overdue | **absent** (no status, no accrual, no cron) | OVERDUE + 30%/day capped at deposit + one-shot warning |
| Email | Resend, fire-and-forget | Durable EmailLog outbox (audit trail) |
| Review gate | any logged-in user, unverified, unlimited | one review per COMPLETED booking (unique constraint) |

A whole-tree push would have destroyed Chargily/KYC/Docker/10 PRs.
So: **feature grafting** — port the missing organs into their body.

## Grafted in phase 1 (this branch)

1. `prisma/schema.prisma`
   - `Booking`: `depositHeld`, `depositReturned`, `lateFeePerDay`, `lateFee`,
     `lateWarningSent`, `overdueAt` + `overdue` added to status vocabulary.
     *`escrowStatus` says WHERE the money is; these fields say HOW MUCH.*
   - `Review`: `@@unique([bookingId])` — one review per booking (nullable-safe;
     legacy bookingless reviews stay legal).
   - New `EmailLog` model (`email_logs`) — durable outbox.
2. `lib/escrow.ts` — pure money math: quote breakdown, 30% daily late fee,
   **capped at deposit**, deposit-return math, DZD formatting. No I/O.
3. `lib/email-outbox.ts` — `queueEmail()`: persist → deliver via existing
   `lib/email.ts` (Resend) → mark sent/failed. **Never throws**; a provider
   outage degrades delivery, never the audit trail. RTL Arabic HTML wrapper.
4. `lib/late-check.ts` — idempotent sweep:
   - `confirmed|active` + past `endDate` + `escrowStatus=held` → `overdue`,
     rate frozen, `overdueAt` set.
   - **One-shot** `LATE_WARNING` email + in-app `Notification` before fees bite
     (guarded by `lateWarningSent`).
   - Already-overdue bookings keep accruing, capped at `depositHeld`.
5. `lib/scheduler.ts` + `instrumentation.ts` — 30s sweep on boot; hot-reload
   and build-phase safe.

## Phase 2 (WIRED — this branch, Chargily ↔ Escrow marriage)

The deposit is no longer phantom money. One rule (`computeDepositHeld`:
explicit `product.depositAmount` wins, else 30% of rental basis — the same
"sovereign 30%" their own calculate-deposit endpoint documents) now governs
the charge, the hold, the release and the refund.

| Their file | What was wired |
|---|---|
| `app/api/payments/chargily/checkout/route.ts` | Charge = `totalPrice + depositHeld` (one checkout, full hold). Response carries the honest breakdown (`amount`, `rent_amount`, `deposit_amount`). |
| `app/api/payments/webhook/route.ts` | On `checkout.paid` (inside the atomic tx): Booking lands **`depositHeld`** + **`lateFeePerDay`** frozen at capture. After tx: `PAYMENT_RECEIPT` (renter) + `MERCHANT_ORDER_ALERT` (vendor user) via outbox. |
| `app/api/bookings/[id]/release-escrow/route.ts` | `overdue` now releasable. Settlement: `lateFee` (sweep-frozen, with on-the-fly fallback capped at deposit) → `depositReturned = depositHeld − lateFee` persisted. `ESCROW_RELEASED` tx = collateral returning to renter; `PayoutRecord` = rent **+ late-fee compensation** to vendor. Outbox: `ESCROW_RELEASED` statement + `REVIEW_INVITE`. |
| `app/api/bookings/[id]/refund-escrow/route.ts` | Refunds the **full captured amount** (`payment.amount` = rent + deposit); `depositReturned = depositHeld`. |
| `app/api/reviews/create/route.ts` | **The COMPLETED gate**: `booking_id` required → exists → owned by session user → same product → `status === 'completed'`. One review per booking (`@@unique` + friendly 409). Breaking contract for anonymous product-only reviews — intentional. |
| `app/api/bookings/calculate-deposit/route.ts` | Emits `total_charged` + `breakdown{rental_fee, security_deposit}` + `deposit_mode` — the fields the checkout UI already reads. UI lights up with zero frontend edits. |
| `lib/escrow.ts` | + `SOVEREIGN_DEPOSIT_RATE`, `computeDepositHeld()`. |

Money invariants (auditable chain): `charge = rent + deposit` →
`release: vendor = rent + lateFee, renter = deposit − lateFee` →
`refund: renter = rent + deposit`. Platform touches nothing; every number
comes from `lib/escrow.ts`.

Still open (P3): storefront UI badges, `PayoutRequest` merchant withdrawal
loop (CCP/RIB/BaridiMob + admin queue), services/bundles booking parity.

## P3 roadmap (after PR merges)

1. **Chargily ↔ Escrow bridge** — real money in, escrow capture on webhook.
2. **Merchant payout loop** — Chargily has NO payout API (noted in their own
   code: "Yassir model"). Build `PayoutRequest` flow: merchant CCP/RIB or
   BaridiMob info → admin processing queue (pending → processed) → complete
   the 360° money path.
3. Admin panel extensions last (they already have one) — dispute + payout ops.

## Verification

- `bun install` + `bunx prisma generate` + `bun run type-check` on this branch.
- No runtime behavior of existing flows is modified in phase 1 (additive only).
