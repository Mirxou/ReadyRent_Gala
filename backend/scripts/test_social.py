import os
import sys
import django
import time
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import User, VerificationStatus
from apps.social.models import Vouch
from apps.analytics.services_live import LiveAnalyticsService
from apps.products.models import Product

def test_social_vouching():
    print("\n--- Testing Social Vouching ---")
    
    # 1. Setup Users
    golden_user, _ = User.objects.get_or_create(username="golden_boy", email="golden@test.com", password="password")
    new_user, _ = User.objects.get_or_create(username="newbie", email="new@test.com", password="password")
    
    # Ensure Golden User is Golden
    VerificationStatus.objects.update_or_create(user=golden_user, defaults={'risk_score': 10})
    
    # Ensure New User is Default
    VerificationStatus.objects.update_or_create(user=new_user, defaults={'risk_score': 50})
    
    print(f"Initial Risk: Golden={golden_user.verification.risk_score}, New={new_user.verification.risk_score}")

    # 2. Vouch
    # Cleanup previous vouches
    Vouch.objects.filter(voucher=golden_user, receiver=new_user).delete()
    
    print("Golden User vouching for New User...")
    Vouch.objects.create(voucher=golden_user, receiver=new_user)
    
    # 3. Verify Impact
    new_user.verification.refresh_from_db()
    print(f"New Risk Score: {new_user.verification.risk_score}")
    
    if new_user.verification.risk_score == 30: # 50 - 20
        print("✅ Vouching Logic Passed: Score dropped by 20.")
    else:
        print(f"❌ Vouching Failed: Score is {new_user.verification.risk_score}, expected 30.")

def test_live_counters():
    print("\n--- Testing Live Counters (Redis) ---")
    
    product_id = 999 # Dummy ID
    
    # 1. Simulate Traffic
    print("Simulating 5 distinct viewers...")
    LiveAnalyticsService.track_view(product_id, "user:101")
    LiveAnalyticsService.track_view(product_id, "user:102")
    LiveAnalyticsService.track_view(product_id, "ip:192.168.1.1")
    LiveAnalyticsService.track_view(product_id, "ip:192.168.1.2")
    LiveAnalyticsService.track_view(product_id, "user:101") # Duplicate user, shouldn't count double
    
    # 2. Get Count
    count = LiveAnalyticsService.get_active_count(product_id)
    print(f"Active Viewers: {count}")
    
    if count == 4: # 101, 102, IP1, IP2
        print("✅ Live Counters Passed: Correctly counted distinct viewers.")
    else:
        print(f"❌ Live Counters Failed: Expected 4, got {count}.")

def run_tests():
    try:
        test_social_vouching()
        test_live_counters()
    except Exception as e:
        print(f"❌ Test Crash: {e}")

if __name__ == "__main__":
    run_tests()
