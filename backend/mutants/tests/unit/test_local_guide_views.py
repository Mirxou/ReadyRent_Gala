"""
Unit tests for local_guide Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.local_guide.models import ServiceCategory, LocalService, ServiceReview
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestServiceCategoryViewSet:
    """Test ServiceCategory ViewSet"""
    
    def test_list_categories(self, api_client):
        """Test listing service categories (public endpoint)"""
        ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography',
            is_active=True
        )
        
        response = api_client.get('/api/local-guide/categories/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestLocalServiceViewSet:
    """Test LocalService ViewSet"""
    
    def test_list_services(self, api_client):
        """Test listing local services (public endpoint)"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography'
        )
        
        LocalService.objects.create(
            name='Test Service',
            name_ar='خدمة تجريبية',
            service_type='photographer',
            category=category,
            phone='+213123456789',
            address='Test',
            is_active=True
        )
        
        response = api_client.get('/api/local-guide/services/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_service_type(self, api_client):
        """Test filtering services by type"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography'
        )
        
        LocalService.objects.create(
            name='Test Photographer',
            name_ar='مصور تجريبي',
            service_type='photographer',
            category=category,
            phone='+213123456789',
            address='Test',
            is_active=True
        )
        
        response = api_client.get('/api/local-guide/services/?service_type=photographer')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestServiceReviewViewSet:
    """Test ServiceReview ViewSet"""
    
    def test_create_review_requires_auth(self, api_client):
        """Test creating review requires authentication"""
        response = api_client.post('/api/local-guide/reviews/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_review(self, api_client, regular_user):
        """Test creating service review"""
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
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/local-guide/reviews/', {
            'service': service.id,
            'rating': 5,
            'comment': 'Great service!'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 5
