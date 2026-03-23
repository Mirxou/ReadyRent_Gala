"""
Unit tests for maintenance Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.maintenance.serializers import (
    MaintenanceScheduleSerializer, MaintenanceRecordSerializer, MaintenancePeriodSerializer
)
from apps.maintenance.models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceScheduleSerializer:
    """Test MaintenanceSchedule serializer"""
    
    def test_schedule_serialization(self, product, api_client):
        """Test maintenance schedule serialization"""
        schedule = MaintenanceSchedule.objects.create(
            product=product,
            maintenance_type='cleaning',
            duration_hours=2,
            required_between_rentals=True,
            is_active=True
        )
        
        serializer = MaintenanceScheduleSerializer(schedule)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'maintenance_type' in data
        assert 'duration_hours' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceRecordSerializer:
    """Test MaintenanceRecord serializer"""
    
    def test_record_serialization(self, product, staff_user, api_client):
        """Test maintenance record serialization"""
        scheduled_start = timezone.now() + timedelta(days=1)
        scheduled_end = scheduled_start + timedelta(hours=2)
        
        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            assigned_to=staff_user
        )
        
        serializer = MaintenanceRecordSerializer(record)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'status' in data
        assert 'assigned_to_email' in data
        assert 'is_overdue' in data
        assert 'duration_minutes' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenancePeriodSerializer:
    """Test MaintenancePeriod serializer"""
    
    def test_period_serialization(self, product, staff_user, api_client):
        """Test maintenance period serialization"""
        scheduled_start = timezone.now() + timedelta(days=1)
        scheduled_end = scheduled_start + timedelta(hours=2)
        
        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end
        )
        
        period = MaintenancePeriod.objects.create(
            maintenance_record=record,
            start_datetime=scheduled_start,
            end_datetime=scheduled_end,
            blocks_bookings=True
        )
        
        serializer = MaintenancePeriodSerializer(period)
        data = serializer.data
        
        assert 'id' in data
        assert 'maintenance_record' in data
        assert 'start_datetime' in data
        assert 'end_datetime' in data
        assert 'blocks_bookings' in data
