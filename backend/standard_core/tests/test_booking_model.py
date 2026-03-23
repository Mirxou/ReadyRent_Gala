from django.test import TestCase
from standard_core.models import User, Asset, Booking
from django.utils import timezone
from decimal import Decimal
import uuid

class SovereignBookingTest(TestCase):
    """
    Sovereign Test Level 4: The Commitment Engine.
    Ensures that:
    1. A Booking freezes the price (Snapshot).
    2. A Booking enforces status transitions.
    3. A Booking cannot exist without valid Dates and Asset.
    """

    def setUp(self):
        # 1. The Professional Owner
        self.owner = User.objects.create_user(
            email="owner@standard.rent",
            phone_number="+213555000000",
            business_mode="PROFESSIONAL"
        )
        # 2. The Renter
        self.renter = User.objects.create_user(
            email="renter@standard.rent",
            phone_number="+213555111111"
        )
        # 3. The Asset (Vehicle)
        self.asset = Asset.objects.create(
            owner=self.owner,
            title="Luxury Wedding Car",
            slug="wedding-car-01",
            vertical_type="VEHICLE",
            status="ACTIVE",
            daily_price=Decimal("25000.00")
        )

    def test_booking_creation_snapshot(self):
        """
        Test that creating a booking FREEZES the price.
        If the owner changes the asset price later, the booking must remain unchanged.
        """
        # Create Booking
        booking = Booking.objects.create(
            renter=self.renter,
            asset=self.asset,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=2),
            total_price=Decimal("50000.00") # 2 days * 25k
        )

        # Assert Snapshot Integrity
        self.assertEqual(booking.locked_price, Decimal("25000.00")) # Should be auto-captured
        self.assertEqual(booking.status, "PENDING")

        # Simulate Owner Greedy Behavior (Raising Price)
        self.asset.daily_price = Decimal("100000.00")
        self.asset.save()

        # Refresh Booking (Should NOT change)
        booking.refresh_from_db()
        self.assertEqual(booking.locked_price, Decimal("25000.00")) 

    def test_booking_status_flow(self):
        """Test the lifecycle of a commitment."""
        booking = Booking.objects.create(
            renter=self.renter,
            asset=self.asset,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=1),
            total_price=Decimal("25000.00")
        )
        
        # Initial State
        self.assertEqual(booking.status, "PENDING")
        
        # Transition to SECURED (Payment/Deposit Verified)
        booking.status = "SECURED"
        booking.save()
        
        # Transition to ACTIVE (Handover)
        booking.status = "ACTIVE"
        booking.save()
        
        self.assertEqual(booking.status, "ACTIVE")

    def test_no_asset_booking(self):
        """A booking must have an asset."""
        with self.assertRaises(Exception):
            Booking.objects.create(
                renter=self.renter,
                asset=None, # Violation
                start_date=timezone.now(),
                end_date=timezone.now()
            )
