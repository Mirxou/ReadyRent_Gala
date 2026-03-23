"""
STANDARD.Rent — Phase 24: Production Stress Validation
======================================================
Master Locust configuration file.

USAGE:
  # Install dependencies:
  pip install -r stress_tests/requirements.txt

  # Run via Web UI (recommended):
  locust -f stress_tests/locustfile.py --host=http://localhost:8000

  # Run headless (fast CI mode):
  locust -f stress_tests/locustfile.py --host=http://localhost:8000 \
         --headless --users 1000 --spawn-rate 50 --run-time 10m

PHASES:
  Phase A — Warmup:   100 users, 2 min
  Phase B — Ramp:     300 users, 5 min
  Phase C — Peak:    1000 users, 10 min

TARGET METRICS:
  P95 Latency  < 1 second
  Error Rate   < 0.5%
  RPS          > 500 at peak
"""

from locust import HttpUser, task, between, events
from scenarios.user_behavior import UserBehaviorMixin
from scenarios.judicial_stress import JudicialStressMixin
from scenarios.public_api_load import PublicAPILoadMixin


# ─────────────────────────────────────────────────────────────
# 1. STANDARD USER — Simulates a typical platform customer
# ─────────────────────────────────────────────────────────────
class StandardUser(HttpUser, UserBehaviorMixin):
    """
    Represents a typical renter browsing products and creating bookings.
    50% of total simulated users.
    """
    weight = 50
    wait_time = between(1, 3)

    def on_start(self):
        """Register and log in before starting tasks."""
        self.do_register()
        self.do_login()

    @task(5)
    def browse_products(self):
        self.do_browse_products()

    @task(2)
    def view_product_detail(self):
        self.do_view_product_detail()

    @task(1)
    def create_booking(self):
        self.do_create_booking()


# ─────────────────────────────────────────────────────────────
# 2. DISPUTE FILER — Simulates heavy judicial system usage
# ─────────────────────────────────────────────────────────────
class DisputeFiler(HttpUser, UserBehaviorMixin, JudicialStressMixin):
    """
    Represents a user actively opening and escalating disputes.
    30% of total simulated users. Critical for judicial engine testing.
    """
    weight = 30
    wait_time = between(2, 5)

    def on_start(self):
        self.do_register()
        self.do_login()

    @task(3)
    def file_dispute(self):
        self.do_file_dispute()

    @task(2)
    def upload_evidence(self):
        self.do_upload_evidence()

    @task(1)
    def check_dispute_status(self):
        self.do_check_dispute_status()


# ─────────────────────────────────────────────────────────────
# 3. PUBLIC OBSERVER — Simulates read-only transparency traffic
# ─────────────────────────────────────────────────────────────
class PublicObserver(HttpUser, PublicAPILoadMixin):
    """
    Unauthenticated user reading public judgment ledger.
    20% of total simulated users. Tests Redis cache + DB read performance.
    """
    weight = 20
    wait_time = between(0.5, 2)

    @task(4)
    def read_public_judgments(self):
        self.do_read_public_judgments()

    @task(3)
    def read_public_metrics_dashboard(self):
        self.do_read_public_metrics_dashboard()

    @task(1)
    def read_consistency_trends(self):
        self.do_read_consistency_trends()


# ─────────────────────────────────────────────────────────────
# EVENT HOOKS — Lifecycle reporters
# ─────────────────────────────────────────────────────────────
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "=" * 60)
    print("🚀 STANDARD.Rent Phase 24 — Stress Test STARTED")
    print("   Host:", environment.host)
    print("=" * 60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("\n" + "=" * 60)
    print("🏁 Stress Test FINISHED — Check Locust UI for results.")
    print("=" * 60 + "\n")
