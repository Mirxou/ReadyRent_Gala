import os
import sys
import django
import uuid
import json
from datetime import date, timedelta

# Added project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking, Cart, CartItem
from apps.bookings.views import BookingCreateView

def test_idempotency():
    print("🔄 Testing Booking Idempotency & Locking...")
    import traceback
    try:
        from unittest.mock import patch
        
        # Mock Risk Service to avoid external deps/crashes
        with patch('apps.users.services_risk.RiskScoreService.calculate_score') as mock_risk:
            mock_risk.return_value = 10 # Trusted user
            
            # 1. Setup Data
            user, _ = User.objects.get_or_create(email="offline_tester@example.com", defaults={'username': 'offline_tester'})
            category, _ = Category.objects.get_or_create(slug='test-cat', defaults={'name': 'Test', 'name_ar': 'Test'})
            product, _ = Product.objects.get_or_create(
                slug="offline-prod-01",
                defaults={
                    'name': "Offline Product", 'name_ar': "منتج", 
                    'owner': user, 'category': category, 'price_per_day': 100, 
                    'size': 'M', 'color': 'Red'
                }
            )
            product.status = 'available'
            product.save()

            # 2. Add to Cart (Simulate Frontend State)
            CartItem.objects.filter(cart__user=user).delete() # Clean slate
            cart, _ = Cart.objects.get_or_create(user=user)
            start_date = date.today() + timedelta(days=1)
            end_date = start_date + timedelta(days=2)
            
            CartItem.objects.create(
                cart=cart, product=product, start_date=start_date, end_date=end_date, quantity=1
            )

            # 3. Prepare Duplicate Request (Same Idempotency Key)
            idem_key = str(uuid.uuid4())
            print(f"   🔑 Idempotency Key: {idem_key}")

            factory = APIRequestFactory()
            data = {
                'idempotency_key': idem_key,
                'same_day_delivery': False
            }

            # --- Request 1: First Attempt (Should Create) ---
            print("\n[Req 1] Sending First Request (Offline Sync)...")
            request1 = factory.post('/api/bookings/create/', data, format='json')
            force_authenticate(request1, user=user)
            
            view = BookingCreateView.as_view()
            response1 = view(request1)
            
            print(f"   Status: {response1.status_code}")
            if response1.status_code != 201:
                print(f"❌ FAILED: Created failed with {response1.data}")
                return

            booking_id_1 = response1.data['bookings'][0]['id']
            print(f"   ✅ Created Booking ID: {booking_id_1}")

            # --- Request 2: Duplicate Attempt (Should Return Existing) ---
            print("\n[Req 2] Sending Duplicate Request (Simulate Network Retry)...")
            
            # Note: View checks idempotency BEFORE cart.
            request2 = factory.post('/api/bookings/create/', data, format='json')
            force_authenticate(request2, user=user)
            
            response2 = view(request2)
            
            print(f"   Status: {response2.status_code}")
            
            if response2.status_code == 200:
                booking_data = response2.data['bookings']
                booking_id_2 = booking_data[0]['id']
                
                if booking_id_1 == booking_id_2:
                    print(f"   ✅ SUCCESS: Returned existing Booking ID: {booking_id_2}")
                    print(f"   Message: {response2.data.get('message')}")
                else:
                    print(f"❌ FAILED: Returned DIFFERENT ID ({booking_id_2})!")
            else:
                print(f"❌ FAILED: Expected 200, got {response2.status_code}")
                print(response2.data)

    except Exception:
        print("❌ CRASHED:")
        traceback.print_exc()

if __name__ == '__main__':
    # Disable Sentry
    os.environ['SENTRY_DSN'] = ""
    test_idempotency()
