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

## Phase 2 (wiring into their flows — next commits)

| Their file | Graft |
|---|---|
| `app/api/bookings/[id]/release-escrow/route.ts` | On release: `depositReturned = depositHeld − lateFee` via `computeDepositReturn`, `ESCROW_RELEASED` email + notification. Rate-limit already theirs. |
| Chargily webhook (`checkout.paid`, dedup via `ProcessedWebhookEvent`) | On paid: capture `depositHeld = product.depositAmount` (or 30% sovereign rule from `calculate-deposit`) into the Booking, `PAYMENT_RECEIPT` + `MERCHANT_ORDER_ALERT` emails. |
| `app/api/reviews/create/route.ts` | Require a **COMPLETED booking owned by the session user**, set `bookingId` + `isVerified=true`; unique constraint enforces one review. |
| `refund-escrow/route.ts` | Mirror accounting: `depositReturned=0`, `escrowStatus=refunded`, notification. |
| Storefront UI | Price breakdown + deposit badge (green "بدون وديعة" variant) on product cards; "قيّم الآن" prompt gated on completed bookings. |

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
