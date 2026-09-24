# Worklog — Rental Platform (كراء بلا همّ)

Project: Next.js 16 rental marketplace with escrow deposits, transparent pricing,
email notifications (P2) and completed-gated reviews. Arabic RTL UI, SQLite + Prisma.

---
Task ID: 1
Agent: main orchestrator (Z.ai Code)
Task: Data foundation + shared libs before dispatching build agents

Work Log:
- Defined prisma/schema.prisma: Merchant, Customer, Item, Booking (escrow fields:
  deposit/depositHeld/depositReturned/lateFee/lateFeePerDay, status machine
  PENDING_PAYMENT→CONFIRMED→OVERDUE→COMPLETED), Review (unique bookingId), EmailLog (outbox).
- bun run db:push — OK (db/custom.db).
- Wrote src/lib/types.ts — shared DTOs + API contract types (ItemDTO, BookingDTO,
  EmailDTO, response envelopes).
- Wrote src/lib/escrow.ts — quote breakdown (rental+deposit+insurance), countDays,
  computeLateFeePerDay (30% of daily rate), computeAccruedLateFee (per late day,
  capped at deposit), formatDZD.
- Wrote src/lib/email.ts — sendEmail(): simulated provider persisting to EmailLog.
- Wrote src/lib/late-check.ts — runLateCheck(): CONFIRMED+past endDate → OVERDUE +
  LATE_WARNING email (once, lateWarningSent flag); OVERDUE keep accruing fee.
- Wrote src/lib/scheduler.ts + src/instrumentation.ts — 30s interval sweep via
  Next.js instrumentation register().
- Wrote prisma/seed.ts + ran it: 3 merchants, 2 customers, 6 items, 2 completed
  historical bookings + 2 reviews. Item images referenced at /items/*.png.
- Launched 6 background z-ai image jobs → public/items/{tent,bike,vacuum,camera,generator,projector}.png

Stage Summary:
- DB schema live and seeded. Shared contract in src/lib/types.ts is the single
  source of truth for API shapes. Escrow/email/late-check logic centralized in libs.
- API routes and frontend are built by Task 2-a / 2-b agents against these contracts.

---
Task ID: 2-a
Agent: full-stack-developer
Task: Build all API routes for rental platform

Work Log:
- Read worklog.md + src/lib/{types,escrow,email,late-check,db}.ts and prisma/schema.prisma to conform exactly to the existing contract.
- Created src/lib/dto.ts — shared server-side Prisma→DTO mappers: toMerchantDTO, toCustomerDTO, toReviewDTO (with customerName), toItemDTO (hasDeposit = deposit > 0, injectable rating aggregate {avg rounded to 1 decimal, count}), toBookingDTO (computes isOverdueNow and projectedRefund: COMPLETED ? depositReturned : max(0, deposit - lateFee)), toEmailDTO, plus zodMessage() helper for readable 400 messages. Zero `any`.
- Created src/app/api/items/route.ts — GET (findMany + review.groupBy for ratingAvg/reviewsCount → ItemsResponse) and POST (zod v4 validation, merchant existence check → { item } 201).
- Created src/app/api/bookings/route.ts — GET (optional customerId and/or item.merchantId filters, take 100, newest first, full BookingDTO mapping) and POST (validations: item exists/available, customer exists, endDate > startDate, ≤ 30 days — all 400 with Arabic messages; computes days/countDays + quote/computeQuote + lateFeePerDay; creates PENDING_PAYMENT with depositHeld 0 → { booking } 201).
- Created src/app/api/payments/webhook/route.ts — conditional updateMany({ where: { id, status: PENDING_PAYMENT } }) as an atomic-ish double-payment guard (count 0 → 409 'الحجز مدفوع أو ملغى مسبقاً'); sets CONFIRMED, depositHeld = deposit, paidAt, paymentRef = providerRef ?? `WH-${Date.now()}`; then sends exactly 2 emails: PAYMENT_RECEIPT (customer, 🧾, full rental/ضمان/تأمين breakdown + "سيُفرج عن الضمان بعد تأكيد التاجر للاستلام") and MERCHANT_NEW_ORDER (merchant, 🔔). Returns { booking }.
- Created src/app/api/bookings/[id]/return/route.ts — CONFIRMED/OVERDUE only (else 409); recompute lateFee via computeAccruedLateFee, depositReturned = max(0, deposit - lateFee); sets COMPLETED + returnedAt; sends 🎉 ESCROW_RELEASE email with deposit/late-fee/net-refund breakdown. Next.js 16 async params (`params: Promise<{ id: string }>`).
- Created src/app/api/bookings/[id]/simulate-overdue/route.ts — ⚡ demo tool, CONFIRMED only (else 409); shifts endDate to now - 2 days - 1 hour, keeps startDate = endDate - original duration (guarded never-in-future), then runs runLateCheck() immediately so status flips to OVERDUE + LATE_WARNING email.
- Created src/app/api/cron/late-check/route.ts — GET calls runLateCheck() and returns LateCheckResponse.
- Created src/app/api/reviews/route.ts — POST with strict gating (404 not found, 403 status ≠ COMPLETED with exact required message, 403 customerId mismatch, 409 duplicate via included review relation) → { review } 201; GET ?itemId= (newest first) or latest 50 without itemId.
- Created src/app/api/emails/route.ts — GET with limit (default 50, capped 200) and optional bookingId filter, newest first.
- Created src/app/api/customers/route.ts and src/app/api/merchants/route.ts — simple listings.
- All routes: `export const dynamic = 'force-dynamic';`, zod v4 body validation, Arabic error messages, NextResponse.json envelopes matching types.ts.
- Verification: `bunx eslint src/app/api src/lib --no-warn-ignored` → 0 problems; `bunx tsc --noEmit` → 0 errors under src/ (4 pre-existing errors remain in examples/websocket/* and skills/* — untouched, unrelated); ran throwaway smoke test (.zscripts/api-smoke.ts → deleted) validating computeQuote (incl. rounding), countDays, lateFeePerDay 30%, accrued late fee (3-day case, deposit cap, not-late → 0), refund-never-negative → ALL PASSED. Did not start the dev server, did not touch db.

Stage Summary:
- 11 route files + src/lib/dto.ts created. Endpoints: GET/POST /api/items; GET/POST /api/bookings; POST /api/payments/webhook; POST /api/bookings/[id]/return; POST /api/bookings/[id]/simulate-overdue; GET /api/cron/late-check; GET/POST /api/reviews; GET /api/emails; GET /api/customers; GET /api/merchants.
- Key decisions: (1) payment webhook uses updateMany with status predicate as optimistic concurrency guard against double payment before sending emails; (2) BookingDTO computed fields (isOverdueNow, projectedRefund) are evaluated server-side per request with `now`; (3) items rating aggregation done via one review.groupBy (no N+1); (4) zod error details surfaced in Arabic-wrapped 400s; (5) simulate-overdue delegates all state transitions to runLateCheck so the demo path is identical to the cron path.
- For frontend (2-b): POST /api/items requires merchantId (pick from GET /api/merchants); POST /api/bookings takes ISO date strings; payment simulation = POST /api/payments/webhook { bookingId }; return button = POST /api/bookings/[id]/return; ⚡ demo button = POST /api/bookings/[id]/simulate-overdue; review form = POST /api/reviews { bookingId, customerId, rating, comment? }; email outbox viewer = GET /api/emails?bookingId=; all responses match src/lib/types.ts exactly.

---
Task ID: 2-b
Agent: frontend-styling-expert
Task: Build Arabic RTL single-page rental platform frontend

Work Log:
- Read worklog.md, src/lib/types.ts (DTO shapes + labels) and src/lib/escrow.ts (computeQuote/countDays/formatDZD) before writing any UI; conformed all fetches to the Task-2-a contract.
- Modified src/app/layout.tsx — <html lang="ar" dir="rtl">, Cairo font via next/font/google (subsets arabic+latin, variable mapped to --font-geist-sans so the existing @theme --font-sans mapping picks it up, plus cairo.className on body), metadata title «كراء بلا همّ | منصة كراء المعدات بالضمان», kept the shadcn <Toaster/>, added <Providers> around {children}.
- Modified src/app/globals.css — ONLY appended a .scrollbar-thin utility (webkit + firefox scrollbar styling); theme untouched.
- Created src/components/providers.tsx — QueryClientProvider (retry 1, staleTime 3s) + sonner <Toaster position="top-center" richColors dir="rtl"/> for all toasts.
- Created src/components/rental/api.ts — getJson/postJson/postAction typed helpers, relative URLs only, Arabic error extraction from {error} envelopes.
- Created src/components/rental/primitives.tsx — StatusBadge (color map: amber/emerald/red/slate, no blue), Stars, ItemImage (graceful gradient fallback when /items/* images 404 — seed references .jpg while pngs are still generating), FadeIn (framer-motion), ErrorState (AlertTriangle + إعادة المحاولة), EmptyState, CardsSkeleton/RowsSkeleton/StatsSkeleton.
- Created src/components/rental/price-breakdown.tsx — P1 transparency card: كراء (N أيام × rate) + الضمان (يُحتجز ويُعاد / بدون ضمان) + التأمين → الإجمالي المطلوب اليوم; uses computeQuote + formatDZD.
- Created src/components/rental/review-form.tsx — P2 gated review UI: 5 hover-fill amber stars (+sentiment word), Textarea «شاركنا تجربتك…», POST /api/reviews, helper «التقييم متاح فقط بعد اكتمال الحجز» with Lock icon.
- Created src/components/rental/booking-dialog.tsx — date Inputs (min tomorrow / end ≥ start+1, defaults tomorrow→+3), live PriceBreakdown recomputed per keystroke, POST /api/bookings with midday-anchored ISO dates (TZ-safe), toast + auto-switch to حجوزاتي.
- Created src/components/rental/item-card.tsx — image with category badge overlay, Store merchant line, Stars + reviewsCount, big rate /اليوم, deposit badge (amber Shield «ضمان X يُعاد» vs emerald «بدون ضمان»), hover lift + keyboard accessible.
- Created src/components/rental/browse-tab.tsx — emerald/teal gradient hero strip, category filter chips (الكل + unique), responsive grid sm:2 lg:3, skeletons/error/empty states.
- Created src/components/rental/my-bookings-tab.tsx — غرفة عمليات المستأجر: polling (5s) booking cards with 5-column money grid (التواريخ/الإجمالي/الضمان المحتجز/رسوم التأخير/المُسترجع) + status zones: PENDING_PAYMENT → payment Dialog (same breakdown + gateway simulation note + POST /api/payments/webhook); CONFIRMED → live countdown (يوم/ساعة/دقيقة) + ghost ⚡ simulate-overdue; OVERDUE → red Alert + «أُرسل الإنذار» Mail chip; COMPLETED → green refund row + existing review display OR ReviewForm (rendered only when status === 'COMPLETED').
- Created src/components/rental/merchant-tab.tsx — merchant Select (default first), 4 stat cards (طلبات جديدة/قيد الاستئجار/متأخرة/مكتملة) + revenue strip (rentalPrice of CONFIRMED+COMPLETED), scrollable orders list; «تأكيد الاستلام وفك الضمان» → POST /api/bookings/[id]/return → toast with projectedRefund.
- Created src/components/rental/outbox-tab.tsx — P2 صندوق الصادر: teal intro strip, max-h-[70vh] scrollbar-thin list, per-type colored badges with icons (Receipt/Mail/BellRing/PartyPopper), to/subject/sentAt (ar-DZ), booking-id chip (…last6), collapsible pre-wrap body.
- Rebuilt src/app/page.tsx — sticky backdrop-blur header (emerald Package logo mark, «الضمان محتجز بشفافية» chip, demo identity chip أمين بلقاسم from /api/customers with hardcoded-name fallback), 4 RTL tabs (state in useState, default تصفّح), min-h-screen flex-col root + mt-auto footer mentioning escrow transparency and the simulated email outbox.
- Verification: `bunx eslint src/app/page.tsx src/app/layout.tsx src/components/providers.tsx src/components/rental --no-warn-ignored` → 0 problems; `bunx tsc --noEmit` → 0 errors under src/ (4 pre-existing errors in examples/ + skills/ remain — untouched); grep-verified zero blue/indigo classes and zero absolute URLs/ports in frontend code. Did not run dev server; did not touch prisma/src-lib/api routes.

Stage Summary:
- Single-route Arabic RTL product page complete: تصفّح / حجوزاتي / لوحة التاجر / صندوق الصادر, all client components with TanStack Query (bookings + emails poll every 5s), sonner toasts, skeleton/error/empty states everywhere, framer-motion used sparingly (hero + grids).
- Design decisions: emerald-600 primary CTAs via explicit utilities (kept globals.css theme untouched per constraint); status colors amber=PENDING_PAYMENT, emerald=CONFIRMED, red=OVERDUE, slate=COMPLETED; logical RTL utilities (ms-/me-/ps-/pe-/text-start) throughout; lists capped with max-h + .scrollbar-thin.
- Defensive notes for orchestrator: (1) ItemImage falls back to a gradient placeholder if public/items/* images are missing or extension mismatches (.jpg vs .png); (2) demo customer id comes from GET /api/customers[0] — until it responds, حجوزاتي shows skeletons and the booking dialog disables confirm; (3) dates sent as midday-anchored ISO so countDays matches the server; (4) 403/409 Arabic error bodies surface via toast; (5) if item.imageUrl points to .jpg (per seed) while pngs land, either works through the fallback.

---
Task ID: 3 & 4
Agent: main orchestrator (Z.ai Code)
Task: Integration, image fixes, lint, dev server, end-to-end browser verification

Work Log:
- Fixed item image path mismatch: seed referenced /items/*.jpg but generated files were .png → updated prisma/seed.ts + DB records via script.
- Re-ran failed image jobs sequentially (parallel z-ai image hit 429 rate limits); regenerated generator.png once more to remove Chinese text artifacts.
- bun run lint: clean. Dev server already running; transient "Module not found @/components/providers" during agent hot-reload race, resolved by recompile.
- Agent Browser E2E verification (all passed):
  * Browse: RTL Arabic UI, Cairo font, item cards with AI images, ratings, escrow badges, «بدون ضمان» badge, sticky footer.
  * Booking dialog: P1 transparent breakdown (2×3.500 + 10.000 ضمان + 500 تأمين = 17.500 د.ج) → created PENDING_PAYMENT booking.
  * Payment webhook (الدفع الآن): status → مؤكَّد, escrow held 10.000, countdown timer shown.
  * Outbox: PAYMENT_RECEIPT (full breakdown + WH-ref) + MERCHANT_NEW_ORDER both present.
  * ⚡ simulate-overdue: status → متأخر, late fee 3.150 (3d × 1.050 = 30% daily rate), refund projection 6.850, LATE_WARNING email sent once.
  * Merchant tab (تخييم الصحراء): stats + revenue correct; «تأكيد الاستلام وفك الضمان» → COMPLETED, refund 6.850, ESCROW_RELEASE email with deduction breakdown.
  * Review gating: form appeared ONLY after COMPLETED (P2 rule) → submitted 5★ review → displayed on booking + aggregated on item card (5.0, 2 تقييمات).
  * Mobile 390px & desktop 1440px layouts verified; footer sticky; no console/page errors.

Stage Summary:
- Full P0+P1+P2 platform rebuilt and verified end-to-end. All 4 email types fire at the
  3 critical junctions; review system strictly gated on COMPLETED bookings.
- Deliverables: 13 API endpoints, 11 frontend components, escrow/late-fee engine with
  30s background sweep, simulated email outbox, AI-generated catalog imagery.

---
Task ID: 10
Agent: main orchestrator (Z.ai Code)
Task: Apply P2 to the user's real project (github.com/Mirxou/Ledgererp)

Work Log:
- User clarified their real project lives at github.com/Mirxou/Ledgererp (Pi Network invoice/escrow app)
- Cloned repo to /home/z/Ledgererp, audited stack (Next.js 16 + Prisma/SQLite + Pi SDK + shadcn)
- Mapped rental-P2 concepts onto invoice lifecycle: payment webhook → pi_payment/complete & PATCH paid_escrow;
  late cron → shipping-check (paid_escrow stuck >48h); return endpoint → pi/a2u escrow release & PATCH completed
- Implemented: EmailLog+Review schema, lib/email.ts (outbox + Resend optional), lib/notify.ts (5 templates,
  idempotent), lib/shipping-check.ts + cron endpoint + instrumentation + Vercel crons, /api/reviews (strictly
  gated on completed), /api/emails, review-form.tsx (gated component), outbox tab (7th tab الإشعارات)
- Verified: lint 0, tsc 0, browser E2E full lifecycle (7 notifications, 403/201/409 review rules, UI submit),
  cron idempotent, mobile OK. Dev server now runs Ledgererp on port 3000.
- Committed locally (f971be2); user needs to push to GitHub

Stage Summary:
- The user's actual repo now carries the full P2 closure; local commit ready to push.
- Previous demo app (Tasks 1-4) still exists in /home/z/my-project as a standalone reference build.

---
Task ID: 20 (in progress)
Agent: main orchestrator (Z.ai Code)
Task: Apply P2 to the CORRECT repo — github.com/Mirxou/ReadyRent_Gala (STANDARD.Rent)

Work Log:
- User corrected repo link: ReadyRent_Gala (not Ledgererp). Cloned to /home/z/ReadyRent_Gala.
- Audited: Next.js 16 + Prisma/SQLite + Chargily Pay + session auth + snake_case API envelope
  { success, dignity_preserved, message_ar, data }. Latest commit = P1 storefront/tenant dashboard.
- P2 gap analysis:
  * sendEmail() only used by auth register/forgot-password. ZERO emails at payment/late/return.
  * NO late-check cron anywhere; NO late fee server-side (late_fee_charged is a frontend ghost field).
  * /api/bookings/[id]/return DOES NOT EXIST — vendor orders page POSTs to it (broken 404) and
    expects res.data.data.late_fee_charged in response.
  * release-escrow exists (renter Article-17 confirm) but sends no email.
  * reviews/create ignores booking_id entirely; no completed-gating server-side.
  * review-form.tsx has no status gating; only used on product page without booking context.
- Plan: schema (Booking.lateFeePerDay/lateFee/lateWarningSent + EmailLog), 4 Arabic templates,
  outbox persistence, webhook emails, late-check lib+cron+instrumentation sweep, build missing
  /return endpoint (vendor, computes+caps late fee, releases escrow, emails renter), reviews
  completed-gating, /api/emails outbox, frontend gating (Task 20-b), E2E, commit.

Stage Summary:
- P2 implementation for ReadyRent_Gala underway. Backend = Task 20 (orchestrator), frontend = Task 20-b.
---
Task ID: 20-b
Agent: frontend-styling-expert
Task: P2 frontend — completed-gated ReviewForm, tenant dashboard wiring, overdue status badge

Work Log:
- Installed deps (bun install — node_modules was missing) so the eslint/tsc gates could actually run.
- Read app/api/bookings/route.ts first: GET /api/bookings returns snake_case { id, user_id, product_id, product_name, product_image, start_date, end_date, total_price, status, escrow_status, has_insurance, extra_services, quantity, size, color, notes, created_at, updated_at, product:{id,name,name_ar,primary_image} } + pagination envelope. It does NOT return total_days, rental_unit, duration, deposit_amount, late_fee_charged, is_custom_offer, custom_offer_note — ghost fields the P1 card UI already renders (see intel below).
- components/reviews/review-form.tsx: props widened to { productId: string | number; bookingId?: string | number; bookingStatus?: string; onSuccess?: () => void }. When bookingStatus is provided and !== 'completed' the form is replaced by a compact locked notice (role="note", rounded-lg border bg-muted/40, Lucide Lock, «التقييم متاح فقط بعد اكتمال الحجز» + «أنهِ تجربة الإيجار أولاً — بعد تأكيد الاستلام وفك الضمان يمكنك مشاركة تقييمك»). Mutation/reviewsApi.create logic untouched; prop absent → old behavior (product page unaffected). Early return sits after all hooks so no conditional-hook issues.
- lib/api/reviews.ts: widened create() params to product_id?: string | number; booking_id?: string | number (server accepts cuid strings; dashboard productId is a cuid).
- app/dashboard/bookings/page.tsx: FOUND BROKEN AT HEAD — the P1 commit (393d47f) left the custom-offer conditional missing its closing `)}` plus two stray </div>, so the file didn't parse (11 tsc syntax errors), and Shield/AlertTriangle/Sparkles were used but never imported. Repaired the JSX, added the missing lucide imports, replaced the Record<string, unknown> map typing with a local snake_case DashboardBooking type (typed booking.status/product_id/id; formatDate now accepts null), then wired the gated review block into every non-cancelled booking card that has a product_id: <div className="border-t pt-4 mt-4"><h4 className="text-sm font-semibold mb-3">تقييمك</h4><ReviewForm productId={booking.product_id} bookingId={booking.id} bookingStatus={booking.status} /></div> — pending/confirmed/active/overdue show the locked notice, completed shows the form, cancelled or missing product skips rendering.
- getStatusBadge: added 'overdue' case — label «متأخر», variant 'destructive' + red className copied from the file's own escrow-badge idiom (bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800); statusConfig entries now support optional className (typed via local BadgeConfig). No blue/indigo anywhere (grep-verified the diff).
- app/vendors/orders/page.tsx verified READ-ONLY: STATUS_CONFIG already has overdue { label: 'متأخر!', color: 'bg-red-500/10 text-red-600', icon: AlertTriangle } — renders fine, not touched, not duplicated.
- Verification: bunx eslint components/reviews/review-form.tsx app/dashboard/bookings/page.tsx lib/api/reviews.ts --no-warn-ignored → 0 problems; bunx tsc --noEmit | grep -E "review-form|dashboard/bookings|api/reviews" → empty. No dev server started, no prisma run, no .env touched.

Stage Summary:
- Review gating enforced in the UI end-to-end: only status === 'completed' bookings render the review form; every other status shows the locked Arabic notice; cancelled bookings render nothing.
- Files changed: components/reviews/review-form.tsx, app/dashboard/bookings/page.tsx, lib/api/reviews.ts (widened create() types only).
- CRITICAL INTEL for backend Task 20: (1) GET /api/bookings does NOT return total_days, rental_unit, duration, deposit_amount, late_fee_charged, is_custom_offer, custom_offer_note — the P1 tenant card UI renders ALL of them (silently blank today); add them to the booking DTO. (2) The embedded product payload lacks slug and category (page falls back to product.id; the category line just never renders). (3) POST /api/reviews/create currently reads only product_id and ignores booking_id, with no completed-gating — the frontend now always sends product_id (cuid string) + booking_id, so the server can gate and dedupe. (4) A pre-existing file OUTSIDE my scope is broken at HEAD: components/product/product-card.tsx has `import { Star, Heart, MapPin } Shield, from 'lucide-react';` (stray "Shield") — it accounts for the only 8 remaining tsc errors; needs a one-token fix by its owner. (5) Booking statuses are lowercase everywhere ('completed', 'overdue', 'cancelled') — keep the late-check cron consistent.

---
Task ID: 20
Agent: main orchestrator (Z.ai Code)
Task: P2 applied to the correct repo — ReadyRent_Gala (STANDARD.Rent) — implemented, verified E2E, committed

Work Log:
- Backend: schema (Booking.lateFeePerDay/lateFee/lateWarningSent + EmailLog outbox), 4 Arabic RTL
  email templates (receipt / vendor alert / late warning / escrow release+thanks), sendEmail persists
  every attempt to outbox; webhook sends receipt+vendor alert (idempotent, after ALREADY_COMPLETED fix);
  NEW lib/late-check.ts + /api/cron/late-check (CRON_SECRET) + instrumentation 60s sweep (verified firing);
  NEW /api/bookings/[id]/return (vendor authz via Vendor.userId, live late-fee cap at deposit,
  late_fee_charged response for vendor toast, release email); release-escrow email; reviews/create hard
  gate (403 BOOKING_NOT_COMPLETED, 409 duplicate, bookingId persisted, isVerified when booking-linked);
  /api/emails role-scoped outbox; bookings GET exposes deposit_amount/late_fee_charged + vendor scope.
- Frontend (Task 20-b agent): ReviewForm bookingStatus gating (locked notice unless completed), wired
  into tenant dashboard cards, overdue badge.
- Pre-existing breakages fixed: webhook contract generation (findUnique on non-unique + toISOString on
  string dates — contract never generated before), vendor lookups hit User instead of Vendor table,
  vendor orders page fetched customer-scoped endpoint (always empty), product-card corrupted JSX
  (home page unrenderable), lib/api/index stale re-exports, dashboard/bookings broken JSX at HEAD.
- E2E (script + browser): signed-webhook paid → confirmed+contract+2 emails; review pre-completion 403;
  cron → overdue+warning ONCE (idempotent) fee capped 5000/5000; vendor UI return → completed+released
  +release email; review post-completion 201 then 409; outbox role views; tenant UI shows locked notice
  for non-completed and unlocked form for completed. All 4 email types fired.
- Committed 8b7c46e-era commit on local master; user pushes to GitHub.

Stage Summary:
- P2 closed on the user's real project (ReadyRent_Gala): the platform now "speaks" at payment/late/return
  and reviews are strictly post-completion. Note: .env DATABASE_URL repointed to repo-local db;
  RESEND_API_KEY not set → emails logged to outbox (status=skipped) until a real key is added.
