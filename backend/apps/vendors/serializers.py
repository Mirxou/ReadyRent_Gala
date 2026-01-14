"""
Serializers for Vendors app
"""
from rest_framework import serializers
from .models import Vendor, VendorProduct, Commission, VendorPerformance
from apps.products.serializers import ProductListSerializer


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'user_email', 'business_name', 'business_name_ar',
            'tax_id', 'registration_number', 'phone', 'email', 'address', 'city',
            'description', 'description_ar', 'website', 'logo',
            'commission_rate', 'status', 'is_verified', 'verified_at', 'verified_by', 'verified_by_email',
            'total_products', 'total_sales', 'total_commission', 'rating',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'total_products', 'total_sales', 'total_commission', 'rating',
            'verified_at', 'created_at', 'updated_at'
        ]


class VendorProductSerializer(serializers.ModelSerializer):
    """Serializer for Vendor Product"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    commission_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorProduct
        fields = [
            'id', 'vendor', 'product', 'product_id',
            'commission_rate', 'added_at'
        ]
        read_only_fields = ['added_at']
    
    def get_commission_rate(self, obj):
        return float(obj.get_commission_rate())


class CommissionSerializer(serializers.ModelSerializer):
    """Serializer for Commission"""
    vendor_name = serializers.CharField(source='vendor.business_name_ar', read_only=True)
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    
    class Meta:
        model = Commission
        fields = [
            'id', 'vendor', 'vendor_name', 'booking', 'product', 'product_name',
            'sale_amount', 'commission_rate', 'commission_amount',
            'status', 'calculated_at', 'paid_at', 'payment_reference', 'notes'
        ]
        read_only_fields = ['calculated_at', 'paid_at']


class VendorPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for Vendor Performance"""
    vendor_name = serializers.CharField(source='vendor.business_name_ar', read_only=True)
    
    class Meta:
        model = VendorPerformance
        fields = [
            'id', 'vendor', 'vendor_name', 'period_start', 'period_end',
            'total_bookings', 'total_revenue', 'total_commission',
            'average_rating', 'products_added', 'created_at'
        ]
        read_only_fields = ['created_at']


