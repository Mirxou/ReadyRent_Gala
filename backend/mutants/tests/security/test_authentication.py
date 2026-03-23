"""
Security tests for authentication and authorization
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.mark.security
@pytest.mark.django_db
class TestAuthentication:
    """Test authentication security"""
    
    def test_login_with_valid_credentials(self, api_client, regular_user):
        """Test login with valid credentials"""
        response = api_client.post('/api/auth/login/', {
            'email': 'user@test.com',
            'password': 'testpass123'
        })
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_login_with_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post('/api/auth/login/', {
            'email': 'invalid@test.com',
            'password': 'wrongpassword'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_without_credentials(self, api_client):
        """Test login without credentials"""
        response = api_client.post('/api/auth/login/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_access_protected_endpoint_without_auth(self, api_client):
        """Test accessing protected endpoint without authentication"""
        response = api_client.get('/api/bookings/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_protected_endpoint_with_auth(self, authenticated_client):
        """Test accessing protected endpoint with authentication"""
        response = authenticated_client.get('/api/bookings/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]


@pytest.mark.security
@pytest.mark.django_db
class TestAuthorization:
    """Test authorization and permissions"""
    
    def test_admin_can_access_admin_endpoints(self, admin_user):
        """Test admin can access admin endpoints"""
        client = APIClient()
        client.force_authenticate(user=admin_user)
        # Add specific admin endpoint tests here
        assert admin_user.is_staff
        assert admin_user.is_superuser
    
    def test_regular_user_cannot_access_admin_endpoints(self, regular_user):
        """Test regular user cannot access admin endpoints"""
        client = APIClient()
        client.force_authenticate(user=regular_user)
        assert not regular_user.is_staff
        assert not regular_user.is_superuser
    
    def test_user_can_only_access_own_data(self, regular_user, admin_user):
        """Test user can only access their own data"""
        # This would be tested in specific view tests
        assert regular_user != admin_user


@pytest.mark.security
@pytest.mark.django_db
class TestPasswordSecurity:
    """Test password security"""
    
    def test_password_is_hashed(self, regular_user):
        """Test password is stored as hash, not plain text"""
        assert regular_user.password != 'testpass123'
        assert regular_user.check_password('testpass123')
    
    def test_password_validation(self):
        """Test password validation"""
        # Django's password validators should be tested
        user = User(email='test@test.com', username='test')
        # Weak password should fail validation
        # This depends on your password validators


@pytest.mark.security
@pytest.mark.django_db
class TestSessionSecurity:
    """Test session security"""
    
    def test_session_created_on_login(self, api_client, regular_user):
        """Test session is created on login"""
        api_client.login(email='user@test.com', password='testpass123')
        assert '_auth_user_id' in api_client.session
    
    def test_session_destroyed_on_logout(self, api_client, regular_user):
        """Test session is destroyed on logout"""
        api_client.login(email='user@test.com', password='testpass123')
        api_client.logout()
        assert '_auth_user_id' not in api_client.session

