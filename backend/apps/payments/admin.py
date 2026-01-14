"""
Admin configuration for Payment app
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Payment, PaymentMethod, PaymentWebhook


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'name']
    search_fields = ['name', 'display_name']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'booking', 'payment_method', 'amount', 'currency',
        'status', 'transaction_id', 'created_at', 'completed_at'
    ]
    list_filter = ['status', 'payment_method', 'currency', 'created_at']
    search_fields = ['transaction_id', 'user__email', 'booking__id']
    readonly_fields = ['created_at', 'updated_at', 'completed_at', 'transaction_id']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('المعلومات الأساسية'), {
            'fields': ('user', 'booking', 'payment_method', 'amount', 'currency', 'status')
        }),
        (_('تفاصيل الدفع'), {
            'fields': ('phone_number', 'otp_code', 'card_last_four', 'card_brand')
        }),
        (_('المعاملة'), {
            'fields': ('transaction_id', 'gateway_response', 'failure_reason')
        }),
        (_('الطوابع الزمنية'), {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = ['id', 'payment', 'payment_method', 'event_type', 'processed', 'created_at']
    list_filter = ['payment_method', 'event_type', 'processed', 'created_at']
    search_fields = ['payment__transaction_id', 'event_type']
    readonly_fields = ['created_at', 'payload', 'headers']
    date_hierarchy = 'created_at'
