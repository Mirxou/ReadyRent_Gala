"""
Unit tests for bundles Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from apps.bundles.serializers import (
    BundleSerializer, BundleItemSerializer, BundleCategorySerializer,
    BundleBookingSerializer, BundleReviewSerializer
)
from apps.bundles.models import (
    Bundle, BundleItem, BundleCategory, BundleBooking, BundleReview
)
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleSerializer:
    """Test Bundle serializer"""
    
    def test_bundle_serialization(self, category, api_client):
        """Test bundle serialization"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='حزمة تجريبية',
            slug='test-bundle',
            description='Test description',
            category=bundle_category,
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00'),
            discount_type='percentage',
            discount_value=Decimal('20.00'),
            is_active=True
        )
        
        serializer = BundleSerializer(bundle)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'category_name' in data
        assert 'base_price' in data
        assert 'bundle_price' in data
        assert 'discount_amount' in data
        assert 'savings' in data
        assert 'items' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleItemSerializer:
    """Test BundleItem serializer"""
    
    def test_bundle_item_serialization(self, product, api_client):
        """Test bundle item serialization"""
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
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00')
        )
        
        item = BundleItem.objects.create(
            bundle=bundle,
            product=product,
            quantity=1,
            order=1
        )
        
        serializer = BundleItemSerializer(item)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'quantity' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleBookingSerializer:
    """Test BundleBooking serializer"""
    
    def test_bundle_booking_serialization(self, regular_user, api_client):
        """Test bundle booking serialization"""
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
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00')
        )
        
        booking = BundleBooking.objects.create(
            user=regular_user,
            bundle=bundle,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
            total_days=4,
            base_price=Decimal('4000.00'),
            total_price=Decimal('3200.00'),
            status='pending'
        )
        
        serializer = BundleBookingSerializer(booking)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'bundle' in data
        assert 'bundle_details' in data
        assert 'total_price' in data
        assert 'savings' in data
