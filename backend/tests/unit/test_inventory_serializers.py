"""
Unit tests for inventory Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.inventory.serializers import (
    InventoryItemSerializer, StockAlertSerializer, StockMovementSerializer
)
from apps.inventory.models import InventoryItem, StockAlert, StockMovement
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestInventoryItemSerializer:
    """Test InventoryItem serializer"""
    
    def test_inventory_item_serialization(self, product, api_client):
        """Test inventory item serialization"""
        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=5,
            quantity_rented=3,
            low_stock_threshold=2
        )
        
        serializer = InventoryItemSerializer(inventory)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'quantity_total' in data
        assert 'quantity_available' in data
        assert 'is_low_stock' in data
        assert 'is_in_stock' in data
        assert 'availability_status' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestStockAlertSerializer:
    """Test StockAlert serializer"""
    
    def test_stock_alert_serialization(self, product, admin_user, api_client):
        """Test stock alert serialization"""
        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=1
        )
        
        alert = StockAlert.objects.create(
            inventory_item=inventory,
            alert_type='low_stock',
            status='pending',
            message='Low stock alert'
        )
        
        serializer = StockAlertSerializer(alert)
        data = serializer.data
        
        assert 'id' in data
        assert 'inventory_item' in data
        assert 'inventory_item_name' in data
        assert 'alert_type' in data
        assert 'status' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestStockMovementSerializer:
    """Test StockMovement serializer"""
    
    def test_stock_movement_serialization(self, product, admin_user, api_client):
        """Test stock movement serialization"""
        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=5
        )
        
        movement = StockMovement.objects.create(
            inventory_item=inventory,
            movement_type='in',
            quantity=5,
            previous_quantity=5,
            new_quantity=10,
            created_by=admin_user
        )
        
        serializer = StockMovementSerializer(movement)
        data = serializer.data
        
        assert 'id' in data
        assert 'inventory_item' in data
        assert 'movement_type' in data
        assert 'quantity' in data
        assert 'created_by_email' in data
