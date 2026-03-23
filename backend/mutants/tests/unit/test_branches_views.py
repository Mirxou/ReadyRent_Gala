"""
Unit tests for branches Views
"""
import pytest
from rest_framework import status
from decimal import Decimal
from datetime import date

from apps.branches.models import Branch, BranchInventory, BranchStaff, BranchPerformance


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchListView:
    """Test BranchListView"""
    
    def test_list_active_branches(self, api_client):
        """Test listing active branches"""
        Branch.objects.create(
            name='Active Branch',
            name_ar='فرع نشط',
            code='ACT001',
            address='123 Main St',
            phone='+213555000000',
            is_active=True
        )
        Branch.objects.create(
            name='Inactive Branch',
            name_ar='فرع غير نشط',
            code='INA001',
            address='456 Side St',
            phone='+213555000001',
            is_active=False
        )
        
        response = api_client.get('/api/branches/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Active Branch'
    
    def test_list_branches_no_auth_required(self, api_client):
        """Test that listing branches doesn't require auth"""
        Branch.objects.create(
            name='Public Branch',
            name_ar='فرع عام',
            code='PUB001',
            address='Address',
            phone='+213555000000',
            is_active=True
        )
        
        response = api_client.get('/api/branches/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchInventoryViews:
    """Test Branch Inventory Views"""
    
    def test_list_inventory_authenticated(self, api_client, regular_user, product):
        """Test listing inventory requires authentication"""
        branch = Branch.objects.create(
            name='Branch',
            name_ar='فرع',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        
        BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=8
        )
        
        # Without auth
        response = api_client.get('/api/branches/inventory/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # With auth
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/branches/inventory/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_inventory_by_branch(self, api_client, regular_user, product):
        """Test filtering inventory by branch"""
        branch1 = Branch.objects.create(
            name='Branch 1',
            name_ar='فرع 1',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        branch2 = Branch.objects.create(
            name='Branch 2',
            name_ar='فرع 2',
            code='BR002',
            address='Address',
            phone='+213555000001'
        )
        
        BranchInventory.objects.create(
            branch=branch1,
            product=product,
            quantity_total=10,
            quantity_available=5
        )
        BranchInventory.objects.create(
            branch=branch2,
            product=product,
            quantity_total=10,
            quantity_available=3
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(f'/api/branches/inventory/?branch={branch1.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchStaffViews:
    """Test Branch Staff Views"""
    
    def test_list_staff_assignments(self, api_client, staff_user):
        """Test listing staff assignments"""
        branch = Branch.objects.create(
            name='Branch',
            name_ar='فرع',
            code='BR001',
            address='Address',
            phone='+213555000000'
        )
        
        BranchStaff.objects.create(
            branch=branch,
            staff=staff_user,
            role='staff',
            is_active=True
        )
        
        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/branches/staff/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchStatsView:
    """Test BranchStatsView"""
    
    def test_get_branch_stats(self, api_client, regular_user, product):
        """Test getting branch statistics"""
        branch = Branch.objects.create(
            name='Test Branch',
            name_ar='فرع تجريبي',
            code='TEST001',
            address='Test Address',
            phone='+213555000000'
        )
        
        BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10,
            quantity_available=5
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(f'/api/branches/{branch.id}/stats/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'branch' in response.data
        assert 'total_products' in response.data
        assert 'total_available' in response.data
        assert 'total_staff' in response.data
    
    def test_stats_nonexistent_branch(self, api_client, regular_user):
        """Test stats for non-existent branch"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/branches/99999/stats/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminBranchViews:
    """Test Admin Branch Views"""
    
    def test_create_branch_admin(self, api_client, admin_user):
        """Test creating a branch as admin"""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            'name': 'New Branch',
            'name_ar': 'فرع جديد',
            'code': 'BR002',
            'address': 'New Location',
            'phone': '+1234567890',
            'is_active': True
        }
        
        response = api_client.post('/api/branches/admin/branches/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Branch.objects.count() == 1
        assert Branch.objects.get().name == 'New Branch'

    def test_create_branch_regular_user(self, api_client, regular_user):
        """Test creating a branch as regular user (should fail)"""
        api_client.force_authenticate(user=regular_user)
        
        data = {
            'name': 'New Branch',
            'name_ar': 'فرع جديد',
            'code': 'BR002',
        }
        
        response = api_client.post('/api/branches/admin/branches/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_update_branch(self, api_client, admin_user):
        """Test admin can update branches"""
        branch = Branch.objects.create(
            name='Old Name',
            name_ar='اسم قديم',
            code='OLD001',
            address='Address',
            phone='+213555000000'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(f'/api/branches/admin/branches/{branch.id}/', {
            'name': 'Updated Name'
        })
        
        assert response.status_code == status.HTTP_200_OK
        branch.refresh_from_db()
        assert branch.name == 'Updated Name'
