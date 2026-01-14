from rest_framework import serializers
from .models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod


class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    
    class Meta:
        model = MaintenanceSchedule
        fields = [
            'id', 'product', 'product_name',
            'maintenance_type', 'duration_hours',
            'required_between_rentals', 'is_active',
            'created_at', 'updated_at'
        ]


class MaintenancePeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenancePeriod
        fields = [
            'id', 'maintenance_record', 'start_datetime',
            'end_datetime', 'blocks_bookings'
        ]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    period = MaintenancePeriodSerializer(read_only=True)
    
    class Meta:
        model = MaintenanceRecord
        fields = [
            'id', 'product', 'product_name',
            'maintenance_type', 'status',
            'scheduled_start', 'scheduled_end',
            'actual_start', 'actual_end',
            'assigned_to', 'assigned_to_email',
            'notes', 'cost', 'related_booking',
            'is_overdue', 'duration_minutes', 'period',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

