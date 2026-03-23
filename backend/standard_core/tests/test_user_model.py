from django.test import TestCase
from standard_core.models import User
from django.utils import timezone
import uuid

class SovereignUserModelTest(TestCase):
    """
    Sovereign Test Level 1: User Model Verification.
    Ensures the User model adheres strictly to the Sovereign ERD.
    """

    def test_create_sovereign_user(self):
        """Test creating a standard citizen user with required Sovereign fields."""
        email = "citizen@standard.rent"
        phone = "+213555000000"
        
        user = User.objects.create_user(
            email=email,
            phone_number=phone,
            password="secure_sovereign_password"
        )

        # Assertions based on Sovereign ERD
        self.assertEqual(user.email, email)
        self.assertEqual(user.phone_number, phone)
        self.assertFalse(user.is_verified) # Default should be False
        self.assertEqual(user.trust_score, 50.00) # Default Neutral Score
        self.assertIsInstance(user.id, uuid.UUID) # ID must be Sovereign (UUID)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        """Test creating a Sovereign (Admin/Root)."""
        email = "root@standard.rent"
        phone = "+0000000000"
        
        admin = User.objects.create_superuser(
            email=email,
            phone_number=phone,
            password="admin_password"
        )

        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)
