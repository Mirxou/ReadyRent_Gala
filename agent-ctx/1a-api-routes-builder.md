---
Task ID: 1a
Agent: API Routes Builder
Task: Create 4 missing API routes (bundles/[id], bundles/[id]/book, contracts/[id]/sign, notifications/read-all)

Work Log:
- Read worklog.md to understand project state and existing patterns
- Analyzed auth-server.ts: getSessionFromRequest returns { userId, token }, NOT { user: { id } } — adapted all code accordingly
- Verified Prisma schema models (Bundle, BundleItem, Booking, Contract, Notification, Transaction)
- Created GET /api/bundles/[id]/route.ts — returns bundle with items and product details, 404 if not found
- Created POST /api/bundles/[id]/book/route.ts — auth-protected, calculates days + discount, creates Booking per item + single Transaction + Notification
- Created POST /api/contracts/[id]/sign/route.ts — auth-protected, sets contract to signed with IP/timestamp, promotes linked booking to confirmed
- Created PATCH /api/notifications/read-all/route.ts — auth-protected, bulk updateMany unread notifications for current user
- All 4 files verified with lint (zero errors in new files)
- Dev server running normally, no compilation errors

Stage Summary:
- 4 new API route files created, all following existing project conventions
- Key adaptation: used `session.userId` (matching actual auth-server return type) instead of `session.user.id` from the spec
- All routes use Arabic error/success messages consistent with the rest of the platform