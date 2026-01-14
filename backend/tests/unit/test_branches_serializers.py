"""
Unit tests for branches Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.branches.serializers import *
from apps.branches.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchesSerializers:
    """Test branches serializers"""
    
    def test_serializer_basic(self, api_client):
        """Test basic serialization"""
        # TODO: Add specific tests
        pass
    
    def test_serializer_validation(self):
        """Test serializer validation"""
        # TODO: Add validation tests
        pass
