"""
Unit tests for warranties Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.warranties.serializers import *
from apps.warranties.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantiesSerializers:
    """Test warranties serializers"""
    
    def test_serializer_basic(self, api_client):
        """Test basic serialization"""
        # TODO: Add specific tests
        pass
    
    def test_serializer_validation(self):
        """Test serializer validation"""
        # TODO: Add validation tests
        pass
