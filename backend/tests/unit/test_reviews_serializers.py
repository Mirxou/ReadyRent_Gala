"""
Unit tests for reviews Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.reviews.serializers import *
from apps.reviews.models import *

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewsSerializers:
    """Test reviews serializers"""
    
    def test_serializer_basic(self, api_client):
        """Test basic serialization"""
        # TODO: Add specific tests
        pass
    
    def test_serializer_validation(self):
        """Test serializer validation"""
        # TODO: Add validation tests
        pass
