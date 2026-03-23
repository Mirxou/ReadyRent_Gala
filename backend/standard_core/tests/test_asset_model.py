from django.test import TestCase
from standard_core.models import User, Asset, FashionSpec
from django.db.utils import IntegrityError
import uuid

class SovereignAssetModelTest(TestCase):
    """
    Sovereign Test Level 2: Asset & Polymorphic Verification.
    Ensures that:
    1. Assets cannot exist without an Owner (P2P Law).
    2. Assets have a defined 'vertical_type'.
    3. Specific Specs (e.g. FashionSpec) define the unique attributes.
    """

    def setUp(self):
        # Create a Sovereign User (Owner)
        self.owner = User.objects.create_user(
            email="owner@standard.rent",
            phone_number="+213555000001",
            password="secure_password"
        )

    def test_create_abstract_asset_alone(self):
        """Test creating a raw Asset (Base)."""
        asset = Asset.objects.create(
            owner=self.owner,
            title="Generic Item",
            slug="generic-item",
            vertical_type="GENERIC",
            daily_price=100.00
        )
        self.assertEqual(asset.owner, self.owner)
        self.assertIsNotNone(asset.id)
        self.assertEqual(asset.vertical_type, "GENERIC")

    def test_create_fashion_spec(self):
        """Test creating a FashionSpec linked to an Asset (Polymorphism)."""
        # 1. Create the Spec (which creates the Asset implicitly or explicitly)
        # Strategy: OneToOne to Asset
        
        base_asset = Asset.objects.create(
            owner=self.owner,
            title="Gucci Dress",
            slug="gucci-dress",
            vertical_type="FASHION",
            daily_price=5000.00
        )

        fashion_spec = FashionSpec.objects.create(
            asset=base_asset,
            size="M",
            brand="Gucci",
            material="Silk",
            color_hex="#FF0000"
        )

        # Assert Relationship
        self.assertEqual(fashion_spec.asset.title, "Gucci Dress")
        self.assertEqual(fashion_spec.asset.owner, self.owner)
        
        # Assert Reverse Access
        self.assertTrue(hasattr(base_asset, 'fashionspec'))
        self.assertEqual(base_asset.fashionspec.brand, "Gucci")

    def test_asset_owner_enforcement(self):
        """Test that Asset CANNOT exist without an Owner."""
        with self.assertRaises(IntegrityError):
            Asset.objects.create(
                owner=None, # Violation of Sovereign Rule #1
                title="Ghost Asset",
                slug="ghost",
                vertical_type="FASHION"
            )
