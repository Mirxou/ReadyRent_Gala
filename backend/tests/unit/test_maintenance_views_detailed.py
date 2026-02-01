import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.maintenance.models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod

@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceDetailed:
    """Detailed tests for maintenance views"""

    def test_maintenance_record_flow(self, api_client, admin_user, product):
        """Test start -> complete maintenance flow"""
        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=timezone.now(),
            scheduled_end=timezone.now() + timedelta(hours=2)
        )
        api_client.force_authenticate(user=admin_user)
        
        # 1. Start
        response = api_client.post(f'/api/maintenance/records/{record.id}/start_maintenance/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'in_progress'
        
        # 2. Complete
        response = api_client.post(f'/api/maintenance/records/{record.id}/complete_maintenance/', {'notes': 'Done'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'
        assert 'Done' in response.data['notes']

    def test_maintenance_record_upcoming_overdue(self, api_client, regular_user, admin_user, product):
        """Test upcoming and overdue actions"""
        # Upcoming
        MaintenanceRecord.objects.create(
            product=product, maintenance_type='inspection', status='scheduled',
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=1)
        )
        # Overdue
        MaintenanceRecord.objects.create(
            product=product, maintenance_type='repair', status='scheduled',
            scheduled_start=timezone.now() - timedelta(days=2),
            scheduled_end=timezone.now() - timedelta(days=1)
        )
        
        api_client.force_authenticate(user=regular_user)
        # Upcoming (Authenticated)
        response = api_client.get('/api/maintenance/records/upcoming/')
        assert response.status_code == status.HTTP_200_OK
        
        # Overdue (Admin only)
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/maintenance/records/overdue/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_maintenance_period_list(self, api_client, regular_user, product):
        """Test MaintenancePeriod views"""
        record = MaintenanceRecord.objects.create(
            product=product, maintenance_type='cleaning', status='completed',
            scheduled_start=timezone.now(), scheduled_end=timezone.now()
        )
        period = MaintenancePeriod.objects.create(
            maintenance_record=record,
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timedelta(hours=1),
            blocks_bookings=True
        )
        api_client.force_authenticate(user=regular_user)
        
        # ViewSet
        response = api_client.get('/api/maintenance/periods/')
        assert response.status_code == status.HTTP_200_OK
        
        # List View with product filter
        response = api_client.get(f'/api/maintenance/periods/list/?product={product.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_maintenance_schedule_list(self, api_client, admin_user, product):
        """Test MaintenanceSchedule views"""
        MaintenanceSchedule.objects.create(
            product=product, maintenance_type='deep_clean', duration_hours=4, is_active=True
        )
        api_client.force_authenticate(user=admin_user)
        
        # ViewSet
        response = api_client.get('/api/maintenance/schedules/')
        assert response.status_code == status.HTTP_200_OK
        
        # List View
        response = api_client.get('/api/maintenance/schedules/list/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_invalid_transitions(self, api_client, admin_user, product):
        """Test starting from wrong state"""
        record = MaintenanceRecord.objects.create(
            product=product, maintenance_type='cleaning', status='completed',
            scheduled_start=timezone.now(), scheduled_end=timezone.now()
        )
        api_client.force_authenticate(user=admin_user)
        
        # Start when completed
        response = api_client.post(f'/api/maintenance/records/{record.id}/start_maintenance/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Complete when scheduled
        record.status = 'scheduled'
        record.save()
        response = api_client.post(f'/api/maintenance/records/{record.id}/complete_maintenance/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
