from django.contrib import admin
from .models import Vendor, VendorProduct, Commission, VendorPerformance


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['business_name_ar', 'user', 'status', 'is_verified', 'commission_rate', 'total_products', 'total_sales', 'created_at']
    list_filter = ['status', 'is_verified', 'city', 'created_at']
    search_fields = ['business_name', 'business_name_ar', 'user__email', 'tax_id']
    readonly_fields = ['total_products', 'total_sales', 'total_commission', 'rating', 'verified_at', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(VendorProduct)
class VendorProductAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'product', 'commission_rate', 'added_at']
    list_filter = ['added_at']
    search_fields = ['vendor__business_name', 'product__name', 'product__name_ar']
    readonly_fields = ['added_at']


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'product', 'sale_amount', 'commission_amount', 'status', 'calculated_at', 'paid_at']
    list_filter = ['status', 'calculated_at']
    search_fields = ['vendor__business_name', 'product__name', 'payment_reference']
    readonly_fields = ['calculated_at', 'paid_at']
    date_hierarchy = 'calculated_at'


@admin.register(VendorPerformance)
class VendorPerformanceAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'period_start', 'period_end', 'total_bookings', 'total_revenue', 'total_commission', 'average_rating']
    list_filter = ['period_start', 'period_end']
    search_fields = ['vendor__business_name']
    readonly_fields = ['created_at']


