from django.test import TestCase, override_settings
from unittest.mock import patch, MagicMock
from standard_core.models import User
from decimal import Decimal

# We will create this
# from standard_core.ai_services import IdentityGuard

class SovereignIdentityTest(TestCase):
    """
    Sovereign Test Level 6: The Nervous System (AI).
    Ensures that:
    1. Identity Verification Service can receive a request.
    2. DeepFace (Mocked) returns Match/No-Match.
    3. User 'is_verified' status and 'trust_score' update accordingly.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="unknown@standard.rent",
            phone_number="+213555000999",
            is_verified=False,
            trust_score=Decimal("10.00")
        )

    @patch('standard_core.ai_services.DeepFace')
    def test_identity_verification_success(self, mock_deepface):
        """
        Scenario: User provides valid Selfie + ID. AI confirms match.
        Expected: is_verified=True, Trust Score increased.
        """
        # Import inside to support TDD flow
        from standard_core.ai_services import IdentityGuard

        # Mock AI Response
        mock_deepface.verify.return_value = {"verified": True, "distance": 0.1}

        # Execute Service
        result = IdentityGuard.process_verification(
            user=self.user,
            id_image_path="/tmp/fake_id.jpg",
            selfie_image_path="/tmp/fake_selfie.jpg"
        )

        self.user.refresh_from_db()

        # Assertions
        self.assertTrue(result)
        self.assertTrue(self.user.is_verified)
        self.assertTrue(self.user.trust_score >= Decimal("50.00")) # Boost applied

    @patch('standard_core.ai_services.DeepFace')
    def test_identity_verification_failure(self, mock_deepface):
        """
        Scenario: Faces do not match.
        Expected: is_verified=False, Trust Score penalized or static.
        """
        from standard_core.ai_services import IdentityGuard

        # Mock AI Response: Failure
        mock_deepface.verify.return_value = {"verified": False, "distance": 0.8}

        result = IdentityGuard.process_verification(
            user=self.user,
            id_image_path="/tmp/fake_id.jpg",
            selfie_image_path="/tmp/fake_imposter.jpg"
        )

        self.user.refresh_from_db()

        self.assertFalse(result)
        self.assertFalse(self.user.is_verified)
        # Optional: Penalize trust score? For now, just ensuring it didn't go up.
        self.assertTrue(self.user.trust_score <= Decimal("10.00"))
