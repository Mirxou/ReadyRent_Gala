"""
Serializers for Branches app
"""
from rest_framework import serializers
from .models import Branch, BranchInventory, BranchStaff, BranchPerformance
from apps.products.serializers import ProductListSerializer


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for Branch"""
    manager_email = serializers.EmailField(source='manager.email', read_only=True)
    staff_count = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'name_ar', 'code', 'address', 'city', 'postal_code',
            'latitude', 'longitude', 'phone', 'email', 'manager', 'manager_email',
            'is_active', 'opening_hours', 'staff_count', 'product_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_staff_count(self, obj):
        return obj.staff_members.filter(is_active=True).count()
    
    def get_product_count(self, obj):
        return obj.inventory_items.filter(quantity_available__gt=0).count()


class BranchInventorySerializer(serializers.ModelSerializer):
    """Serializer for Branch Inventory"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    branch_name = serializers.CharField(source='branch.name_ar', read_only=True)
    availability_status = serializers.SerializerMethodField()
    
    class Meta:
        model = BranchInventory
        fields = [
            'id', 'branch', 'branch_name', 'product', 'product_id',
            'quantity_total', 'quantity_available', 'quantity_rented', 'quantity_maintenance',
            'low_stock_threshold', 'last_restocked', 'availability_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_availability_status(self, obj):
        if not obj.is_in_stock():
            return 'out_of_stock'
        elif obj.is_low_stock():
            return 'low_stock'
        return 'in_stock'


class BranchStaffSerializer(serializers.ModelSerializer):
    """Serializer for Branch Staff"""
    staff_email = serializers.EmailField(source='staff.email', read_only=True)
    branch_name = serializers.CharField(source='branch.name_ar', read_only=True)
    
    class Meta:
        model = BranchStaff
        fields = [
            'id', 'branch', 'branch_name', 'staff', 'staff_email',
            'role', 'is_active', 'assigned_at'
        ]
        read_only_fields = ['assigned_at']


class BranchPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for Branch Performance"""
    branch_name = serializers.CharField(source='branch.name_ar', read_only=True)
    
    class Meta:
        model = BranchPerformance
        fields = [
            'id', 'branch', 'branch_name', 'period_start', 'period_end',
            'total_bookings', 'total_revenue', 'total_products', 'average_rating',
            'created_at'
        ]
        read_only_fields = ['created_at']


