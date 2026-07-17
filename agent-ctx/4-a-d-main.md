---
Task ID: 4-a-d
Agent: Main
Task: Fix admin dashboard and reports data shape mismatches with actual API responses

Changes Made:
1. **components/admin/stats-cards.tsx** — Rewrote interface from nested (`overall.users`) to flat (`total_users`) to match `/api/analytics/admin/dashboard` response
2. **app/admin/dashboard/page.tsx** — Fixed `active_listings` → `active_products`, `revenueData.revenue` → `revenueData.data`, removed `period` prop
3. **components/admin/revenue-chart.tsx** — Made `DailyRevenue` accept both `date`/`day` and `bookings`/`count` field names
4. **components/admin/sales-by-category-chart.tsx** — Made `name` primary field with legacy field fallbacks
5. **app/admin/reports/page.tsx** — Rewrote to use flat API shapes: summary computed from `total_bookings`/`total_revenue`, revenue chart from `data`, category chart from `categories`. Removed sections without API data (status chart, top products, top customers).

All pre-existing lint issues remain unchanged. No new lint errors introduced.