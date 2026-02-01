"""
Unit tests for packaging Serializers
"""
import pytest
from decimal import Decimal

from apps.packaging.serializers import (
    PackagingTypeSerializer, PackagingMaterialSerializer,
    PackagingRuleSerializer, PackagingInstanceSerializer,
    PackagingMaterialUsageSerializer
)
from apps.packaging.models import (
    PackagingType, PackagingMaterial,
    PackagingRule, PackagingInstance, PackagingMaterialUsage
)


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingTypeSerializer:
    """Test PackagingTypeSerializer"""
    
    def test_serializer_output_fields(self):
        """Test serializer includes all expected fields"""
        pack_type = PackagingType.objects.create(
            name='Medium Box',
            name_ar='صندوق متوسط',
            size='medium',
            dimensions_length=Decimal('50.00'),
            dimensions_width=Decimal('40.00'),
            dimensions_height=Decimal('30.00'),
            weight_capacity=Decimal('20.00')
        )
        
        serializer = PackagingTypeSerializer(pack_type)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'size' in data
        assert 'dimensions_length' in data
        assert 'dimensions_width' in data
        assert 'dimensions_height' in data
        assert 'weight_capacity' in data
        
        assert data['name'] == 'Medium Box'
        assert data['size'] == 'medium'


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingMaterialSerializer:
    """Test PackagingMaterialSerializer"""
    
    def test_serializer_fields(self):
        """Test material serializer fields"""
        material = PackagingMaterial.objects.create(
            name='Bubble Wrap',
            name_ar='غلاف فقاعي',
            material_type='bubble_wrap',
            cost_per_unit=Decimal('50.00'),
            is_reusable=True
        )
        
        serializer = PackagingMaterialSerializer(material)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'material_type' in data
        assert 'cost_per_unit' in data
        assert 'is_reusable' in data
        
        assert data['material_type'] == 'bubble_wrap'
        assert data['is_reusable'] is True


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingRuleSerializer:
    """Test PackagingRuleSerializer"""
    
    def test_serializer_with_category_rule(self, category):
        """Test rule serializer with category"""
        pack_type = PackagingType.objects.create(
            name='Large Box',
            name_ar='صندوق كبير',
            size='large'
        )
        
        rule = PackagingRule.objects.create(
            product_category=category,
            packaging_type=pack_type,
            priority=10,
            min_rental_days=7
        )
        
        serializer = PackagingRuleSerializer(rule)
        data = serializer.data
        
        assert 'id' in data
        assert 'category_name' in data
        assert 'packaging_type_name' in data
        assert 'priority' in data
        assert 'min_rental_days' in data
        
        assert data['category_name'] == category.name_ar
        assert data['priority'] == 10


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingInstanceSerializer:
    """Test PackagingInstanceSerializer"""
    
    def test_serializer_with_materials(self, booking):
        """Test instance serializer with materials"""
        pack_type = PackagingType.objects.create(
            name='Small Box',
            name_ar='صندوق صغير',
            size='small'
        )
        
        instance = PackagingInstance.objects.create(
            booking=booking,
            packaging_type=pack_type,
            packaging_cost=Decimal('200.00'),
            status='prepared'
        )
        
        material = PackagingMaterial.objects.create(
            name='Protective Sheet',
            name_ar='ورقة واقية',
            material_type='protective_sheet',
            cost_per_unit=Decimal('25.00')
        )
        
        PackagingMaterialUsage.objects.create(
            packaging_instance=instance,
            material=material,
            quantity=3,
            unit_cost=Decimal('25.00'),
            total_cost=Decimal('75.00')
        )
        
        serializer = PackagingInstanceSerializer(instance)
        data = serializer.data
        
        assert 'id' in data
        assert 'packaging_type_name' in data
        assert 'status' in data
        assert 'packaging_cost' in data
        assert 'materials_used_details' in data
        
        assert len(data['materials_used_details']) == 1
        assert data['materials_used_details'][0]['quantity'] == 3


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingMaterialUsageSerializer:
    """Test PackagingMaterialUsageSerializer"""
    
    def test_serializer_calculates_total(self, booking):
        """Test usage serializer with cost calculation"""
        pack_type = PackagingType.objects.create(
            name='Box',
            name_ar='صندوق',
            size='medium'
        )
        
        instance = PackagingInstance.objects.create(
            booking=booking,
            packaging_type=pack_type,
            packaging_cost=Decimal('150.00')
        )
        
        material = PackagingMaterial.objects.create(
            name='Box',
            name_ar='صندوق',
            material_type='box',
            cost_per_unit=Decimal('100.00')
        )
        
        usage = PackagingMaterialUsage.objects.create(
            packaging_instance=instance,
            material=material,
            quantity=2,
            unit_cost=Decimal('100.00'),
            total_cost=Decimal('200.00')
        )
        
        serializer = PackagingMaterialUsageSerializer(usage)
        data = serializer.data
        
        assert 'material_name' in data
        assert 'quantity' in data
        assert 'unit_cost' in data
        assert 'total_cost' in data
        
        assert data['quantity'] == 2
        assert float(data['total_cost']) == 200.00
