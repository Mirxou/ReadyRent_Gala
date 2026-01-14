"""
Unit tests for Branches models
"""
import pytest
from decimal import Decimal
from apps.branches.models import Branch, BranchInventory, BranchStaff
from apps.products.models import Category, Product


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchModel:
    """Test Branch model"""
    
    def test_create_branch(self, admin_user):
        """Test creating a branch"""
        branch = Branch.objects.create(
            name='Main Branch',
            name_ar='الفرع الرئيسي',
            code='MAIN-001',
            address='123 Main St',
            address_ar='123 شارع رئيسي',
            city='Constantine',
            phone='+213123456789',
            manager=admin_user,
            is_active=True
        )
        
        assert branch.name == 'Main Branch'
        assert branch.code == 'MAIN-001'
        assert branch.is_active
        assert branch.manager == admin_user
    
    def test_branch_str(self, admin_user):
        """Test branch string representation"""
        branch = Branch.objects.create(
            name='Test Branch',
            name_ar='فرع تجريبي',
            code='TEST-001',
            address='123 St',
            city='Constantine',
            phone='+213123456789',
            manager=admin_user
        )
        assert str(branch) == 'فرع تجريبي'


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchInventoryModel:
    """Test BranchInventory model"""
    
    def test_create_branch_inventory(self, branch, product):
        """Test creating branch inventory"""
        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=8,
            quantity_rented=2,
            quantity_maintenance=0
        )
        
        assert inventory.branch == branch
        assert inventory.product == product
        assert inventory.quantity_total == 10
        assert inventory.quantity_available == 8
    
    def test_branch_inventory_is_low_stock(self, branch, product):
        """Test low stock detection"""
        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=1,
            low_stock_threshold=2
        )
        
        assert inventory.is_low_stock()
        
        inventory.quantity_available = 3
        inventory.save()
        assert not inventory.is_low_stock()
    
    def test_branch_inventory_is_in_stock(self, branch, product):
        """Test in stock detection"""
        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=5
        )
        
        assert inventory.is_in_stock()
        
        inventory.quantity_available = 0
        inventory.save()
        assert not inventory.is_in_stock()


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchStaffModel:
    """Test BranchStaff model"""
    
    def test_create_branch_staff(self, branch, staff_user):
        """Test creating branch staff"""
        branch_staff = BranchStaff.objects.create(
            branch=branch,
            staff=staff_user,
            role='staff',
            is_active=True
        )
        
        assert branch_staff.branch == branch
        assert branch_staff.staff == staff_user
        assert branch_staff.is_active

