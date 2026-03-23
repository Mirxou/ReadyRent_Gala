import requests
import random
import json
import sys
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def run_smoke_test():
    print(f"--- SMOKE TEST: {BASE_URL} ---")
    
    username = f"smoke_user_{random.randint(1000, 9999)}"
    password = "StrongPassword123!@#"
    email = f"{username}@example.com"
    
    # 1. Register
    print(f"1. Registering {username}...")
    
    session = requests.Session()
    
    # 1. Register
    print(f"1. Registering {username}...")
    
    max_retries = 5
    resp = None
    
    for attempt in range(max_retries):
        try:
            resp = session.post(f"{BASE_URL}/api/auth/register/", json={
                "username": username,
                "email": email,
                "password": password,
                "password_confirm": password,
                "first_name": "Smoke",
                "last_name": "Test"
            })
            break # Success
        except requests.exceptions.ConnectionError:
            if attempt < max_retries - 1:
                print(f"   Connection refused, retrying in 2s... ({attempt+1}/{max_retries})")
                time.sleep(2)
            else:
                print(f"   CRITICAL ERROR: Could not connect to {BASE_URL} after {max_retries} attempts.")
                return
        except Exception as e:
            print(f"   CRITICAL ERROR: {e}")
            return

    if resp is None:
        print("   FAIL: No response received.")
        return

    print(f"   Status: {resp.status_code}")
    if resp.status_code not in [200, 201]:
        print(f"   FAIL: {resp.text}")
        return

    # 2. Login
    print("2. Logging in...")
    resp = session.post(f"{BASE_URL}/api/auth/login/", json={
        "email": email,
        "password": password
    })
    
    if resp.status_code != 200:
        print(f"   FAIL: Login failed. {resp.text}")
        return
    
    # Check if we got a token or cookie
    token = None
    if 'access_token' in resp.json():
        token = resp.json().get('access_token')
    
    if token:
         session.headers.update({'Authorization': f'Bearer {token}'})
         print("   Login Success. Token acquired.")
    else:
         print("   Login Success. Using Cookies.")

    # 3. Add to Cart
    print("3. Adding to Cart...")
    cart_payload = {
        "product_id": 1,
        "quantity": 1,
        "start_date": "2026-06-10",
        "end_date": "2026-06-12"
    }
    resp = session.post(f"{BASE_URL}/api/bookings/cart/items/", json=cart_payload)
    if resp.status_code != 201:
        print(f"   FAIL: Could not add to cart. {resp.text}")
        return
    print("   Item added to cart.")

    # 4. Create Booking
    print("4. Attempting Booking...")
    # Booking create now takes from cart, so payload might just be empty or idempotency key
    booking_payload = {
        "idempotency_key": str(uuid.uuid4()),
        "payment_method": "baridimob" 
    }
    
    resp = session.post(f"{BASE_URL}/api/bookings/create/", json=booking_payload)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text}")

    if resp.status_code == 201:
        print("✅ SMOKE TEST PASSED: Booking Created")
    else:
        print("❌ SMOKE TEST FAILED: Could not create booking")

if __name__ == "__main__":
    run_smoke_test()
