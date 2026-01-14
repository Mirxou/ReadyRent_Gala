"""
Unit tests for bundles Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from apps.bundles.models import (
    Bundle, BundleItem, BundleCategory, BundleBooking, BundleReview
)
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleViewSet:
    """Test Bundle ViewSet"""
    
    def test_list_bundles(self, api_client):
        """Test listing bundles (public endpoint)"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        Bundle.objects.create(
            name='Test Bundle',
            name_ar='حزمة تجريبية',
            slug='test-bundle',
            description='Test',
            category=bundle_category,
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00'),
            is_active=True
        )
        
        response = api_client.get('/api/bundles/bundles/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_calculate_price(self, api_client):
        """Test calculate price endpoint"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='حزمة تجريبية',
            slug='test-bundle',
            description='Test',
            category=bundle_category,
            base_price=Decimal('100.00'),
            bundle_price=Decimal('80.00'),
            min_days=3,
            is_active=True
        )
        
        start_date = date.today()
        end_date = start_date + timedelta(days=4)
        
        response = api_client.get(
            f'/api/bundles/bundles/{bundle.id}/calculate_price/',
            {'start_date': start_date.isoformat(), 'end_date': end_date.isoformat()}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'days' in response.data
        assert 'bundle_price' in response.data


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleBookingViewSet:
    """Test BundleBooking ViewSet"""
    
    def test_create_booking_requires_auth(self, api_client):
        """Test creating booking requires authentication"""
        response = api_client.post('/api/bundles/bookings/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_booking(self, api_client, regular_user):
        """Test creating bundle booking"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='حزمة تجريبية',
            slug='test-bundle',
            description='Test',
            category=bundle_category,
            base_price=Decimal('100.00'),
            bundle_price=Decimal('80.00'),
            min_days=3,
            is_active=True
        )
        
        api_client.force_authenticate(user=regular_user)
        
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        
        response = api_client.post('/api/bundles/bookings/', {
            'bundle': bundle.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_days': 4
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'pending'
    
    def test_my_bookings(self, api_client, regular_user):
        """Test my bookings endpoint"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/bundles/bookings/my_bookings/')
        assert response.status_code == status.HTTP_200_OK
