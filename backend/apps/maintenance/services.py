"""
Maintenance services
"""
from django.utils import timezone
from datetime import timedelta
from .models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod


class MaintenanceService:
    """Service for maintenance operations"""
    
    @staticmethod
    def schedule_maintenance_after_return(booking, product):
        """
        Schedule required maintenance after a booking return
        """
        required_schedules = MaintenanceSchedule.objects.filter(
            product=product,
            required_between_rentals=True,
            is_active=True
        )
        
        maintenance_records = []
        for schedule in required_schedules:
            scheduled_start = timezone.now()
            scheduled_end = scheduled_start + timedelta(hours=schedule.duration_hours)
            
            record = MaintenanceRecord.objects.create(
                product=product,
                maintenance_type=schedule.maintenance_type,
                status='scheduled',
                scheduled_start=scheduled_start,
                scheduled_end=scheduled_end,
                related_booking=booking
            )
            
            # Create maintenance period to block bookings
            MaintenancePeriod.objects.create(
                maintenance_record=record,
                start_datetime=scheduled_start,
                end_datetime=scheduled_end,
                blocks_bookings=True
            )
            
            maintenance_records.append(record)
        
        return maintenance_records
    
    @staticmethod
    def is_product_available_for_dates(product, start_date, end_date):
        """
        Check if product is available for booking during dates
        considering maintenance periods
        """
        blocking_periods = MaintenancePeriod.objects.filter(
            maintenance_record__product=product,
            blocks_bookings=True,
            start_datetime__date__lte=end_date,
            end_datetime__date__gte=start_date,
            maintenance_record__status__in=['scheduled', 'in_progress']
        )
        
        return not blocking_periods.exists()
    
    @staticmethod
    def get_next_maintenance_date(product, after_date=None):
        """
        Get the next scheduled maintenance date for a product
        """
        if after_date is None:
            after_date = timezone.now().date()
        
        next_maintenance = MaintenanceRecord.objects.filter(
            product=product,
            status__in=['scheduled', 'in_progress'],
            scheduled_start__date__gte=after_date
        ).order_by('scheduled_start').first()
        
        return next_maintenance.scheduled_start.date() if next_maintenance else None

