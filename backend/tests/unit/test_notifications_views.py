"""
Unit tests for notifications Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.notifications.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationsViews:
    """Test notifications views"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing requires authentication"""
        # TODO: Update with actual endpoint
        response = api_client.get('/api/notifications/')
        # assert response.status_code == status.HTTP_401_UNAUTHORIZED
        pass
    
    def test_create_requires_auth(self, api_client):
        """Test creating requires authentication"""
        # TODO: Update with actual endpoint
        response = api_client.post('/api/notifications/', {})
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
