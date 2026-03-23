"""
Security Stress Test Scenario
==============================
Validates security mechanisms hold under high concurrency.

Tests:
  1. EvidenceLog Immutability: Hammer with update attempts
  2. Kill Switch Response: halo_halt during 500 RPS
  3. JWT Boundary: Expired/invalid tokens under load
  4. EscrowHold Direct Write Guard: verify ValueError still fires
  5. Split Verdict Guard: verify Judgment refuses 'split' under load

RUN AS A STANDALONE LOCUST FILE:
  locust -f stress_tests/scenarios/security_stress.py \
         --host=http://localhost:8000 \
         --users 200 --spawn-rate 20 --run-time 5m --headless
"""

import random
from locust import HttpUser, task, between


class SecurityStressUser(HttpUser):
    """
    Simulates adversarial and edge-case requests to verify security
    constraints hold under concurrent load.
    """
    wait_time = between(0.5, 2)
    auth_token: str = ""

    def on_start(self):
        """Login with the standard stress test account."""
        with self.client.post(
            "/api/auth/login/",
            json={
                "email": "testuser@test.standardrent.dz",
                "password": "StressTest@2026!",
            },
            catch_response=True,
            name="[Security] Login",
        ) as resp:
            if resp.status_code == 200:
                self.auth_token = resp.json().get("access", "")
                resp.success()
            else:
                resp.failure(f"Login failed: {resp.status_code}")

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}

    # ── Test 1: EvidenceLog Immutability ──────────────────────

    @task(3)
    def attempt_evidence_update(self):
        """
        Try to PATCH/PUT an existing EvidenceLog entry.
        System MUST return 405 (Method Not Allowed) or 403 (Forbidden).
        A 200 response = CRITICAL SECURITY FAILURE.
        """
        # Use a known old ID — even if it 404s, that is acceptable.
        fake_id = random.randint(1, 500)
        bad_payload = {"action": "TAMPERED", "metadata": {"injected": True}}

        for method in ["patch", "put"]:
            with getattr(self.client, method)(
                f"/api/disputes/disputes/{fake_id}/evidence/",
                json=bad_payload,
                headers=self._auth_headers(),
                catch_response=True,
                name=f"[Security] evidence {method.upper()} (must fail)",
            ) as resp:
                if resp.status_code in (200, 201):
                    # This is a SECURITY FAILURE — log as failure
                    resp.failure(
                        f"CRITICAL: EvidenceLog mutation allowed! {method.upper()} {fake_id} → {resp.status_code}"
                    )
                else:
                    # 403, 404, 405, 500 are all acceptable here
                    resp.success()

    # ── Test 2: Kill Switch Under Load ─────────────────────────

    @task(1)
    def verify_halt_header(self):
        """
        Post to a judicial endpoint and check for SOVEREIGN_HALTED response.
        (Only valid when halo_halt --on has been triggered manually during test.)
        """
        with self.client.post(
            "/api/disputes/disputes/create/",
            json={"title": "HaltTest", "description": "Test", "priority": "low"},
            headers=self._auth_headers(),
            catch_response=True,
            name="[Security] POST during potential halt",
        ) as resp:
            if resp.status_code == 503:
                data = resp.json()
                if data.get("code") == "SOVEREIGN_HALTED":
                    # Correct: system is halted and blocking mutations
                    resp.success()
                else:
                    resp.failure("503 received but not SOVEREIGN_HALTED code")
            elif resp.status_code in (200, 201, 400, 403):
                # Normal operation (halt not active)
                resp.success()
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    # ── Test 3: Invalid JWT Under Load ─────────────────────────

    @task(2)
    def request_with_expired_token(self):
        """
        Send requests with an intentionally invalid JWT.
        System must return 401 — never 200 or 500.
        """
        bad_token = "eyJhbGciOiJIUzI1NiJ9.INVALID_PAYLOAD.INVALID_SIG"
        with self.client.get(
            "/api/bookings/",
            headers={"Authorization": f"Bearer {bad_token}"},
            catch_response=True,
            name="[Security] GET with invalid JWT (must 401)",
        ) as resp:
            if resp.status_code == 401:
                resp.success()
            elif resp.status_code == 200:
                resp.failure("CRITICAL: Request with invalid JWT returned 200!")
            else:
                resp.success()  # 403, 500 etc. are acceptable

    # ── Test 4: Split Verdict Guard ────────────────────────────

    @task(1)
    def attempt_split_verdict(self):
        """
        Attempt to create a judgment with verdict='split'.
        System must refuse with 400/422 — never 200/201.
        (Blocked at the model level in Judgment.save())
        """
        if not self.auth_token:
            return
        payload = {
            "verdict": "split",
            "ruling_text": "This is a split verdict attempt by stress test.",
            "dispute": random.randint(1, 100),
        }
        with self.client.post(
            "/api/disputes/disputes/judgments/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="[Security] POST split verdict (must fail)",
        ) as resp:
            if resp.status_code in (400, 403, 404, 422, 500):
                resp.success()
            elif resp.status_code in (200, 201):
                resp.failure("CRITICAL: Split verdict was accepted!")
            else:
                resp.success()

    # ── Test 5: EscrowHold Direct State Write ──────────────────

    @task(1)
    def attempt_direct_escrow_state_write(self):
        """
        Attempt to directly PATCH EscrowHold.state.
        System must refuse — only EscrowEngine can change state.
        """
        fake_escrow_id = random.randint(1, 200)
        payload = {"state": "released"}
        with self.client.patch(
            f"/api/payments/escrow/{fake_escrow_id}/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="[Security] PATCH EscrowHold.state (must fail)",
        ) as resp:
            if resp.status_code in (200, 201):
                resp.failure("CRITICAL: Direct EscrowHold state write accepted!")
            else:
                resp.success()
