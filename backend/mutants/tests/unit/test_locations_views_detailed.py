import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from apps.locations.models import Address, DeliveryZone, DeliveryRequest
from apps.users.models import User

@pytest.mark.unit
@pytest.mark.django_db
class TestLocationsDetailed:
    """Detailed tests for locations views"""

    def test_address_viewset_crud(self, api_client, regular_user):
        """Test Address ViewSet CRUD"""
        api_client.force_authenticate(user=regular_user)
        
        # Create
        response = api_client.post('/api/locations/addresses/', {
            'label': 'Home',
            'full_address': '123 Main St, Constantine, Algeria',
            'city': 'Constantine',
            'country': 'Algeria'
        })
        assert response.status_code == status.HTTP_201_CREATED
        address_id = response.data['id']
        
        # List
        response = api_client.get('/api/locations/addresses/')
        assert response.status_code == status.HTTP_200_OK
        
        # Update
        response = api_client.patch(f'/api/locations/addresses/{address_id}/', {'is_default': True})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_default'] is True

    def test_delivery_zone_check_same_day(self, api_client):
        """Test check_same_day action"""
        zone = DeliveryZone.objects.create(
            name='Zone 1', name_ar='منطقة 1', city='Constantine',
            center_latitude=36.36, center_longitude=6.61, radius_km=10.0,
            is_active=True, same_day_delivery_available=True
        )
        response = api_client.get(f'/api/locations/delivery-zones/{zone.id}/check_same_day/')
        assert response.status_code == status.HTTP_200_OK

    def test_delivery_request_actions(self, api_client, admin_user, regular_user, booking):
        """Test delivery request actions"""
        address = Address.objects.create(
            user=regular_user, label='Home', full_address='123 St', city='Constantine', country='Algeria'
        )
        delivery = DeliveryRequest.objects.create(
            booking=booking,
            delivery_address=address,
            delivery_date=timezone.now().date(),
            status='pending'
        )
        
        # 1. Assign Driver
        staff = User.objects.create_user(username='driver', email='driver@ex.com', password='p', role='staff')
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/locations/deliveries/{delivery.id}/assign_driver/', {'driver_id': staff.id})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'assigned'
        
        # 2. Update Tracking
        api_client.force_authenticate(user=staff)
        data = {
            'latitude': 36.36,
            'longitude': 6.61,
            'status': 'in_transit'
        }
        response = api_client.post(f'/api/locations/deliveries/{delivery.id}/update_tracking/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'in_transit'

    def test_my_deliveries(self, api_client, regular_user, booking):
        """Test my_deliveries action"""
        address = Address.objects.create(
            user=regular_user, label='Office', full_address='456 St', city='Constantine', country='Algeria'
        )
        DeliveryRequest.objects.create(
            booking=booking,
            delivery_address=address,
            delivery_date=timezone.now().date(),
            status='pending'
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/locations/deliveries/my_deliveries/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
