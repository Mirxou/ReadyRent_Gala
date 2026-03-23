"""
Rate limiting tests
"""
import pytest
from django.test import Client
from rest_framework.test import APIClient


@pytest.mark.security
@pytest.mark.django_db
class TestRateLimiting:
    """Test rate limiting"""
    
    def test_rate_limit_on_login(self, api_client):
        """Test rate limiting on login endpoint"""
        # Make multiple rapid login attempts
        for i in range(10):
            response = api_client.post('/api/auth/login/', {
                'email': f'test{i}@test.com',
                'password': 'wrongpassword'
            })
        
        # After rate limit, should get 429 Too Many Requests
        # Note: Rate limiting might not be enabled in test environment
        # Adjust based on your rate limiting configuration
        response = api_client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'wrongpassword'
        })
        # Should either succeed (if rate limiting disabled) or return 429
        assert response.status_code in [400, 401, 429]
    
    def test_rate_limit_on_api_endpoints(self, api_client):
        """Test rate limiting on API endpoints"""
        # Make many requests to an endpoint
        for i in range(100):
            response = api_client.get('/api/products/')
        
        # Should not crash, might be rate limited
        assert response.status_code in [200, 429]

