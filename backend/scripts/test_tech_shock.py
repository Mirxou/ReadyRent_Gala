import os
import django
import sys
from datetime import date, timedelta
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, VerificationStatus
from apps.products.models import Product, Category
from apps.bookings.services import BookingService
from apps.bookings.models import Booking

def test_tech_shock():
    print("⚡ Starting Tech Shock Automation Test...")

    # 1. Setup Data
    # Create Product
    # Create Product
    import random
    random_id = random.randint(1000, 9999)
    category, _ = Category.objects.get_or_create(name="Test Category", slug="test-cat")
    product = Product.objects.create(
        name=f"Auto-Confirm Dress {random_id}",
        description="Test Item",
        price_per_day=Decimal("100.00"),
        category=category,
        owner=User.objects.first(), 
        status='available',
        color="Red",
        size="M",
        slug=f"auto-confirm-dress-{random_id}"
    )

    # 2. Test Scenario A: Trusted User (Golden)
    print("\n🧪 Testing Scenario A: Golden User (Risk Score 10)")
    user_gold = User.objects.create_user(username="gold_user", email="gold@test.com", password="password123")
    VerificationStatus.objects.create(user=user_gold, risk_score=10, status='verified')

    # Create Booking
    booking_gold, confirmed_gold = BookingService.create_booking(
        user=user_gold,
        product=product,
        start_date=date.today() + timedelta(days=1),
        end_date=date.today() + timedelta(days=2),
        total_days=2,
        total_price=Decimal("200.00")
    )

    print(f"   Score: 10 -> Status: {booking_gold.status}")
    print(f"   Message: {BookingService.get_trust_reward_message(confirmed_gold)}")

    if booking_gold.status == 'confirmed':
        print("   ✅ SUCCESS: High trust user got auto-confirmed!")
    else:
        print("   ❌ FAILED: High trust user did NOT get confirmed.")


    # 3. Test Scenario B: Normal User (Silver)
    print("\n🧪 Testing Scenario B: Normal User (Risk Score 50)")
    user_silver = User.objects.create_user(username="silver_user", email="silver@test.com", password="password123")
    VerificationStatus.objects.create(user=user_silver, risk_score=50, status='pending')

    # Create Booking
    booking_silver, confirmed_silver = BookingService.create_booking(
        user=user_silver,
        product=product,
        start_date=date.today() + timedelta(days=5),
        end_date=date.today() + timedelta(days=6),
        total_days=2,
        total_price=Decimal("200.00")
    )

    print(f"   Score: 50 -> Status: {booking_silver.status}")
    print(f"   Message: {BookingService.get_trust_reward_message(confirmed_silver)}")

    if booking_silver.status == 'pending':
        print("   ✅ SUCCESS: Normal user remained pending.")
    else:
        print("   ❌ FAILED: Normal user was incorrectly confirmed.")

    # Cleanup
    booking_gold.delete()
    booking_silver.delete()
    user_gold.delete()
    user_silver.delete()
    product.delete()
    print("\n🧹 Cleanup Complete.")

if __name__ == "__main__":
    try:
        test_tech_shock()
    except Exception as e:
        print(f"\n❌ Error: {e}")
