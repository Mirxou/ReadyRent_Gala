"""
Unit tests for packaging Views
"""
import pytest
from rest_framework import status
from decimal import Decimal

from apps.packaging.models import PackagingType, PackagingMaterial, PackagingRule, PackagingInstance


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingTypeViewSet:
    """Test PackagingTypeViewSet"""
    
    def test_list_active_types(self, api_client):
        """Test listing active packaging types"""
        PackagingType.objects.create(
            name='Active Type',
            name_ar='نوع نشط',
            size='medium',
            is_active=True
        )
        PackagingType.objects.create(
            name='Inactive Type',
            name_ar='نوع غير نشط',
            size='large',
            is_active=False
        )
        
        response = api_client.get('/api/packaging/types/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Active Type'
    
    def test_list_types_no_auth_required(self, api_client):
        """Test that listing types doesn't require authentication"""
        PackagingType.objects.create(
            name='Public Type',
            name_ar='نوع عام',
            size='small',
            is_active=True
        )
        
        response = api_client.get('/api/packaging/types/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingMaterialViewSet:
    """Test PackagingMaterialViewSet"""
    
    def test_list_active_materials(self, api_client):
        """Test listing active materials"""
        PackagingMaterial.objects.create(
            name='Active Material',
            name_ar='مادة نشطة',
            material_type='box',
            cost_per_unit=Decimal('50.00'),
            is_active=True
        )
        PackagingMaterial.objects.create(
            name='Inactive Material',
            name_ar='مادة غير نشطة',
            material_type='bag',
            cost_per_unit=Decimal('30.00'),
            is_active=False
        )
        
        response = api_client.get('/api/packaging/materials/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
    
    def test_filter_by_type(self, api_client):
        """Test filtering materials by type"""
        PackagingMaterial.objects.create(
            name='Box',
            name_ar='صندوق',
            material_type='box',
            cost_per_unit=Decimal('100.00'),
            is_active=True
        )
        PackagingMaterial.objects.create(
            name='Bag',
            name_ar='حقيبة',
            material_type='bag',
            cost_per_unit=Decimal('50.00'),
            is_active=True
        )
        
        response = api_client.get('/api/packaging/materials/?material_type=box')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['material_type'] == 'box'


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingRuleViewSet:
    """Test PackagingRuleViewSet"""
    
    def test_list_rules_admin_only(self, api_client, admin_user):
        """Test that only admin can list rules"""
        pack_type = PackagingType.objects.create(
            name='Box',
            name_ar='صندوق',
            size='medium'
        )
        
        PackagingRule.objects.create(
            packaging_type=pack_type,
            priority=10,
            is_active=True
        )
        
        # Without auth
        response = api_client.get('/api/packaging/rules/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # With admin auth
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/packaging/rules/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingInstanceViewSet:
    """Test PackagingInstanceViewSet"""
    
    def test_list_instances_authenticated(self, api_client, regular_user, booking):
        """Test listing instances requires authentication"""
        pack_type = PackagingType.objects.create(
            name='Box',
            name_ar='صندوق',
            size='small'
        )
        
        PackagingInstance.objects.create(
            booking=booking,
            packaging_type=pack_type,
            packaging_cost=Decimal('100.00')
        )
        
        # Without auth
        response = api_client.get('/api/packaging/instances/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # With auth
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/packaging/instances/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_suggested_packaging_for_product(self, api_client, regular_user, product, category):
        """Test getting suggested packaging for a product"""
        pack_type = PackagingType.objects.create(
            name='Category Box',
            name_ar='صندوق الفئة',
            size='large'
        )
        
        PackagingRule.objects.create(
            product_category=category,
            packaging_type=pack_type,
            priority=10,
            is_active=True
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(f'/api/packaging/instances/suggested_for_booking/?product_id={product.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'suggested_packaging' in response.data
        assert response.data['suggested_packaging']['name'] == 'Category Box'
    
    def test_suggested_packaging_default(self, api_client, regular_user, product):
        """Test default packaging when no rule exists"""
        # Create a medium-sized default type
        PackagingType.objects.create(
            name='Default Medium',
            name_ar='متوسط افتراضي',
            size='medium',
            is_active=True
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(f'/api/packaging/instances/suggested_for_booking/?product_id={product.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'suggested_packaging' in response.data
        assert response.data['reason'] == 'Default packaging'
    
    def test_create_instance_admin_only(self, api_client, admin_user, regular_user, booking):
        """Test creating instance requires admin"""
        pack_type = PackagingType.objects.create(
            name='Box',
            name_ar='صندوق',
            size='medium'
        )
        
        # As regular user
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/packaging/instances/', {
            'booking': booking.id,
            'packaging_type': pack_type.id,
            'packaging_cost': 150.00,
            'status': 'prepared'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # As admin
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/packaging/instances/', {
            'booking': booking.id,
            'packaging_type': pack_type.id,
            'packaging_cost': 150.00,
            'status': 'prepared'
        })
        assert response.status_code == status.HTTP_201_CREATED
