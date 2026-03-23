import random
from locust import HttpUser, task, between, events
from decimal import Decimal
import uuid

class StandardUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login on start"""
        self.username = f"locust_user_{random.randint(1, 10000)}"
        self.password = "password123"
        self.email = f"{self.username}@example.com"
        
        # Register (idempotent-ish)
        self.client.post("/api/auth/register/", json={
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "first_name": "Locust",
            "last_name": "Tester"
        })
        
        # Login
        response = self.client.post("/api/auth/login/", json={
            "username": self.username,
            "password": self.password
        })
        
        if response.status_code == 200:
            # Cookies are automatically handled by self.client (HttpSession)
            self.logged_in = True
        else:
            self.logged_in = False
            # print(f"Login failed for {self.username}")

    @task
    def attempt_double_booking(self):
        """
        Thundering Herd Scenario:
        Everyone tries to book Product #1 for the SAME dates.
        Flow: Add to Cart -> Create Booking
        """
        if not hasattr(self, 'logged_in') or not self.logged_in:
            return
            
        # Target: Product 1
        product_id = 1 
        start_date = "2026-06-01"
        end_date = "2026-06-05"
        
        # 1. Add to Cart
        cart_payload = {
            "product_id": product_id,
            "quantity": 1,
            "start_date": start_date,
            "end_date": end_date
        }
        
        with self.client.post("/api/bookings/cart/items/", json=cart_payload, catch_response=True) as cart_resp:
            if cart_resp.status_code != 201:
                # If we fail to add to cart (e.g. invalid dates or validation), just return
                # We count this as success in terms of "system didn't crash", but failure for booking
                if cart_resp.status_code == 400:
                     cart_resp.success()
                else:
                     cart_resp.failure(f"Cart Add Failed: {cart_resp.status_code}")
                return

        # 2. Create Booking (Checkout)
        booking_payload = {
            # "idempotency_key": str(uuid.uuid4()), # Locust logic to generate unique key? 
            # Ideally each request has unique key. 
            # Note: We need uuid import if we use it. 
            # For Thundering Herd, if we want them to be distinct requests, we need unique keys.
            # If we want to test Idempotency on SAME request, we'd reuse key.
            # Here we want distinct double-booking attempts.
            # But wait, python's uuid inside class?
            "payment_method": "baridimob"
        }
        # We need uuid. Let's add import at top of file or here? 
        # Easier to NOT send idempotency key if optional, OR add it.
        # Smoke test sends it. Model says it's nullable (null=True, unique=True).
        # If we send None, it's fine?
        # Let's import uuid at top.
        
        with self.client.post("/api/bookings/create/", json=booking_payload, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            elif response.status_code == 400:
                # Expected failure for double booking (Overlap) or Red Zone
                if "overlap" in response.text.lower() or "not available" in response.text.lower() or "sovereign" in response.text.lower():
                    response.success()
                else:
                    # Other 400s
                    response.success() 
            elif response.status_code == 500:
                 response.failure(f"Server Error (500): {response.text}")
            else:
                response.failure(f"Status {response.status_code}: {response.text}")
