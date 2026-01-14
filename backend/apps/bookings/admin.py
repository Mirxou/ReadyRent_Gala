from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Booking, Cart, CartItem, Waitlist,
    DamageAssessment, DamagePhoto, InspectionChecklist, DamageClaim, Refund, Cancellation
)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'start_date', 'end_date', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['user__email', 'product__name', 'product__name_ar']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
    search_fields = ['user__email']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'start_date', 'end_date', 'quantity', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cart__user__email', 'product__name']


@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'preferred_start_date', 'notified', 'created_at']
    list_filter = ['notified', 'created_at']
    search_fields = ['user__email', 'product__name', 'product__name_ar']
    readonly_fields = ['notified_at', 'created_at']


@admin.register(DamageAssessment)
class DamageAssessmentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'severity', 'status', 'repair_cost', 'assessed_by', 'assessed_at']
    list_filter = ['severity', 'status', 'assessed_at']
    search_fields = ['booking__user__email', 'booking__product__name', 'damage_description']
    readonly_fields = ['assessed_at', 'reviewed_at']
    date_hierarchy = 'assessed_at'


@admin.register(DamagePhoto)
class DamagePhotoAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'photo_type', 'description', 'uploaded_at']
    list_filter = ['photo_type', 'uploaded_at']
    search_fields = ['assessment__booking__user__email', 'description']
    readonly_fields = ['uploaded_at']


@admin.register(InspectionChecklist)
class InspectionChecklistAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'item_name', 'is_checked', 'condition', 'checked_at']
    list_filter = ['is_checked', 'condition']
    search_fields = ['item_name', 'item_description', 'assessment__booking__user__email']
    readonly_fields = ['checked_at']


@admin.register(DamageClaim)
class DamageClaimAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'claimed_amount', 'approved_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['assessment__booking__user__email', 'claim_description']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    date_hierarchy = 'created_at'


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['booking', 'amount', 'reason', 'status', 'created_at', 'processed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['booking__user__email', 'transaction_id', 'reason']
    readonly_fields = ['created_at', 'updated_at', 'processed_at']
    date_hierarchy = 'created_at'


@admin.register(Cancellation)
class CancellationAdmin(admin.ModelAdmin):
    list_display = ['booking', 'cancelled_by', 'cancellation_fee', 'refund_amount', 'cancelled_at']
    list_filter = ['cancelled_at']
    search_fields = ['booking__user__email', 'reason']
    readonly_fields = ['cancelled_at']
    date_hierarchy = 'cancelled_at'