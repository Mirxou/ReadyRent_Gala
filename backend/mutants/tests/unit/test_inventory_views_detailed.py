import pytest
from rest_framework import status
from django.utils import timezone
from apps.inventory.models import InventoryItem, StockAlert, StockMovement

@pytest.mark.unit
@pytest.mark.django_db
class TestInventoryDetailed:
    """Detailed tests for inventory views"""

    def test_inventory_item_filters(self, api_client, admin_user, product):
        """Test InventoryItem ViewSet filters"""
        item = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=2,
            low_stock_threshold=5
        )
        api_client.force_authenticate(user=admin_user)
        
        # 1. Low stock filter
        response = api_client.get('/api/inventory/items/?low_stock=true')
        assert response.status_code == status.HTTP_200_OK
        # Check if paginated or list
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1
        
        # 2. In stock filter
        response = api_client.get('/api/inventory/items/?in_stock=true')
        assert response.status_code == status.HTTP_200_OK
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1

    def test_adjust_stock_action(self, api_client, admin_user, product):
        """Test adjust_stock action"""
        item = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=10
        )
        api_client.force_authenticate(user=admin_user)
        
        # 1. Successful adjustment (out)
        data = {'quantity_change': -5, 'notes': 'Manual removal'}
        response = api_client.post(f'/api/inventory/items/{item.id}/adjust_stock/', data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['quantity_available'] == 5
        assert StockMovement.objects.filter(inventory_item=item, movement_type='adjustment').exists()
        
        # 2. Invalid adjustment (too much out)
        data = {'quantity_change': -10}
        response = api_client.post(f'/api/inventory/items/{item.id}/adjust_stock/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_stock_alert_acknowledge(self, api_client, admin_user, product):
        """Test acknowledging a stock alert"""
        item = InventoryItem.objects.create(product=product, quantity_available=0)
        alert = StockAlert.objects.create(
            inventory_item=item,
            alert_type='out_of_stock',
            message='Empty'
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/inventory/stock-alerts/{alert.id}/acknowledge/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'acknowledged'

    def test_stock_movement_list(self, api_client, admin_user, product):
        """Test listing stock movements"""
        item = InventoryItem.objects.create(product=product, quantity_available=10)
        StockMovement.objects.create(
            inventory_item=item,
            movement_type='in',
            quantity=5,
            previous_quantity=5,
            new_quantity=10
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/inventory/stock-movements/')
        assert response.status_code == status.HTTP_200_OK
        # Check if paginated or list
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1
