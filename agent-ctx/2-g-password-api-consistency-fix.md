# Task 2-g: Password + API Consistency Fix Agent

## Files Modified

### 1. `/app/api/auth/reset-password/route.ts`
- Changed `password.length < 6` → `password.length < 8`
- Updated error messages: Arabic "6 أحرف" → "8 أحرف", English "6 characters" → "8 characters"

### 2. `/lib/api.ts`
- `authApi.passwordResetConfirm` signature: removed `uid` parameter
- Before: `(token: string, uid: string, password: string, passwordConfirm: string)`
- After: `(token: string, password: string, passwordConfirm: string)`
- Body no longer includes `uid` field

### 3. `/app/reset-password/page.tsx`
- Updated call: `authApi.passwordResetConfirm(token, password, passwordConfirm)` (removed `uid` arg)
- Page still reads `uid` from URL for client-side validation of link integrity

### 4. `/app/services/page.tsx`
- Added `import { servicesApi } from '@/lib/api'`
- `fetch('/api/services?limit=50')` → `servicesApi.getAll({ limit: 50 })`
- `fetch('/api/services/book', ...)` → `servicesApi.book({...})`
- Error handling adapted: `res.status >= 400 || res.meta?.failed` with `res.data?.message_ar`

### 5. `/app/dashboard/orders/page.tsx`
- Already used `bookingsApi.getAll()` — cleaned up duplicate import line

## Notes
- All pre-existing lint errors are `no-explicit-any` (not introduced by this task)
- The orders page had already been migrated to use `bookingsApi` in a prior task