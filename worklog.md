---
Task ID: 1
Agent: Main Orchestrator
Task: Make the entire STANDARD.Rent application work (backend + frontend) - remove all mock data, build real API routes with Prisma

Work Log:
- Analyzed current project state: catch-all mock API route, all specific API routes returning 501, no real backend
- Removed `app/api/[[...path]]/route.ts` (catch-all that blocked all real routes)
- Pushed Prisma schema and seeded database with real data (20 products, 6 categories, 2 users, 2 vendors, 8 artisans, 2 bundles, 4 subscription plans, 3 insurance plans)
- Built 30+ real API routes across 5 parallel subagent tasks
- Fixed auth-server.ts: added NextResponse import, authRequiredResponse export
- Fixed auth-helpers.ts: removed mock-jwt-token generation, uses real session token
- Fixed middleware.ts: updated cookie name from auth-token to session_token
- Fixed register page: mapped form fields to API field names
- Fixed store.ts: changed User.id type from number to string (matching CUID)
- Fixed chatbot route: removed z-ai-web-dev-sdk import (not installed)
- Fixed admin dashboard: explicit property key for activeProducts
- Verified all APIs return real data from SQLite database

Stage Summary:
- **Auth System**: Real login/register with bcrypt, in-memory sessions, HttpOnly cookies
- **Products API**: Full CRUD with search, filters, pagination, categories, search suggestions
- **Artisans/Vendors/Bundles/Subscriptions/Insurance**: All return real DB data
- **Bookings/Cart/Wishlist/Notifications/Contracts/Returns/Disputes/Payments**: All built with auth protection
- **Chatbot**: Smart rule-based responses (8+ topic areas in Arabic/English)
- **Admin Analytics**: Dashboard stats, revenue data, top products, daily summary
- **No mock data remains** anywhere in the codebase
- All API responses use the sovereign envelope format: { success, dignity_preserved, data }