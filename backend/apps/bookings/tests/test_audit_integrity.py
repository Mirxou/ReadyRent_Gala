from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import datetime

from apps.users.models import User, UserProfile
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.payments.models import EscrowHold
from apps.users.services.user_logic import VerificationService

class SovereignAuditIntegrityTest(TestCase):
    """
    Forensic Integrity Audit:
    - Verifies 'Tech Shock' Auto-Escrow.
    - Verifies 'Security Shield' Blacklist enforcement.
    - Verifies Status synchronicity.
    """

    def setUp(self):
        # Parties: Trusted Renter and Bad Owner
        self.trust_user = User.objects.create_user(email="trusted@test.com", password="password", phone="+213500000001", username="trusted_user")
        self.bad_owner = User.objects.create_user(email="fraud@test.com", password="password", phone="+213500000002", username="bad_owner")
        
        # Product: Good Product owned by Bad Owner
        self.category, _ = Category.objects.get_or_create(name="Forensic Audit", slug="forensic-audit")
        self.good_product = Product.objects.create(
            owner=self.bad_owner,
            name="Safe Dress",
            slug="safe-dress",
            price_per_day=Decimal("1500.00"),
            category=self.category
        )
        
        # 🛡️ SOVEREIGN SETUP: Ensure profiles have DOB and trust score
        dob = datetime.date(1990, 1, 1)
        for u in [self.trust_user, self.bad_owner]:
            profile, _ = UserProfile.objects.get_or_create(user=u)
            profile.date_of_birth = dob
            profile.save()
        
        # 🛡️ SOVEREIGN UNIFICATION: Grant Trust Legitimately (No Cheating)
        # Instead of bypassing signals, we actually give the user the criteria to earn Trust (95.0)
        from apps.users.models import VerificationStatus
        from apps.users.services.risk import RiskScoreService
        
        self.trust_user.first_name = "Trusted"
        self.trust_user.last_name = "Renter"
        self.trust_user.is_verified = True
        self.trust_user.save()
        
        VerificationStatus.objects.update_or_create(
            user=self.trust_user,
            defaults={'status': 'verified', 'phone_verified': True}
        )
        # 50 Base - 30 (Verified) - 10 (Phone) - 5 (Name) = 5 Risk -> 95 Trust!
        RiskScoreService.update_user_risk_score(self.trust_user)
        self.trust_user.refresh_from_db()

        # Blacklist the bad owner
        VerificationService.add_to_blacklist(self.bad_owner, "Forensic Audit: Fraud Pattern", None)

        # Products
        self.good_product = Product.objects.create(
            name="Safe Product", name_ar="منتج آمن", slug="safe-test",
            category=self.category, owner=self.trust_user, price_per_day=1000,
            status='available'
        )
        
        self.tainted_product = Product.objects.create(
            name="Tainted Product", name_ar="منتج مشبوه", slug="tainted-test",
            category=self.category, owner=self.bad_owner, price_per_day=1000,
            status='available'
        )

    def test_scenario_1_tech_shock_atomic_escrow(self):
        """[Scenario 1] Tech Shock Auto-Confirmation and Atomic Escrow."""
        start_date = timezone.now().date()
        end_date = start_date + datetime.timedelta(days=2)
        
        # 💵 SOVEREIGN FINANCIAL AUDIT: Fund the wallet before atomic hold!
        from apps.payments.models import Wallet
        wallet, _ = Wallet.objects.get_or_create(user=self.trust_user)
        wallet.balance = Decimal("5000.00")
        wallet.save()
        
        booking, auto_confirmed = BookingService.create_booking(
            user=self.trust_user, product=self.good_product,
            start_date=start_date, end_date=end_date,
            total_days=3, total_price=Decimal("3000.00")
        )
        
        self.assertEqual(booking.status, 'confirmed', f"Expected status 'confirmed', got {booking.status}")
        self.assertTrue(auto_confirmed, "Expected auto_confirmed to be True")
        
        # Check if EscrowHold was created atomically
        escrow = EscrowHold.objects.filter(booking=booking).first()
        self.assertIsNotNone(escrow, "FAILED: EscrowHold was NOT created atomically for 'Tech Shock' booking.")
        self.assertEqual(escrow.amount, Decimal("3000.00"), f"Expected escrow amount 3000, got {escrow.amount}")
        print(f"✅ Tech Shock Atomic Escrow: SUCCESS (State={escrow.state})")

    def test_scenario_2_owner_blacklist_shield(self):
        """[Scenario 2] Owner Blacklist Security Shield."""
        start_date = timezone.now().date()
        end_date = start_date + datetime.timedelta(days=2)
        
        with self.assertRaises(DjangoValidationError) as cm:
            BookingService.create_booking(
                user=self.trust_user, product=self.tainted_product,
                start_date=start_date, end_date=end_date,
                total_days=3, total_price=Decimal("3000.00")
            )
        print(f"✅ Owner Blacklist Shield: SUCCESS (Blocked with message: {cm.exception})")

    def test_scenario_3_status_sync(self):
        """[Scenario 3] Status Choice Consistency."""
        choices = [c[0] for c in Booking.STATUS_CHOICES]
        self.assertIn('manual_review', choices, "manual_review missing from STATUS_CHOICES")
        self.assertIn('rejected', choices, "rejected missing from STATUS_CHOICES")
        print("✅ Status Sync: SUCCESS")
