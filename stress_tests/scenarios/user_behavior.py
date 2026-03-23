"""
User Behavior Scenario
======================
Simulates standard platform interactions:
  - Register an account
  - Login (fetch JWT)
  - Browse product catalog
  - View a single product
  - Create a booking

REUSABLE as a Mixin so multiple HttpUser classes can inherit it.
"""

import json
import random
from faker import Faker

fake = Faker("ar_AA")  # Arabic locale for realistic data

# A small set of product IDs to avoid 404s.
# On startup these are populated by the first user who fetches the catalog.
PRODUCT_IDS: list[int] = []
BOOKING_IDS: list[int] = []


class UserBehaviorMixin:
    """
    Mixin containing reusable user behavior tasks.
    Inheriting class MUST be a Locust HttpUser.
    """

    auth_token: str = ""

    # ── Helpers ────────────────────────────────────────────────

    def _auth_headers(self) -> dict:
        """Return Authorization header if user is authenticated."""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}

    def _rand_email(self) -> str:
        return f"stress_{random.randint(1, 999999)}@test.standardrent.dz"

    # ── Auth Tasks ─────────────────────────────────────────────

    def do_register(self):
        """Register a new user account."""
        email = self._rand_email()
        password = "StressTest@2026!"
        payload = {
            "email": email,
            "password": password,
            "password_confirm": password,
            "username": f"stress_{random.randint(1, 999999)}",
        }
        with self.client.post(
            "/api/auth/register/",
            json=payload,
            catch_response=True,
            name="/api/auth/register/",
        ) as resp:
            if resp.status_code in (200, 201):
                self._stored_email = email
                self._stored_password = password
                resp.success()
            else:
                # If registration fails, try with a fallback pair
                self._stored_email = "testuser@test.standardrent.dz"
                self._stored_password = "StressTest@2026!"
                resp.failure(f"Register failed: {resp.status_code}")

    def do_login(self):
        """Authenticate and store JWT access token."""
        payload = {
            "email": getattr(self, "_stored_email", "testuser@test.standardrent.dz"),
            "password": getattr(self, "_stored_password", "StressTest@2026!"),
        }
        with self.client.post(
            "/api/auth/login/",
            json=payload,
            catch_response=True,
            name="/api/auth/login/",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                self.auth_token = data.get("access", "")
                resp.success()
            else:
                resp.failure(f"Login failed: {resp.status_code}")

    # ── Product Tasks ──────────────────────────────────────────

    def do_browse_products(self):
        """Fetch the product listing — most common action."""
        with self.client.get(
            "/api/products/",
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/products/ (list)",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                # Populate shared product list for other tasks (use slugs if IDs aren't returned)
                # But based on detail path, slugs are usually used.
                for item in results:
                    slug = item.get("slug")
                    if slug and slug not in PRODUCT_IDS:
                        PRODUCT_IDS.append(slug)
                resp.success()
            else:
                resp.failure(f"Products list failed: {resp.status_code}")

    def do_view_product_detail(self):
        """View a single product detail page."""
        if not PRODUCT_IDS:
            return  # Skip if catalog not yet populated
        slug = random.choice(PRODUCT_IDS)
        with self.client.get(
            f"/api/products/{slug}/",
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/products/{slug}/ (detail)",
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Product detail failed: {resp.status_code}")

    # ── Booking Tasks ──────────────────────────────────────────

    def do_create_booking(self):
        """Attempt to create a booking (requires auth + product)."""
        if not self.auth_token or not PRODUCT_IDS:
            return
        slug = random.choice(PRODUCT_IDS)
        payload = {
            "product_slug": slug,
            "start_date": "2026-04-01",
            "end_date": "2026-04-05",
        }
        with self.client.post(
            "/api/bookings/",
            json=payload,
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/bookings/ (create)",
        ) as resp:

            if resp.status_code in (200, 201):
                data = resp.json()
                booking_id = data.get("id")
                if booking_id:
                    BOOKING_IDS.append(booking_id)
                resp.success()
            elif resp.status_code in (400, 409):
                # Date conflict or validation error — acceptable, not a failure
                resp.success()
            else:
                resp.failure(f"Create booking failed: {resp.status_code}")
