"""
Unit tests for reviews Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.reviews.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewsViews:
    """Test reviews views"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing requires authentication"""
        # TODO: Update with actual endpoint
        response = api_client.get('/api/reviews/')
        # assert response.status_code == status.HTTP_401_UNAUTHORIZED
        pass
    
    def test_create_requires_auth(self, api_client):
        """Test creating requires authentication"""
        # TODO: Update with actual endpoint
        response = api_client.post('/api/reviews/', {})
        # assert response.status_code == status.HTTP_401_UNAUTHORIZED
        pass
    
    def test_list_authenticated(self, api_client, regular_user):
        """Test listing for authenticated user"""
        # TODO: Add implementation
        pass
    
    def test_create_authenticated(self, api_client, regular_user):
        """Test creating for authenticated user"""
        # TODO: Add implementation
        pass
