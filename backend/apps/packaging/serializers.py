from rest_framework import serializers
from .models import PackagingType, PackagingMaterial, PackagingRule, PackagingInstance, PackagingMaterialUsage


class PackagingMaterialUsageSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name_ar', read_only=True)
    
    class Meta:
        model = PackagingMaterialUsage
        fields = [
            'id', 'material', 'material_name',
            'quantity', 'unit_cost', 'total_cost'
        ]


class PackagingInstanceSerializer(serializers.ModelSerializer):
    packaging_type_name = serializers.CharField(source='packaging_type.name_ar', read_only=True)
    materials_used_details = PackagingMaterialUsageSerializer(source='packagingmaterialusage_set', many=True, read_only=True)
    
    class Meta:
        model = PackagingInstance
        fields = [
            'id', 'booking', 'packaging_type', 'packaging_type_name',
            'status', 'packaging_cost', 'materials_used',
            'materials_used_details', 'prepared_at', 'used_at',
            'returned_at', 'notes', 'prepared_by'
        ]
        read_only_fields = ['prepared_at']


class PackagingRuleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    category_name = serializers.CharField(source='product_category.name_ar', read_only=True)
    packaging_type_name = serializers.CharField(source='packaging_type.name_ar', read_only=True)
    
    class Meta:
        model = PackagingRule
        fields = [
            'id', 'product', 'product_name',
            'product_category', 'category_name',
            'packaging_type', 'packaging_type_name',
            'min_rental_days', 'max_rental_days',
            'requires_protection', 'priority', 'is_active'
        ]


class PackagingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagingType
        fields = [
            'id', 'name', 'name_ar', 'size',
            'dimensions_length', 'dimensions_width', 'dimensions_height',
            'weight_capacity', 'description', 'is_active'
        ]


class PackagingMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagingMaterial
        fields = [
            'id', 'name', 'name_ar', 'material_type',
            'cost_per_unit', 'is_reusable', 'is_active'
        ]

