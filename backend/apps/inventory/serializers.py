from rest_framework import serializers
from .models import InventoryItem, StockAlert, StockMovement


class InventoryItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    availability_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'product', 'product_name', 'product_slug',
            'quantity_total', 'quantity_available', 'quantity_rented',
            'quantity_maintenance', 'low_stock_threshold',
            'is_low_stock', 'is_in_stock', 'availability_status',
            'last_restocked', 'created_at', 'updated_at'
        ]
        read_only_fields = ['quantity_rented', 'created_at', 'updated_at']


class StockAlertSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source='inventory_item.product.name_ar', read_only=True)
    acknowledged_by_email = serializers.EmailField(source='acknowledged_by.email', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = [
            'id', 'inventory_item', 'inventory_item_name',
            'alert_type', 'status', 'message',
            'acknowledged_by', 'acknowledged_by_email',
            'acknowledged_at', 'created_at'
        ]
        read_only_fields = ['created_at']


class StockMovementSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source='inventory_item.product.name_ar', read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'inventory_item', 'inventory_item_name',
            'movement_type', 'quantity', 'previous_quantity', 'new_quantity',
            'reference_type', 'reference_id', 'notes',
            'created_by', 'created_by_email', 'created_at'
        ]
        read_only_fields = ['created_at']

