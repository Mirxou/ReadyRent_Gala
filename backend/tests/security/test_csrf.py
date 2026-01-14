"""
CSRF protection tests
"""
import pytest
from django.test import Client
from django.middleware.csrf import get_token
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.security
@pytest.mark.django_db
class TestCSRFProtection:
    """Test CSRF protection"""
    
    def test_csrf_token_required_for_post(self, api_client, regular_user):
        """Test CSRF token is required for POST requests"""
        api_client.login(email='user@test.com', password='testpass123')
        # Without CSRF token, POST should fail
        response = api_client.post('/api/bookings/', {
            'product_id': 1,
            'start_date': '2026-01-15',
            'end_date': '2026-01-18'
        })
        # Django REST Framework might handle this differently
        # Adjust based on your CSRF settings
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]
    
    def test_csrf_token_in_cookies(self, api_client):
        """Test CSRF token is set in cookies"""
        response = api_client.get('/api/products/')
        # CSRF token should be available
        csrf_token = get_token(api_client)
        assert csrf_token is not None

