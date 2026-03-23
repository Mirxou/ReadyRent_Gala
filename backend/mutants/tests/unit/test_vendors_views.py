"""
Unit tests for vendors Views
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.vendors.models import Vendor, VendorProduct, Commission

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorRegistrationView:
    """Test VendorRegistrationView"""
    
    def test_register_vendor_authenticated(self, api_client, regular_user):
        """Test vendor registration as authenticated user"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/vendors/register/', {
            'business_name': 'Test Vendor',
            'business_name_ar': 'مورد تجريبي',
            'phone': '+213555123456',
            'email': 'vendor@test.com',
            'address': '123 Test St',
            'city': 'Constantine',
            'commission_rate': 15.00
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Vendor.objects.filter(user=regular_user).exists()
        
        vendor = Vendor.objects.get(user=regular_user)
        assert vendor.status == 'pending'
        assert not vendor.is_verified
    
    def test_register_vendor_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot register"""
        response = api_client.post('/api/vendors/register/', {
            'business_name': 'Test',
            'business_name_ar': 'تست',
            'phone': '123',
            'email': 'test@test.com',
            'address': 'Test',
            'commission_rate': 15
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorListView:
    """Test VendorListView"""
    
    def test_list_active_vendors(self, api_client):
        """Test listing active vendors without authentication"""
        # Create vendors with different statuses
        user1 = User.objects.create_user(email='v1@test.com', username='user_v1@test.com', password='pass')
        user2 = User.objects.create_user(email='v2@test.com', username='user_v2@test.com', password='pass')
        
        Vendor.objects.create(
            user=user1,
            business_name='Active Vendor',
            business_name_ar='مورد نشط',
            phone='+213123',
            email='v1@test.com',
            address='Address',
            status='active',
            is_verified=True
        )
        Vendor.objects.create(
            user=user2,
            business_name='Pending Vendor',
            business_name_ar='مورد معلق',
            phone='+213124',
            email='v2@test.com',
            address='Address',
            status='pending',
            is_verified=False
        )
        
        response = api_client.get('/api/vendors/')
        
        assert response.status_code == status.HTTP_200_OK
        # Only active and verified vendors should be visible
        assert len(response.data) == 1
        assert response.data[0]['business_name'] == 'Active Vendor'
    
    def test_list_vendors_admin_sees_all(self, api_client, admin_user):
        """Test that admin can see all vendors"""
        user1 = User.objects.create_user(email='v1@test.com', username='user_v1@test.com', password='pass')
        
        Vendor.objects.create(
            user=user1,
            business_name='Pending Vendor',
            business_name_ar='مورد',
            phone='+213123',
            email='v1@test.com',
            address='Address',
            status='pending'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/vendors/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorDashboardView:
    """Test VendorDashboardView"""
    
    def test_dashboard_as_vendor(self, api_client, vendor):
        """Test accessing vendor dashboard"""
        api_client.force_authenticate(user=vendor.user)
        response = api_client.get('/api/vendors/dashboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'vendor' in response.data
        assert 'total_products' in response.data
        assert 'total_bookings' in response.data
        assert 'total_revenue' in response.data
        assert 'total_commission' in response.data
    
    def test_dashboard_non_vendor(self, api_client, regular_user):
        """Test that non-vendors get 404"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/vendors/dashboard/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminVendorViewSet:
    """Test AdminVendorViewSet"""
    
    def test_approve_vendor_as_admin(self, api_client, admin_user):
        """Test approving vendor as admin"""
        user = User.objects.create_user(email='v@test.com', username='user_v@test.com', password='pass')
        vendor = Vendor.objects.create(
            user=user,
            business_name='Test Vendor',
            business_name_ar='مورد',
            phone='+213123',
            email='v@test.com',
            address='Address',
            status='pending',
            is_verified=False
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/vendors/admin/vendors/{vendor.id}/approve/')
        
        assert response.status_code == status.HTTP_200_OK
        vendor.refresh_from_db()
        assert vendor.status == 'active'
        assert vendor.is_verified
        assert vendor.verified_by == admin_user
    
    def test_approve_vendor_non_admin(self, api_client, regular_user):
        """Test that non-admin cannot approve vendors"""
        user = User.objects.create_user(email='v@test.com', username='user_v@test.com', password='pass')
        vendor = Vendor.objects.create(
            user=user,
            business_name='Test',
            business_name_ar='تست',
            phone='+213123',
            email='v@test.com',
            address='Addr',
            status='pending'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post(f'/api/vendors/admin/vendors/{vendor.id}/approve/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_suspend_vendor(self, api_client, admin_user):
        """Test suspending vendor"""
        user = User.objects.create_user(email='v@test.com', username='user_v@test.com', password='pass')
        vendor = Vendor.objects.create(
            user=user,
            business_name='Test',
            business_name_ar='تست',
            phone='+213123',
            email='v@test.com',
            address='Addr',
            status='active'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/vendors/admin/vendors/{vendor.id}/suspend/')
        
        assert response.status_code == status.HTTP_200_OK
        vendor.refresh_from_db()
        assert vendor.status == 'suspended'


@pytest.mark.unit
@pytest.mark.django_db  
class TestAdminCommissionProcessView:
    """Test AdminCommissionProcessView"""
    
    def test_process_commission_as_admin(self, api_client, admin_user, vendor, product, booking):
        """Test processing commission payment as admin"""
        commission = Commission.objects.create(
            vendor=vendor,
            booking=booking,
            product=product,
            sale_amount=Decimal('5000.00'),
            commission_rate=Decimal('15.00'),
            commission_amount=Decimal('750.00'),
            status='calculated'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/vendors/admin/commissions/{commission.id}/process/', {
            'payment_reference': 'REF12345'
        })
        
        assert response.status_code == status.HTTP_200_OK
        commission.refresh_from_db()
        assert commission.status == 'paid'
        assert commission.payment_reference == 'REF12345'
        assert commission.paid_at is not None
    
    def test_process_commission_invalid_status(self, api_client, admin_user, vendor, product, booking):
        """Test processing commission that's not calculated"""
        commission = Commission.objects.create(
            vendor=vendor,
            booking=booking,
            product=product,
            sale_amount=Decimal('5000.00'),
            commission_rate=Decimal('15.00'),
            commission_amount=Decimal('750.00'),
            status='pending'  # Not calculated yet
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/vendors/admin/commissions/{commission.id}/process/', {
            'payment_reference': 'REF12345'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
