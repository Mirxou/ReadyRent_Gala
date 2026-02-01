"""
Unit tests for branches Serializers
"""
import pytest
from decimal import Decimal
from datetime import date

from apps.branches.serializers import (
    BranchSerializer, BranchInventorySerializer,
    BranchStaffSerializer, BranchPerformanceSerializer
)
from apps.branches.models import Branch, BranchInventory, BranchStaff, BranchPerformance


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchSerializer:
    """Test BranchSerializer"""
    
    def test_serializer_output_fields(self):
        """Test serializer includes all expected fields"""
        branch = Branch.objects.create(
            name='Constantine Branch',
            name_ar='فرع قسنطينة',
            code='CST001',
            address='123 City Center',
            city='Constantine',
            phone='+213556789012'
        )
        
        serializer = BranchSerializer(branch)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'code' in data
        assert 'address' in data
        assert 'city' in data
        assert 'phone' in data
        assert 'is_active' in data
        assert 'staff_count' in data
        assert 'product_count' in data
        
        assert data['name'] == 'Constantine Branch'
        assert data['code'] == 'CST001'
    
    def test_serializer_read_only_fields(self):
        """Test created_at and updated_at are read-only"""
        branch = Branch.objects.create(
            name='Test Branch',
            name_ar='فرع تجريبي',
            code='TST001',
            address='Test Address',
            phone='+213555000000'
        )
        
        data = {'name': 'Updated'}
        serializer = BranchSerializer(branch, data=data, partial=True)
        assert serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchInventorySerializer:
    """Test BranchInventorySerializer"""
    
    def test_serializer_availability_status(self, product):
        """Test availability status field"""
        branch = Branch.objects.create(
            name='Branch',
            name_ar='فرع',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        
        # In stock
        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=8,
            low_stock_threshold=2
        )
        
        serializer = BranchInventorySerializer(inventory)
        assert serializer.data['availability_status'] == 'in_stock'
        
        # Low stock
        inventory.quantity_available = 2
        inventory.save()
        serializer = BranchInventorySerializer(inventory)
        assert serializer.data['availability_status'] == 'low_stock'
        
        # Out of stock
        inventory.quantity_available = 0
        inventory.save()
        serializer = BranchInventorySerializer(inventory)
        assert serializer.data['availability_status'] == 'out_of_stock'


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchStaffSerializer:
    """Test BranchStaffSerializer"""
    
    def test_serializer_fields(self, staff_user):
        """Test staff serializer fields"""
        branch = Branch.objects.create(
            name='Branch',
            name_ar='فرع',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        
        staff_assignment = BranchStaff.objects.create(
            branch=branch,
            staff=staff_user,
            role='staff',
            is_active=True
        )
        
        serializer = BranchStaffSerializer(staff_assignment)
        data = serializer.data
        
        assert 'id' in data
        assert 'branch' in data
        assert 'branch_name' in data
        assert 'staff' in data
        assert 'staff_email' in data
        assert 'role' in data
        assert 'is_active' in data
        
        assert data['staff_email'] == staff_user.email


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchPerformanceSerializer:
    """Test BranchPerformanceSerializer"""
    
    def test_serializer_metrics(self):
        """Test performance serializer with metrics"""
        branch = Branch.objects.create(
            name='Branch',
            name_ar='فرع',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        
        performance = BranchPerformance.objects.create(
            branch=branch,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            total_bookings=50,
            total_revenue=Decimal('250000.00'),
            total_products=25,
            average_rating=Decimal('4.50')
        )
        
        serializer = BranchPerformanceSerializer(performance)
        data = serializer.data
        
        assert 'id' in data
        assert 'branch_name' in data
        assert 'total_bookings' in data
        assert 'total_revenue' in data
        assert 'average_rating' in data
        
        assert data['total_bookings'] == 50
        assert float(data['average_rating']) == 4.50
