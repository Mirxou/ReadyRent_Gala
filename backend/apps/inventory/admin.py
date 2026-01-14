from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import InventoryItem, StockAlert, StockMovement, VariantInventory


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity_total', 'quantity_available', 'quantity_rented', 'quantity_maintenance', 'is_low_stock', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['product__name', 'product__name_ar']
    readonly_fields = ['quantity_rented', 'created_at', 'updated_at']
    
    fieldsets = (
        (_('Product'), {
            'fields': ('product',)
        }),
        (_('Stock Information'), {
            'fields': ('quantity_total', 'quantity_available', 'quantity_rented', 'quantity_maintenance', 'low_stock_threshold')
        }),
        (_('Timestamps'), {
            'fields': ('last_restocked', 'created_at', 'updated_at')
        }),
    )


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ['inventory_item', 'alert_type', 'status', 'created_at', 'acknowledged_by']
    list_filter = ['status', 'alert_type', 'created_at']
    search_fields = ['inventory_item__product__name', 'message']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['inventory_item', 'movement_type', 'quantity', 'previous_quantity', 'new_quantity', 'created_by', 'created_at']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['inventory_item__product__name', 'notes']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(VariantInventory)
class VariantInventoryAdmin(admin.ModelAdmin):
    list_display = ['variant', 'quantity_total', 'quantity_available', 'quantity_rented', 'quantity_maintenance', 'is_low_stock', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['variant__name', 'variant__sku', 'variant__product__name']
    readonly_fields = ['quantity_rented', 'created_at', 'updated_at']
    
    fieldsets = (
        (_('Variant'), {
            'fields': ('variant',)
        }),
        (_('Stock Information'), {
            'fields': ('quantity_total', 'quantity_available', 'quantity_rented', 'quantity_maintenance', 'low_stock_threshold')
        }),
        (_('Timestamps'), {
            'fields': ('last_restocked', 'created_at', 'updated_at')
        }),
    )

