from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'label', 'city', 'is_default', 'is_active']
    list_filter = ['city', 'is_default', 'is_active', 'created_at']
    search_fields = ['user__email', 'full_address', 'street']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'city', 'delivery_fee', 'is_active']
    list_filter = ['city', 'is_active']
    search_fields = ['name', 'name_ar']


class DeliveryTrackingInline(admin.TabularInline):
    model = DeliveryTracking
    extra = 0
    readonly_fields = ['timestamp']


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ['booking', 'delivery_type', 'status', 'delivery_date', 'assigned_driver', 'created_at']
    list_filter = ['status', 'delivery_type', 'delivery_date', 'created_at']
    search_fields = ['booking__product__name', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'last_tracking_update']
    inlines = [DeliveryTrackingInline]
    
    fieldsets = (
        (_('Booking'), {
            'fields': ('booking', 'delivery_type', 'status')
        }),
        (_('Addresses'), {
            'fields': ('delivery_address', 'pickup_address', 'delivery_zone')
        }),
        (_('Schedule'), {
            'fields': ('delivery_date', 'delivery_time_slot', 'pickup_date', 'pickup_time_slot')
        }),
        (_('Assignment'), {
            'fields': ('assigned_driver', 'delivery_fee')
        }),
        (_('GPS Tracking'), {
            'fields': ('current_latitude', 'current_longitude', 'last_tracking_update')
        }),
        (_('Notes'), {
            'fields': ('notes',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DeliveryTracking)
class DeliveryTrackingAdmin(admin.ModelAdmin):
    list_display = ['delivery_request', 'latitude', 'longitude', 'status', 'timestamp']
    list_filter = ['timestamp', 'status']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

