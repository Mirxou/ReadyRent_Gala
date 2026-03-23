# STANDARD.Rent — Phase 24 Stress Tests

Production load validation suite using [Locust](https://locust.io/).

## Structure

```
stress_tests/
├── locustfile.py              ← Master entry point (3 user personas)
├── db_monitor.py              ← Live PostgreSQL health monitor
├── requirements.txt           ← locust + faker
└── scenarios/
    ├── user_behavior.py       ← Register, Login, Browse, Book
    ├── judicial_stress.py     ← Disputes, Evidence, Appeals, AI Search
    ├── public_api_load.py     ← Public transparency endpoints (50k RPS)
    └── security_stress.py     ← Security invariants under concurrency
```

## Quick Start

```bash
# 1. Install
pip install -r stress_tests/requirements.txt

# 2. Start the Django backend
cd backend && python manage.py runserver 0.0.0.0:8000

# 3. Run Locust (Web UI at http://localhost:8089)
locust -f stress_tests/locustfile.py --host=http://localhost:8000

# 4. In a second terminal — run DB monitor alongside
cd backend && python -m stress_tests.db_monitor
```

## Test Scenarios

| File | Persona | Focus |
|------|---------|-------|
| `user_behavior.py` | StandardUser (50%) | Auth, products, bookings |
| `judicial_stress.py` | DisputeFiler (30%) | EvidenceLog, Appeals, AI |
| `public_api_load.py` | PublicObserver (20%) | Transparency read (P95 < 1s) |
| `security_stress.py` | SecurityStressUser | Immutability, Kill Switch, JWT |

## Load Phases

| Phase | Users | Duration | Goal |
|-------|-------|----------|------|
| A — Warmup | 100 | 2 min | Baseline latency |
| B — Ramp | 300 | 5 min | No degradation |
| C — Peak | 1,000 | 10 min | P95 < 1s, 0 data loss |

## Security Test: Kill Switch Under Load

While Locust is running at ~500 RPS, open a new terminal and execute:

```bash
cd backend
python manage.py halo_halt --on
```

**Expected behavior:**
- All `POST/PUT/PATCH/DELETE` to `/api/v1/disputes/*` → `503 SOVEREIGN_HALTED`
- All `GET` requests continue returning `200` normally
- Zero data corruption or partial writes

Then restore:
```bash
python manage.py halo_halt --off
```

## Exit Criteria (Phase 24 Complete)

- [ ] 10,000 simulated dispute events — no EvidenceLog corruption
- [ ] 1,000 concurrent users — zero `5xx` errors in steady state
- [ ] P95 latency < 1 second on public endpoints
- [ ] Kill Switch confirmed working during 500+ RPS
- [ ] DB monitor shows no lock contention or deadlocks
- [ ] Cache hit ratio > 95% on public reads
