"""
Unit tests for notifications Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.notifications.serializers import *
from apps.notifications.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationsSerializers:
    """Test notifications serializers"""
    
    def test_serializer_basic(self, api_client):
        """Test basic serialization"""
        # TODO: Add specific tests
        pass
    
    def test_serializer_validation(self):
        """Test serializer validation"""
        # TODO: Add validation tests
        pass
