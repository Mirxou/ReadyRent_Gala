from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod


@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ['product', 'maintenance_type', 'duration_hours', 'required_between_rentals', 'is_active']
    list_filter = ['maintenance_type', 'required_between_rentals', 'is_active']
    search_fields = ['product__name', 'product__name_ar']


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ['product', 'maintenance_type', 'status', 'scheduled_start', 'scheduled_end', 'assigned_to', 'is_overdue']
    list_filter = ['status', 'maintenance_type', 'scheduled_start']
    search_fields = ['product__name', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'is_overdue', 'duration_minutes']
    date_hierarchy = 'scheduled_start'
    
    fieldsets = (
        (_('Product'), {
            'fields': ('product', 'maintenance_type')
        }),
        (_('Schedule'), {
            'fields': ('status', 'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end')
        }),
        (_('Assignment'), {
            'fields': ('assigned_to',)
        }),
        (_('Details'), {
            'fields': ('related_booking', 'notes', 'cost')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at', 'is_overdue', 'duration_minutes')
        }),
    )


@admin.register(MaintenancePeriod)
class MaintenancePeriodAdmin(admin.ModelAdmin):
    list_display = ['maintenance_record', 'start_datetime', 'end_datetime', 'blocks_bookings']
    list_filter = ['blocks_bookings', 'start_datetime']
    date_hierarchy = 'start_datetime'

