from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Return, ReturnItem, Refund


class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0


@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = ['booking', 'status', 'requested_at', 'received_at', 'inspector', 'is_late']
    list_filter = ['status', 'requested_at', 'received_at']
    search_fields = ['booking__product__name', 'return_notes', 'inspection_notes']
    readonly_fields = ['requested_at', 'created_at', 'updated_at', 'is_late']
    date_hierarchy = 'requested_at'
    inlines = [ReturnItemInline]
    
    fieldsets = (
        (_('Booking'), {
            'fields': ('booking',)
        }),
        (_('Status'), {
            'fields': ('status',)
        }),
        (_('Pickup Information'), {
            'fields': ('scheduled_pickup_date', 'actual_pickup_date', 'received_at')
        }),
        (_('Inspection'), {
            'fields': ('inspection_date', 'inspector', 'inspection_notes', 'damage_assessment', 'damage_cost')
        }),
        (_('Notes'), {
            'fields': ('return_notes',)
        }),
        (_('Completion'), {
            'fields': ('completed_at',)
        }),
        (_('Timestamps'), {
            'fields': ('requested_at', 'created_at', 'updated_at', 'is_late')
        }),
    )


@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    list_display = ['return_request', 'product', 'quantity_returned', 'condition']
    list_filter = ['condition']
    search_fields = ['product__name', 'notes']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['return_request', 'refund_type', 'amount', 'status', 'created_at']
    list_filter = ['status', 'refund_type', 'created_at']
    search_fields = ['return_request__booking__product__name', 'transaction_reference']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

