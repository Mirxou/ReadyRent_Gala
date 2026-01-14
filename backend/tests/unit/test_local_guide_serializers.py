"""
Unit tests for local_guide Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.local_guide.serializers import (
    ServiceCategorySerializer, LocalServiceSerializer,
    ServiceReviewSerializer, ServiceImageSerializer
)
from apps.local_guide.models import (
    ServiceCategory, LocalService, ServiceReview, ServiceImage
)

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestServiceCategorySerializer:
    """Test ServiceCategory serializer"""
    
    def test_category_serialization(self, api_client):
        """Test service category serialization"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography',
            is_active=True
        )
        
        serializer = ServiceCategorySerializer(category)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'services_count' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestLocalServiceSerializer:
    """Test LocalService serializer"""
    
    def test_service_serialization(self, api_client):
        """Test local service serialization"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography'
        )
        
        service = LocalService.objects.create(
            name='Test Photographer',
            name_ar='مصور تجريبي',
            service_type='photographer',
            category=category,
            phone='+213123456789',
            address='Test Address',
            city='Constantine',
            is_active=True
        )
        
        serializer = LocalServiceSerializer(service)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'category_name' in data
        assert 'images' in data
        assert 'reviews' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestServiceReviewSerializer:
    """Test ServiceReview serializer"""
    
    def test_review_serialization(self, regular_user, api_client):
        """Test service review serialization"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography'
        )
        
        service = LocalService.objects.create(
            name='Test Service',
            name_ar='خدمة تجريبية',
            service_type='photographer',
            category=category,
            phone='+213123456789',
            address='Test',
            is_active=True
        )
        
        review = ServiceReview.objects.create(
            service=service,
            user=regular_user,
            rating=5,
            comment='Great service!'
        )
        
        serializer = ServiceReviewSerializer(review)
        data = serializer.data
        
        assert 'id' in data
        assert 'service' in data
        assert 'user_email' in data
        assert 'rating' in data
        assert data['rating'] == 5
