"""
Inventory services for stock management
"""
from django.db import transaction
from .models import InventoryItem, StockMovement, StockAlert


class InventoryService:
    """Service for inventory management operations"""
    
    @staticmethod
    @transaction.atomic
    def reserve_stock(product, quantity, reference_type=None, reference_id=None):
        """
        Reserve stock for a booking
        Returns True if successful, False if insufficient stock
        """
        try:
            inventory_item = InventoryItem.objects.select_for_update().get(product=product)
            
            if inventory_item.quantity_available < quantity:
                return False
            
            previous_quantity = inventory_item.quantity_available
            inventory_item.quantity_available -= quantity
            inventory_item.quantity_rented += quantity
            inventory_item.save()
            
            # Record movement
            StockMovement.objects.create(
                inventory_item=inventory_item,
                movement_type='out',
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=inventory_item.quantity_available,
                reference_type=reference_type,
                reference_id=reference_id,
                notes=f"Reserved {quantity} items for {reference_type}"
            )
            
            return True
        except InventoryItem.DoesNotExist:
            return False
    
    @staticmethod
    @transaction.atomic
    def release_stock(product, quantity, reference_type=None, reference_id=None):
        """
        Release stock after return
        """
        try:
            inventory_item = InventoryItem.objects.select_for_update().get(product=product)
            
            previous_quantity = inventory_item.quantity_available
            inventory_item.quantity_available += quantity
            inventory_item.quantity_rented = max(0, inventory_item.quantity_rented - quantity)
            inventory_item.save()
            
            # Record movement
            StockMovement.objects.create(
                inventory_item=inventory_item,
                movement_type='return',
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=inventory_item.quantity_available,
                reference_type=reference_type,
                reference_id=reference_id,
                notes=f"Released {quantity} items from {reference_type}"
            )
            
            return True
        except InventoryItem.DoesNotExist:
            return False
    
    @staticmethod
    @transaction.atomic
    def move_to_maintenance(product, quantity, reference_type=None, reference_id=None):
        """
        Move stock to maintenance
        """
        try:
            inventory_item = InventoryItem.objects.select_for_update().get(product=product)
            
            if inventory_item.quantity_available < quantity:
                return False
            
            previous_quantity = inventory_item.quantity_available
            inventory_item.quantity_available -= quantity
            inventory_item.quantity_maintenance += quantity
            inventory_item.save()
            
            # Record movement
            StockMovement.objects.create(
                inventory_item=inventory_item,
                movement_type='maintenance',
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=inventory_item.quantity_available,
                reference_type=reference_type,
                reference_id=reference_id,
                notes=f"Moved {quantity} items to maintenance"
            )
            
            return True
        except InventoryItem.DoesNotExist:
            return False
    
    @staticmethod
    @transaction.atomic
    def return_from_maintenance(product, quantity, reference_type=None, reference_id=None):
        """
        Return stock from maintenance
        """
        try:
            inventory_item = InventoryItem.objects.select_for_update().get(product=product)
            
            if inventory_item.quantity_maintenance < quantity:
                return False
            
            previous_quantity = inventory_item.quantity_available
            inventory_item.quantity_available += quantity
            inventory_item.quantity_maintenance = max(0, inventory_item.quantity_maintenance - quantity)
            inventory_item.save()
            
            # Record movement
            StockMovement.objects.create(
                inventory_item=inventory_item,
                movement_type='in',
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=inventory_item.quantity_available,
                reference_type=reference_type,
                reference_id=reference_id,
                notes=f"Returned {quantity} items from maintenance"
            )
            
            return True
        except InventoryItem.DoesNotExist:
            return False
    
    @staticmethod
    def check_availability(product, quantity):
        """
        Check if product has sufficient stock
        """
        try:
            inventory_item = InventoryItem.objects.get(product=product)
            return inventory_item.quantity_available >= quantity
        except InventoryItem.DoesNotExist:
            return False

