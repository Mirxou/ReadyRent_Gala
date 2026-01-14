from django.contrib import admin
from .models import Branch, BranchInventory, BranchStaff, BranchPerformance


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'code', 'city', 'manager', 'is_active', 'created_at']
    list_filter = ['is_active', 'city', 'created_at']
    search_fields = ['name', 'name_ar', 'code', 'address', 'city']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BranchInventory)
class BranchInventoryAdmin(admin.ModelAdmin):
    list_display = ['branch', 'product', 'quantity_available', 'quantity_total', 'quantity_rented', 'updated_at']
    list_filter = ['branch', 'updated_at']
    search_fields = ['branch__name', 'product__name', 'product__name_ar']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BranchStaff)
class BranchStaffAdmin(admin.ModelAdmin):
    list_display = ['branch', 'staff', 'role', 'is_active', 'assigned_at']
    list_filter = ['is_active', 'role', 'assigned_at']
    search_fields = ['branch__name', 'staff__email']
    readonly_fields = ['assigned_at']


@admin.register(BranchPerformance)
class BranchPerformanceAdmin(admin.ModelAdmin):
    list_display = ['branch', 'period_start', 'period_end', 'total_bookings', 'total_revenue', 'total_products']
    list_filter = ['period_start', 'period_end']
    search_fields = ['branch__name']
    readonly_fields = ['created_at']


