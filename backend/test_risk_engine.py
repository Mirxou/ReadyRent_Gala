import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, VerificationStatus, Blacklist
from django.db.models.signals import post_save
from apps.bookings.models import Booking, send_booking_notifications
from apps.users.services_risk import RiskScoreService

def test_risk_calculation():
    print("🚀 Starting Risk Engine Simulation...")
    
    # 0. Disconnect Notification Signal (Avoid Redis/Celery errors)
    post_save.disconnect(send_booking_notifications, sender=Booking)
    
    # 1. Create fresh user
    email = "risk_test@example.com"
    User.objects.filter(email=email).delete()
    user = User.objects.create_user(username="risk_test", email=email, password="password123")
    
    # Initial manual calc
    RiskScoreService.update_user_risk_score(user)
    vs = VerificationStatus.objects.get(user=user)
    print(f"1. New User Score: {vs.risk_score} (Expected: 50)")
    
    # 2. Add Verification (Should drop score)
    vs.status = 'verified'
    vs.phone_verified = True
    vs.save() 
    # Must refresh user so 'user.verification' relation is re-fetched with new status
    user.refresh_from_db()
    RiskScoreService.update_user_risk_score(user)
    vs.refresh_from_db()
    print(f"2. Verified User: {vs.risk_score} (Expected: ~10)")
    
    # 3. Blacklist them (Should jump to 100)
    Blacklist.objects.create(user=user, reason="Fraud")
    # Signal on Blacklist should auto-update score
    vs.refresh_from_db()
    print(f"3. Blacklisted User: {vs.risk_score} (Expected: 100)")
    
    # 4. Remove Blacklist & Add Bookings
    Blacklist.objects.all().delete()
    RiskScoreService.update_user_risk_score(user) # Reset
    
    from datetime import date, time
    from decimal import Decimal
    from apps.products.models import Product, Category
    
    import random
    cat, _ = Category.objects.get_or_create(name="Test", slug="test")
    prod = Product.objects.create(
        name="Test Dress", 
        owner=user, 
        category=cat, 
        price_per_day=Decimal("100.00"), 
        size='M', 
        color='Red',
        slug=f"test-dress-{random.randint(1000, 9999)}"
    )
    
    # Create 5 completed bookings
    for i in range(5):
        Booking.objects.create(
            user=user, 
            product=prod, 
            start_date=date.today(), 
            end_date=date.today(),
            total_days=1,
            total_price=Decimal("100.00"),
            status='completed'
        )
        # Signal on Booking should auto-update score
    
    user.refresh_from_db()    
    vs.refresh_from_db()
    print(f"4. With 5 Completed Bookings: {vs.risk_score} (Expected: <10)")
    
    print("✅ Probability Engine Test Complete!")

if __name__ == "__main__":
    test_risk_calculation()
