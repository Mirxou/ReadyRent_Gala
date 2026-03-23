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
    
    def test_csrf_token_required_for_post(self):
        """Test CSRF token is required for unsafe requests (POST)"""
        from django.test import Client
        
        # Use standard Django client with enforce_csrf=True
        client = Client(enforce_csrf=True)
        
        # 1. GET request to set CSRF cookie
        client.get('/admin/login/')
        assert 'csrftoken' in client.cookies
        
        # 2. POST request without CSRF token
        response = client.post('/admin/login/', {'username': 'test', 'password': 'test'})
        
        # This MUST be 403 Forbidden because no CSRF token was provided
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_csrf_token_in_cookies(self, api_client):
        """Test CSRF token is set in cookies after a GET request"""
        # Admin login page always triggers CSRF cookie issuance
        response = api_client.get('/admin/login/')
        # CSRF token should be in the client's cookie jar
        assert 'csrftoken' in api_client.cookies
        assert api_client.cookies['csrftoken'] is not None
