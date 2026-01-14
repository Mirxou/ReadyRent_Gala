"""
Unit tests for locations Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from apps.locations.models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestAddressViewSet:
    """Test Address ViewSet"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing addresses requires authentication"""
        response = api_client.get('/api/locations/addresses/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_address(self, api_client, regular_user):
        """Test creating address"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/locations/addresses/', {
            'label': 'Home',
            'full_address': '123 Test Street',
            'city': 'Constantine',
            'latitude': '36.3650',
            'longitude': '6.6147',
            'is_default': True
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['label'] == 'Home'
    
    def test_list_user_addresses(self, api_client, regular_user):
        """Test listing user addresses"""
        Address.objects.create(
            user=regular_user,
            label='Home',
            full_address='123 Test Street',
            city='Constantine'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/locations/addresses/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.unit
@pytest.mark.django_db
class TestDeliveryZoneViewSet:
    """Test DeliveryZone ViewSet"""
    
    def test_list_zones(self, api_client):
        """Test listing delivery zones (public endpoint)"""
        DeliveryZone.objects.create(
            name='Downtown',
            name_ar='وسط المدينة',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            radius_km=Decimal('10.00'),
            is_active=True
        )
        
        response = api_client.get('/api/locations/delivery-zones/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestDeliveryRequestViewSet:
    """Test DeliveryRequest ViewSet"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing delivery requests requires authentication"""
        response = api_client.get('/api/locations/deliveries/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_delivery_request(self, api_client, regular_user, product, booking):
        """Test creating delivery request"""
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
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/locations/deliveries/', {
            'booking': booking.id,
            'delivery_type': 'both',
            'delivery_address': address.id,
            'delivery_zone': zone.id,
            'delivery_date': (date.today() + timedelta(days=1)).isoformat()
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'pending'
