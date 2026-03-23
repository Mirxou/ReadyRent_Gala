from django.test import TestCase
from standard_core.models import User, Asset, VehicleSpec, RealEstateSpec
from django.db.utils import IntegrityError
import uuid

class SovereignVerticalsTest(TestCase):
    """
    Sovereign Test Level 3: Unified Verticals Verification.
    Ensures that:
    1. Users can be Personal or Professional.
    2. Vehicles have specific attributes (Year, Make, Model).
    3. Real Estate has specific attributes (Location, Capcity).
    """

    def setUp(self):
        # Create a Professional User (Auto-Entrepreneur potential)
        self.pro_user = User.objects.create_user(
            email="pro@standard.rent",
            phone_number="+213555999999",
            password="secure_password",
            business_mode="PROFESSIONAL"
        )

    def test_user_business_mode(self):
        """Test that User supports Business Mode logic."""
        self.assertEqual(self.pro_user.business_mode, "PROFESSIONAL")
        
        personal_user = User.objects.create_user(
            email="personal@standard.rent",
            phone_number="+213555888888",
            password="secure_password"
        )
        self.assertEqual(personal_user.business_mode, "PERSONAL") # Default

    def test_vehicle_spec_creation(self):
        """Test creating a Vehicle Asset."""
        base_asset = Asset.objects.create(
            owner=self.pro_user,
            title="Mercedes S-Class 2024",
            slug="mercedes-s-class-24",
            vertical_type="VEHICLE",
            daily_price=25000.00
        )

        vehicle_spec = VehicleSpec.objects.create(
            asset=base_asset,
            make="Mercedes-Benz",
            model="S-Class",
            year=2024,
            transmission="AUTO",
            fuel_type="HYBRID"
        )

        self.assertEqual(vehicle_spec.asset.title, "Mercedes S-Class 2024")
        self.assertEqual(vehicle_spec.year, 2024)
        self.assertTrue(hasattr(base_asset, 'vehiclespec'))

    def test_real_estate_spec_creation(self):
        """Test creating a Real Estate Asset."""
        base_asset = Asset.objects.create(
            owner=self.pro_user,
            title="Royal Wedding Hall",
            slug="royal-hall-algiers",
            vertical_type="REAL_ESTATE",
            daily_price=100000.00
        )

        estate_spec = RealEstateSpec.objects.create(
            asset=base_asset,
            property_type="HALL",
            capacity=500,
            location_lat=36.7525,
            location_lon=3.0420,
            has_parking=True
        )

        self.assertEqual(estate_spec.asset.vertical_type, "REAL_ESTATE")
        self.assertEqual(estate_spec.capacity, 500)
        self.assertTrue(hasattr(base_asset, 'realestatespec'))
