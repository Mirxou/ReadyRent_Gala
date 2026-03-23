"""
Public API Load Test Scenario
==============================
Simulates high-volume, unauthenticated read traffic on the public
transparency endpoints — the most internet-facing part of the system.

TARGET:
  50,000 requests per endpoint.
  P95 latency < 1 second.
  Zero 5xx errors (Redis cache must absorb the load).

WHY THIS MATTERS:
  These endpoints hit `AnonymizedJudgment` + `PublicMetrics`, which are
  pre-computed via cron. Any N+1 queries or missing indexes will be
  exposed immediately at 500+ RPS.
"""

import random


class PublicAPILoadMixin:
    """
    Mixin for unauthenticated public transparency read tests.
    No JWT required — simulates anon internet traffic.
    """

    # ── Core Transparency Endpoints ────────────────────────────

    def do_read_public_judgments(self):
        """
        Read the public anonymized judgment ledger.
        Hits: AnonymizedJudgment queryset + DRF pagination.
        Expected cache hit rate: > 90% after warmup.
        """
        # Vary pagination page to prevent over-reliance on single cache keys
        page = random.randint(1, 10)
        params = f"?page={page}&ordering=-judgment_date"

        with self.client.get(
            f"/api/v1/public/ledger/{params}",
            name="/api/v1/public/ledger/ (public list)",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 404:
                resp.success()  # Empty page is fine
            else:
                resp.failure(f"Public judgments failed: {resp.status_code}")

    def do_read_public_metrics_dashboard(self):
        """
        Fetch the pre-computed statistics dashboard.
        Hits: PublicMetrics model + MetricContextCard join.
        CRITICAL: Must NOT hit raw DB on every request (should be cached).
        """
        with self.client.get(
            "/api/v1/public/metrics/",
            name="/api/v1/public/metrics/ (stats)",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Metrics dashboard failed: {resp.status_code}")

    def do_read_consistency_trends(self):
        """
        Fetch consistency score trends over time.
        Stresses time-range queries on PublicMetrics with period filters.
        """
        year = 2026
        month = random.randint(1, 3)
        params = f"?metric_type=consistency_trend&year={year}&month={month}"

        with self.client.get(
            f"/api/v1/public/metrics/{params}",
            name="/api/v1/public/metrics/ (trends)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Consistency trends failed: {resp.status_code}")

    def do_read_verdict_balance(self):
        """
        Fetch owner vs. renter verdict balance.
        Tests the pre-computed verdict_balance metric type.
        """
        with self.client.get(
            "/api/v1/public/metrics/?metric_type=verdict_balance",
            name="/api/v1/public/metrics/ (verdict balance)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Verdict balance failed: {resp.status_code}")

    def do_read_category_breakdown(self):
        """
        Fetch breakdown by dispute category.
        Stresses the category index on AnonymizedJudgment.
        """
        categories = [
            "damage", "late_return", "payment", "contract", "other"
        ]
        cat = random.choice(categories)
        with self.client.get(
            f"/api/v1/public/ledger/?category={cat}&page=1",
            name="/api/v1/public/ledger/ (by category)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Category breakdown failed: {resp.status_code}")
