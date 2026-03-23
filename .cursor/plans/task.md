# RENTILY — 90-Day Plan Task Tracker

## Phase 1: Backend Critical Fixes (Week 1-2) ✅
- [x] Fix Escrow state duplication
- [x] Implement Split Verdicts
- [x] Complete `contracts/` module
- [x] Phase 1: PostgreSQL Migration & Stabilization
- [x] Phase 1 Quality Gate (Verification)

## Phase 2: Production Infrastructure (Week 3-4) ✅
- [x] Day 8: Gunicorn Server Setup
- [x] Day 9: Static/Media Handling (Whitenoise)
- [x] Day 10: Performance Auditing
- [x] Day 11: Nginx Reverse Proxy + SSL
- [x] Day 12: Redis Production Configuration
- [x] Day 13: PgBouncer Connection Pooling
- [x] Day 14: Final Production YAML & Verification

## Phase 3: Frontend Engineering (Week 5-10) 🏗️

### Week 5: Booking Flow (Days 15-21)
- [x] Day 15-16: Product Browsing + Advanced Search
- [x] Day 17-18: Booking Creation Wizard
- [x] Day 19-20: Checkout + Payment Integration ✅ DONE
- [x] Day 21: Unit & Integration Testing ✅ DONE

### Week 6: Contracts & Wallet (Days 22-28)
- [x] Day 22-23: Digital Contract View/Sign UI ✅ DONE
- [x] Day 24-25: Wallet Dashboard (Balance + Top-up) ✅ DONE
- [x] Day 26-27: Transaction History & Receipts ✅ DONE
- [/] Day 28: API Client Expansion (25+ Endpoints) IN_PROGRESS (wrappers existent, mais “frontend build/TS consistency gate” requis)

### Week 7: Judicial System - Disputes (Days 29-35)
- [x] Day 29-30: Dispute Filing Wizard ✅ DONE (form + UI flow)
- [/] Day 31-32: Evidence Management (Upload/Gallery) PARTIAL (EvidenceStep UI existe, mais upload est simulé)
- [/] Day 33-34: Dispute Tracking Dashboard PARTIAL (detail affiche “mock stages” explicitement)
- [ ] Day 35: AI-Powered Dispute Assistant (non confirmé côté UX production)

### Week 8: Appeals & Judgments (Days 36-42)
- [/] Day 36-37: Judgment Visualization (Split Verdicts) PARTIAL (verdict/receipt UI présent, mais dépend de complétude backend)
- [ ] Day 38-39: Appeal Filing Flow (API wrapper trouvé, mais UX Next non confirmée)
- [ ] Day 40-41: Public Judicial Ledger View (route `judicial` offline for maintenance)
- [ ] Day 42: Interactive Smart Contract Timeline (non confirmé côté UI)

### Week 9: Innovation & UX (Days 43-49)
- [x] Day 43-44: Trust Score Dashboard ✅ DONE (présent côté dashboard/products)
- [/] Day 45-46: AI Features (Search + Explainers) PARTIAL (chatbot & innovation endpoints existent)
- [ ] Day 47-48: Optimistic UI & Modern Micro-interactions (non confirmé)
- [x] Day 49: PWA (Service Worker + Offline) ✅ DONE (Serwist SW + `manifest.json`)

### Week 10: Launch Preparation (Days 50-56)
- [/] Day 50-51: Playwright E2E Suite (specs existent, mais execution/green status à valider)
- [ ] Day 52-53: Performance Optimization (Lighthouse 95+)
- [/] Day 54: Accessibility Audit (WCAG 2.1 AA) (specs existent, mais à exécuter/valider)
- [/] Day 55-56: Deployment & Analytics Sync (scripts présents, mais `.env.production` + front-end build doivent être validés)
