"""
Unit tests for inventory Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.inventory.models import InventoryItem, StockAlert, StockMovement
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestInventoryItemViewSet:
    """Test InventoryItem ViewSet"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing inventory requires authentication"""
        response = api_client.get('/api/inventory/inventory/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_as_admin(self, api_client, admin_user, product):
        """Test listing inventory as admin"""
        InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=5
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/inventory/inventory/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_requires_admin(self, api_client, regular_user, product):
        """Test creating inventory item requires admin"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/inventory/inventory/', {
            'product': product.id,
            'quantity_total': 10,
            'quantity_available': 10
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
@pytest.mark.django_db
class TestStockAlertViewSet:
    """Test StockAlert ViewSet"""
    
    def test_list_alerts_requires_admin(self, api_client, regular_user):
        """Test listing stock alerts requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/inventory/stock-alerts/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_alerts_as_admin(self, api_client, admin_user, product):
        """Test listing stock alerts as admin"""
        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=1
        )
        
        StockAlert.objects.create(
            inventory_item=inventory,
            alert_type='low_stock',
            status='pending',
            message='Low stock'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/inventory/stock-alerts/')
        
        assert response.status_code == status.HTTP_200_OK
