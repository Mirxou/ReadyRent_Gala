from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
import datetime
import hmac
import hashlib
from django.conf import settings

from apps.users.models import User, UserProfile, VerificationStatus
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.users.services.risk import RiskScoreService

class SovereignHardeningTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@sovereign.com", password="password", username="sovereign_user")
        profile, _ = UserProfile.objects.get_or_create(user=self.user)
        profile.date_of_birth = datetime.date(1990, 1, 1)
        profile.save()
        
        # Verify user to allow auto-confirmation
        self.user.is_verified = True
        self.user.save()
        VerificationStatus.objects.create(user=self.user, status='verified', phone_verified=True)
        RiskScoreService.update_user_risk_score(self.user)
        self.user.refresh_from_db()

        self.category, _ = Category.objects.get_or_create(name="Hardening")
        self.product = Product.objects.create(
            owner=self.user,
            name="Sovereign Product",
            slug="sovereign-prod",
            price_per_day=Decimal("1000.00"),
            category=self.category,
            status='available'
        )

    def test_price_manipulation_protection(self):
        """Verifies that the backend recalculates price and ignores frontend manipulation."""
        start_date = timezone.now().date() + datetime.timedelta(days=1)
        end_date = start_date + datetime.timedelta(days=1) # 2 days
        
        # Frontend tries to say it's only 500 total (instead of 2000)
        booking, _ = BookingService.create_booking(
            user=self.user,
            product=self.product,
            start_date=start_date,
            end_date=end_date,
            total_price=Decimal("500.00")
        )
        
        self.assertEqual(booking.total_price, Decimal("2000.00"), "Price manipulation was NOT prevented!")
        print("✅ Price Manipulation Protection: SUCCESS")

    def test_signature_proof_integrity(self):
        """Verifies that the signature_proof is correctly generated and matches details."""
        start_date = timezone.now().date() + datetime.timedelta(days=1)
        end_date = start_date + datetime.timedelta(days=1)
        
        booking, _ = BookingService.create_booking(
            user=self.user,
            product=self.product,
            start_date=start_date,
            end_date=end_date
        )
        
        self.assertIsNotNone(booking.signature_proof)
        
        # Manually re-calculate signature
        payload = f"{self.user.id}:{self.product.id}:{start_date}:{end_date}:{booking.total_price}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        self.assertEqual(booking.signature_proof, expected_sig, "Signature proof mismatch!")
        print("✅ Signature Proof Integrity: SUCCESS")

    def test_future_date_validation(self):
        """Verifies that past dates are blocked."""
        past_date = timezone.now().date() - datetime.timedelta(days=1)
        
        from django.core.exceptions import ValidationError as DjangoValidationError
        with self.assertRaises(DjangoValidationError):
            BookingService.create_booking(
                user=self.user,
                product=self.product,
                start_date=past_date,
                end_date=past_date
            )
        print("✅ Future Date Validation: SUCCESS")
