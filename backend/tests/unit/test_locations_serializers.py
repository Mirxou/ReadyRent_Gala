"""
Unit tests for locations Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from apps.locations.serializers import (
    AddressSerializer, DeliveryZoneSerializer,
    DeliveryRequestSerializer, DeliveryTrackingSerializer
)
from apps.locations.models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestAddressSerializer:
    """Test Address serializer"""
    
    def test_address_serialization(self, regular_user, api_client):
        """Test address serialization"""
        address = Address.objects.create(
            user=regular_user,
            label='Home',
            full_address='123 Test Street',
            city='Constantine',
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147'),
            is_default=True
        )
        
        serializer = AddressSerializer(address)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'label' in data
        assert 'full_address' in data
        assert 'latitude' in data
        assert 'longitude' in data
    
    def test_address_validation(self):
        """Test address validation"""
        serializer = AddressSerializer(data={
            'label': 'Home',
            'full_address': 'Test',
            'latitude': Decimal('36.3650'),
            'longitude': None
        })
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestDeliveryZoneSerializer:
    """Test DeliveryZone serializer"""
    
    def test_delivery_zone_serialization(self, api_client):
        """Test delivery zone serialization"""
        zone = DeliveryZone.objects.create(
            name='Downtown',
            name_ar='وسط المدينة',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            radius_km=Decimal('10.00'),
            delivery_fee=Decimal('500.00'),
            is_active=True
        )
        
        serializer = DeliveryZoneSerializer(zone)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'delivery_fee' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestDeliveryRequestSerializer:
    """Test DeliveryRequest serializer"""
    
    def test_delivery_request_serialization(self, regular_user, product, booking, api_client):
        """Test delivery request serialization"""
        address = Address.objects.create(
            user=regular_user,
            label='Home',
            full_address='123 Test Street',
            city='Constantine'
        )
        
        zone = DeliveryZone.objects.create(
            name='Downtown',
            name_ar='وسط المدينة',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            radius_km=Decimal('10.00')
        )
        
        delivery = DeliveryRequest.objects.create(
            booking=booking,
            delivery_type='both',
            status='pending',
            delivery_address=address,
            delivery_zone=zone,
            delivery_date=date.today() + timedelta(days=1),
            delivery_fee=Decimal('500.00')
        )
        
        serializer = DeliveryRequestSerializer(delivery)
        data = serializer.data
        
        assert 'id' in data
        assert 'booking' in data
        assert 'booking_details' in data
        assert 'delivery_address_details' in data
        assert 'delivery_zone_name' in data
        assert 'tracking_history' in data
