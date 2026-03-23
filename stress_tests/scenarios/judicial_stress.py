"""
Judicial System Stress Scenario
================================
Tests the most critical and unique part of STANDARD.Rent:
the multi-phase dispute resolution engine.

What this hammers:
  - Concurrent dispute filing (EvidenceLog write-once check under contention)
  - Evidence upload (BLAKE2b + chain integrity)
  - Dispute status polling (DB read under load)
  - JudgmentEmbedding generation (AI compute latency)

EXPECTED FINDINGS:
  - EvidenceLog blockchain chain: potential DB-level lock if concurrent
    inserts race on  `order_by('-id').first()` in save().
  - JudgmentEmbedding: heavy CPU/disk on first call (model load).
  - After Redis warm-up, read latency should drop to < 50ms.
"""

import random
from faker import Faker

fake = Faker("ar_AA")

# Shared state between workers
DISPUTE_IDS: list[int] = []


class JudicialStressMixin:
    """
    Mixin for judicial engine load testing.
    Inheriting class MUST be an authenticated Locust HttpUser.
    """

    def _auth_headers(self) -> dict:
        token = getattr(self, "auth_token", "")
        return {"Authorization": f"Bearer {token}"} if token else {}

    # ── Phase 18: Dispute Filing ───────────────────────────────

    def do_file_dispute(self):
        """
        File a new dispute. Core Phase 18 load.
        Creates a Dispute → triggers EvidenceLog entry.
        """
        payload = {
            "title": fake.sentence(nb_words=6),
            "description": fake.paragraph(nb_sentences=4),
            "priority": random.choice(["low", "medium", "high"]),
            "claimed_amount": round(random.uniform(500, 50000), 2),
        }
        with self.client.post(
            "/api/disputes/disputes/create/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/disputes/disputes/create/ (create)",
        ) as resp:
            if resp.status_code in (200, 201):
                data = resp.json()
                dispute_id = data.get("id")
                if dispute_id:
                    DISPUTE_IDS.append(dispute_id)
                resp.success()
            elif resp.status_code in (400, 403):
                resp.success()  # Validation/auth error, not a system failure
            else:
                resp.failure(f"Dispute create failed: {resp.status_code}")

    # ── Phase 18: Evidence Upload ──────────────────────────────

    def do_upload_evidence(self):
        """
        Submit evidence to an existing dispute.
        Critical test: EvidenceLog.save() immutability + BLAKE2b chain.
        Concurrent calls trigger race on `order_by('-id').first()`.
        """
        if not DISPUTE_IDS:
            return
        dispute_id = random.choice(DISPUTE_IDS)

        # Action types from EvidenceLog schema
        action_choices = [
            "MESSAGE_SENT",
            "PHOTO_UPLOADED",
            "PAYMENT_RECEIVED",
            "BOOKING_UPDATED",
        ]
        payload = {
            "action": random.choice(action_choices),
            "dispute": dispute_id,
            "metadata": {
                "description": fake.sentence(),
                "timestamp": "2026-03-09T06:00:00Z",
                "submitted_by": "stress_test",
            },
        }
        with self.client.post(
            f"/api/disputes/disputes/{dispute_id}/evidence/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/disputes/disputes/{id}/evidence/ (create)",
        ) as resp:
            if resp.status_code in (200, 201, 400, 403, 404):
                resp.success()
            else:
                resp.failure(f"Evidence upload failed: {resp.status_code}")

    # ── Phase 19: Appeal Filing ────────────────────────────────

    def do_file_appeal(self):
        """
        File an appeal against a provisional judgment.
        Triggers fund freeze (is_fund_frozen = True).
        """
        if not DISPUTE_IDS:
            return
        dispute_id = random.choice(DISPUTE_IDS)
        payload = {
            "dispute": dispute_id,
            "reason": fake.paragraph(nb_sentences=3),
        }
        with self.client.post(
            f"/api/disputes/judgments/{dispute_id}/appeal/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/disputes/judgments/{id}/appeal/ (create)",
        ) as resp:
            if resp.status_code in (200, 201, 400, 403, 404, 409):
                resp.success()
            else:
                resp.failure(f"Appeal failed: {resp.status_code}")

    # ── Phase 22: Precedent Search (AI) ───────────────────────

    def do_precedent_search(self):
        """
        Trigger AI-powered semantic precedent search.
        Loads sentence-transformers model; verifies embedding latency.
        """
        payload = {
            "query_text": fake.paragraph(nb_sentences=2),
            "top_k": 5,
        }
        with self.client.post(
            "/api/v1/judicial/precedent-search/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/v1/judicial/precedent-search/ (AI)",
        ) as resp:
            # AI calls can be slow — we only fail on server errors
            if resp.status_code in (200, 201, 400, 403, 404):
                resp.success()
            elif resp.status_code >= 500:
                resp.failure(f"Precedent search server error: {resp.status_code}")
            else:
                resp.success()

    # ── Status Polling ─────────────────────────────────────────

    def do_check_dispute_status(self):
        """Poll an existing dispute's current status."""
        if not DISPUTE_IDS:
            return
        dispute_id = random.choice(DISPUTE_IDS)
        with self.client.get(
            f"/api/disputes/disputes/{dispute_id}/",
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/disputes/disputes/{id}/ (status poll)",
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Status poll failed: {resp.status_code}")
