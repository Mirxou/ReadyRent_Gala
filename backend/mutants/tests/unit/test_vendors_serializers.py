"""
Unit tests for vendors Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.vendors.serializers import (
    VendorSerializer, VendorProductSerializer,
    CommissionSerializer, VendorPerformanceSerializer
)
from apps.vendors.models import Vendor, VendorProduct, Commission, VendorPerformance
from apps.products.models import Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorSerializer:
    """Test VendorSerializer"""
    
    def test_serializer_output_fields(self, vendor):
        """Test serializer includes all expected fields"""
        serializer = VendorSerializer(vendor)
        data = serializer.data
        
        assert 'id' in data
        assert 'user_email' in data
        assert 'business_name' in data
        assert 'business_name_ar' in data
        assert 'phone' in data
        assert 'email' in data
        assert 'commission_rate' in data
        assert 'status' in data
        assert 'is_verified' in data
        assert 'total_products' in data
        assert 'total_sales' in data
        
        assert data['user_email'] == vendor.user.email
        assert data['business_name'] == vendor.business_name
    
    def test_serializer_read_only_fields(self, vendor):
        """Test that stats fields are read-only"""
        data = {
            'business_name': 'Updated Name',
            'total_sales': 99999.99,  # Should be read-only
            'total_commission': 5000.00,  # Should be read-only
            'rating': 5.0  # Should be read-only
        }
        
        serializer = VendorSerializer(vendor, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        assert updated.business_name == 'Updated Name'
        # Stats should not change
        assert updated.total_sales != Decimal('99999.99')
        assert updated.total_commission != Decimal('5000.00')
    
    def test_serializer_commission_rate_validation(self, vendor):
        """Test commission rate validation (0-100)"""
        data = {'commission_rate': 150.00}  # Invalid
        serializer = VendorSerializer(vendor, data=data, partial=True)
        
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorProductSerializer:
    """Test VendorProductSerializer"""
    
    def test_serializer_fields(self, vendor, product):
        """Test vendor product serializer fields"""
        vendor_product = VendorProduct.objects.create(
            vendor=vendor,
            product=product
        )
        
        serializer = VendorProductSerializer(vendor_product)
        data = serializer.data
        
        assert 'id' in data
        assert 'vendor' in data
        assert 'product' in data
        assert 'commission_rate' in data
        assert 'added_at' in data
        
        # Commission rate should be vendor's default
        assert float(data['commission_rate']) == float(vendor.commission_rate)
    
    def test_serializer_custom_commission_rate(self, vendor, product):
        """Test product-specific commission rate"""
        vendor_product = VendorProduct.objects.create(
            vendor=vendor,
            product=product,
            commission_rate=Decimal('20.00')
        )
        
        serializer = VendorProductSerializer(vendor_product)
        data = serializer.data
        
        # Should use product-specific rate
        assert float(data['commission_rate']) == 20.00


@pytest.mark.unit
@pytest.mark.django_db
class TestCommissionSerializer:
    """Test CommissionSerializer"""
    
    def test_serializer_fields(self, vendor, product, booking):
        """Test commission serializer output fields"""
        commission = Commission.objects.create(
            vendor=vendor,
            booking=booking,
            product=product,
            sale_amount=Decimal('5000.00'),
            commission_rate=Decimal('15.00'),
            commission_amount=Decimal('750.00'),
            status='calculated'
        )
        
        serializer = CommissionSerializer(commission)
        data = serializer.data
        
        assert 'id' in data
        assert 'vendor_name' in data
        assert 'product_name' in data
        assert 'sale_amount' in data
        assert 'commission_rate' in data
        assert 'commission_amount' in data
        assert 'status' in data
        
        assert data['vendor_name'] == vendor.business_name_ar
        assert float(data['commission_amount']) == 750.00


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorPerformanceSerializer:
    """Test VendorPerformanceSerializer"""
    
    def test_serializer_fields(self, vendor):
        """Test performance serializer fields"""
        from datetime import date
        
        performance = VendorPerformance.objects.create(
            vendor=vendor,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            total_bookings=10,
            total_revenue=Decimal('50000.00'),
            total_commission=Decimal('7500.00'),
            average_rating=Decimal('4.50')
        )
        
        serializer = VendorPerformanceSerializer(performance)
        data = serializer.data
        
        assert 'id' in data
        assert 'vendor_name' in data
        assert 'period_start' in data
        assert 'period_end' in data
        assert 'total_bookings' in data
        assert 'total_revenue' in data
        assert 'average_rating' in data
        
        assert data['total_bookings'] == 10
        assert float(data['average_rating']) == 4.50
