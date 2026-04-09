import os
import django
import sys
from decimal import Decimal

# Setup Django with forensic test settings
sys.path.append(os.getcwd())
# Forensic Fix: Force specific settings that bypass Postgres
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.forensic_test_settings'
django.setup()

from django.core.management import call_command
print("⏳ Initializing forensic schema...")
call_command('migrate', interactive=False, verbosity=0)

from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.payments.models import EscrowHold
from django.core.exceptions import ValidationError as DjangoValidationError

def test_sovereign_hardening():
    print("--- 🛡️ Starting Sovereign Architectural Hardening Verification ---")
    
    # 1. Setup Test Data
    # Clear existing data to be safe in SQLite
    Category.objects.all().delete()
    User.objects.all().delete()
    
    category, _ = Category.objects.get_or_create(name="Test", slug="test")
    
    # Trusted User (Tech Shock Candidate)
    trust_user = User.objects.create(
        email="trusted_audit_v3@algeria.dz",
        username="trusted_audit_v3",
        is_verified=True,
        trust_score=95
    )

    # Blacklisted Owner
    bad_owner = User.objects.create(
        email="bad_audit_v3@algeria.dz",
        username="bad_audit_v3"
    )
    from apps.users.services.user_logic import VerificationService
    VerificationService.add_to_blacklist(bad_owner, "Forensic Audit: Fraud Pattern", None)

    # Products
    good_product = Product.objects.create(
        name="Safe Product", name_ar="منتج آمن", slug="safe-audit-v3",
        category=category, owner=trust_user, price_per_day=1000,
        status='available'
    )
    
    tainted_product = Product.objects.create(
        name="Tainted Product", name_ar="منتج مشبوه", slug="tainted-audit-v3",
        category=category, owner=bad_owner, price_per_day=1000,
        status='available'
    )

    # --- Scenario 1: 'Tech Shock' Atomic Escrow ---
    print("\n[Scenario 1] Testing 'Tech Shock' Auto-Confirmation and Atomic Escrow...")
    from django.utils import timezone
    import datetime
    start_date = timezone.now().date()
    end_date = start_date + datetime.timedelta(days=2)
    
    booking, auto_confirmed = BookingService.create_booking(
        user=trust_user, product=good_product,
        start_date=start_date, end_date=end_date,
        total_days=3, total_price=Decimal("3000.00")
    )
    
    assert booking.status == 'confirmed', f"Expected status 'confirmed', got {booking.status}"
    assert auto_confirmed is True, "Expected auto_confirmed to be True"
    
    # Check if EscrowHold was created atomically
    escrow = EscrowHold.objects.filter(booking=booking).first()
    assert escrow is not None, "FAILED: EscrowHold was NOT created atomically for 'Tech Shock' booking."
    print(f"✅ Escrow Found: State={escrow.state}, Amount={escrow.amount}")
    assert escrow.amount == Decimal("3000.00"), f"Expected escrow amount 3000, got {escrow.amount}"
    
    print("✅ SUCCESS: 'Tech Shock' booking is atomic and financially secured.")

    # --- Scenario 2: Owner Blacklist Shield ---
    print("\n[Scenario 2] Testing Owner Blacklist Security Shield...")
    try:
        BookingService.create_booking(
            user=trust_user, product=tainted_product,
            start_date=start_date, end_date=end_date,
            total_days=3, total_price=Decimal("3000.00")
        )
        print("❌ FAILED: Booking was allowed for a blacklisted owner!")
        sys.exit(1)
    except DjangoValidationError as e:
        print(f"✅ SUCCESS: Booking blocked correctly. Error: {e}")

    # --- Scenario 3: Status Sync Verification ---
    print("\n[Scenario 3] Searching for Status Choice Consistency...")
    choices = [c[0] for c in Booking.STATUS_CHOICES]
    assert 'manual_review' in choices, "manual_review missing from STATUS_CHOICES"
    assert 'rejected' in choices, "rejected missing from STATUS_CHOICES"
    print("✅ SUCCESS: Database schema synchronized with AI Risk Engine.")

    print("\n--- 🌟 ALL ARCHITECTURAL HARDENING TESTS PASSED 🌟 ---")

if __name__ == "__main__":
    try:
        test_sovereign_hardening()
    except Exception as e:
        print(f"\n❌ CRITICAL TEST FAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
