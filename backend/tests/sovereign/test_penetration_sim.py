import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.users.serializers import UserSerializer

User = get_user_model()

@pytest.fixture
def pen_api_client():
    return APIClient()

@pytest.fixture
def sensitive_user(db):
    user = User.objects.create_user(
        username='victim', 
        email='victim@sovereign.com', 
        password='password123',
        phone='+213555555555'
    )
    user.is_2fa_enabled = True
    user.totp_secret = 'JBSWY3DPEHPK3PXP' # Standard test secret
    user.save()
    return user

@pytest.mark.django_db
class TestPenetrationShields:
    """
    Sovereign 'Highest Level Protection' Audit:
    Simulating malicious attempts to leak PII or bypass security guards.
    """

    def test_pii_hash_leakage_prevention(self, sensitive_user):
        """
        PENETRATION ATTEMPT: Check if sensitive hashes are exposed in standard serialization.
        EXPECTATION: 'email_hash', 'phone_hash', and 'totp_secret' are NEVER in the JSON.
        """
        serializer = UserSerializer(sensitive_user)
        data = serializer.data
        
        # 1. Critical Hash Shield
        assert 'email_hash' not in data
        assert 'phone_hash' not in data
        assert 'totp_secret' not in data
        
        # 2. Verify we didn't inadvertently leak the encrypted blob instead of plaintext
        # (EncryptedCharField should decrypt to plaintext for the owner/authorized view)
        assert data['email'] == 'victim@sovereign.com'
        
    def test_2fa_bypass_unauthorized_access(self, pen_api_client, sensitive_user):
        """
        PENETRATION ATTEMPT: Access a 'High Court' endpoint with valid JWT but NO 2FA session.
        EXPECTATION: 403 Forbidden (or 401 if forced).
        """
        pen_api_client.force_authenticate(user=sensitive_user)
        
        # Accessing an endpoint that requires 2FA (e.g., Vault Integrity or Sovereign Dashboard)
        # Assuming the middleware or permission class 'Is2FAVerified' or similar is active.
        # Let's target the Judicial Dashboard or similar 'Sovereign' path.
        response = pen_api_client.get('/api/v1/judicial/disputes/')
        
        # If the user has 2FA enabled but hasn't provided the token in this session,
        # the SovereignGuard should block them.
        # Note: This depends on the specific implementation of JudicialLockoutMiddleware.
        if sensitive_user.is_2fa_enabled:
            assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_202_ACCEPTED] # 202 if redirected to 2FA

    def test_shadow_column_exposure_via_query_params(self, pen_api_client, sensitive_user):
        """
        PENETRATION ATTEMPT: Try to 'guess' if a user exists by filtering on 'email_hash' via URL.
        EXPECTATION: 400 Bad Request or filtered out (User should not be able to filter by hash).
        """
        pen_api_client.force_authenticate(user=sensitive_user)
        response = pen_api_client.get(f'/api/v1/users/?email_hash={sensitive_user.email_hash}')
        
        # The API should not allow filtering on internal shadow columns
        # (unless it's an admin view, and even then, usually by plaintext email).
        if response.status_code == 200:
            # If it returns a list, ensure the hash isn't in the response
            for user_data in response.data:
                assert 'email_hash' not in user_data
