"""
Unit tests for maintenance Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.maintenance.models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceScheduleViewSet:
    """Test MaintenanceSchedule ViewSet"""
    
    def test_list_requires_admin(self, api_client, regular_user):
        """Test listing schedules requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/maintenance/schedules/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_schedule(self, api_client, admin_user, product):
        """Test creating maintenance schedule"""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post('/api/maintenance/schedules/', {
            'product': product.id,
            'maintenance_type': 'cleaning',
            'duration_hours': 2,
            'required_between_rentals': True
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['maintenance_type'] == 'cleaning'


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceRecordViewSet:
    """Test MaintenanceRecord ViewSet"""
    
    def test_list_requires_admin(self, api_client, regular_user):
        """Test listing records requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/maintenance/records/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_record(self, api_client, admin_user, product, staff_user):
        """Test creating maintenance record"""
        scheduled_start = timezone.now() + timedelta(days=1)
        scheduled_end = scheduled_start + timedelta(hours=2)
        
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post('/api/maintenance/records/', {
            'product': product.id,
            'maintenance_type': 'cleaning',
            'scheduled_start': scheduled_start.isoformat(),
            'scheduled_end': scheduled_end.isoformat(),
            'assigned_to': staff_user.id
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'scheduled'
