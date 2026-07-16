# Task 6-b: Build AI Product Recommendations API

## Files Created
- `app/api/products/[id]/recommendations/route.ts` — GET endpoint

## Files Modified
- `lib/api.ts` — Added `productsApi.getRecommendations(id)`
- `components/product-recommendations.tsx` — Full rewrite

## Key Decisions
1. **LLM timeout**: 5s via `Promise.race` with graceful fallback
2. **CUID regex**: `/[a-z0-9]{20,}/g` to extract product IDs from LLM text
3. **Preserve AI order**: Map-based sort to keep LLM's preference order
4. **Horizontal scroll**: Compact 220-240px cards in a row (max 4) instead of grid
5. **Error silent**: Component returns `null` on error — no UI breakage
6. **No `any` types**: `ProductWithRelations` and `RecommendationProduct` interfaces
