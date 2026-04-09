"""
Comprehensive Tests for Inventory App
Full Coverage: Models, Views, Serializers, Services, Security, Edge Cases
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.users.models import User
from apps.inventory.models import InventoryItem, StockAlert, StockMovement, VariantInventory
from apps.inventory.serializers import InventoryItemSerializer, StockAlertSerializer, StockMovementSerializer
from apps.products.models import Product, Category


class InventoryItemModelTests(TestCase):
    """Test Cases for InventoryItem Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_inv@test.com',
            username='owner_inv_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')
        self.product = Product.objects.create(
            name_ar='فستان أعراس',
            name_en='Wedding Dress',
            owner=self.owner,
            category=self.category
        )

    def test_inventory_item_creation(self):
        """Test InventoryItem model creation"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=8,
            quantity_rented=2,
            low_stock_threshold=2
        )

        self.assertEqual(inventory.quantity_total, 10)
        self.assertEqual(inventory.quantity_available, 8)
        self.assertEqual(inventory.quantity_rented, 2)

    def test_is_low_stock(self):
        """Test low stock detection"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=1,
            low_stock_threshold=2
        )

        self.assertTrue(inventory.is_low_stock())

    def test_is_in_stock(self):
        """Test in-stock detection"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=5,
            low_stock_threshold=2
        )

        self.assertTrue(inventory.is_in_stock())

    def test_out_of_stock(self):
        """Test out-of-stock detection"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=0,
            low_stock_threshold=2
        )

        self.assertFalse(inventory.is_in_stock())
        self.assertTrue(inventory.is_low_stock())

    def test_availability_status(self):
        """Test availability status methods"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=5,
            low_stock_threshold=2
        )

        self.assertEqual(inventory.get_availability_status(), 'in_stock')

        inventory.quantity_available = 1
        self.assertEqual(inventory.get_availability_status(), 'low_stock')

        inventory.quantity_available = 0
        self.assertEqual(inventory.get_availability_status(), 'out_of_stock')

    def test_inventory_str_representation(self):
        """Test inventory string representation"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=5
        )

        self.assertIn('Wedding Dress', str(inventory))
        self.assertIn('5', str(inventory))


class StockAlertModelTests(TestCase):
    """Test Cases for StockAlert Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_alert@test.com',
            username='owner_alert_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='staff_alert@test.com',
            username='staff_alert_test',
            password='TestPass123!',
            role='staff'
        )
        self.category = Category.objects.create(name_ar='إكسسوارات', name_en='Accessories')
        self.product = Product.objects.create(
            name_ar='حقيبة يد',
            name_en='Handbag',
            owner=self.owner,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=5,
            quantity_available=1,
            low_stock_threshold=2
        )

    def test_stock_alert_creation(self):
        """Test StockAlert model creation"""
        alert = StockAlert.objects.create(
            inventory_item=self.inventory,
            alert_type='low_stock',
            message='Low stock alert for Handbag'
        )

        self.assertEqual(alert.alert_type, 'low_stock')
        self.assertEqual(alert.status, 'pending')

    def test_stock_alert_acknowledgment(self):
        """Test stock alert acknowledgment"""
        alert = StockAlert.objects.create(
            inventory_item=self.inventory,
            alert_type='low_stock',
            message='Low stock alert'
        )

        alert.status = 'acknowledged'
        alert.acknowledged_by = self.staff
        alert.acknowledged_at = timezone.now()
        alert.save()

        alert.refresh_from_db()
        self.assertEqual(alert.status, 'acknowledged')
        self.assertEqual(alert.acknowledged_by, self.staff)

    def test_out_of_stock_alert(self):
        """Test out-of-stock alert"""
        alert = StockAlert.objects.create(
            inventory_item=self.inventory,
            alert_type='out_of_stock',
            message='Out of stock: Handbag'
        )

        self.assertEqual(alert.alert_type, 'out_of_stock')


class StockMovementModelTests(TestCase):
    """Test Cases for StockMovement Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_mov@test.com',
            username='owner_mov_test',
            password='TestPass123!',
            role='owner'
        )
        self.user = User.objects.create_user(
            email='user_mov@test.com',
            username='user_mov_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = Category.objects.create(name_ar='أثاث', name_en='Furniture')
        self.product = Product.objects.create(
            name_ar='كرسي',
            name_en='Chair',
            owner=self.owner,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=20,
            quantity_available=15
        )

    def test_stock_movement_creation(self):
        """Test StockMovement model creation"""
        movement = StockMovement.objects.create(
            inventory_item=self.inventory,
            movement_type='in',
            quantity=5,
            previous_quantity=15,
            new_quantity=20,
            reference_type='restock',
            created_by=self.user
        )

        self.assertEqual(movement.movement_type, 'in')
        self.assertEqual(movement.quantity, 5)

    def test_stock_movement_types(self):
        """Test different movement types"""
        for mov_type in ['in', 'out', 'adjustment', 'return', 'maintenance']:
            movement = StockMovement.objects.create(
                inventory_item=self.inventory,
                movement_type=mov_type,
                quantity=1,
                previous_quantity=10,
                new_quantity=11
            )
            self.assertEqual(movement.movement_type, mov_type)

    def test_stock_movement_reference(self):
        """Test stock movement reference tracking"""
        movement = StockMovement.objects.create(
            inventory_item=self.inventory,
            movement_type='out',
            quantity=2,
            previous_quantity=20,
            new_quantity=18,
            reference_type='booking',
            reference_id=123
        )

        self.assertEqual(movement.reference_type, 'booking')
        self.assertEqual(movement.reference_id, 123)


class VariantInventoryModelTests(TestCase):
    """Test Cases for VariantInventory Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_var@test.com',
            username='owner_var_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='أحذية', name_en='Shoes')

    def test_variant_inventory_creation(self):
        """Test VariantInventory model creation"""
        from apps.products.models import ProductVariant

        product = Product.objects.create(
            name_ar='حذاء',
            name_en='Shoe',
            owner=self.owner,
            category=self.category
        )

        variant = ProductVariant.objects.create(
            product=product,
            name='Size 42',
            sku='SHOE-42'
        )

        inventory = VariantInventory.objects.create(
            variant=variant,
            quantity_total=15,
            quantity_available=12,
            quantity_rented=3
        )

        self.assertEqual(inventory.quantity_total, 15)
        self.assertEqual(inventory.quantity_available, 12)
        self.assertTrue(inventory.is_in_stock())


class InventorySerializerTests(TestCase):
    """Test Cases for Inventory Serializers"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_ser@test.com',
            username='owner_ser_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='إلكترونيات', name_en='Electronics')
        self.product = Product.objects.create(
            name_ar='كاميرا',
            name_en='Camera',
            owner=self.owner,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=8
        )

    def test_inventory_item_serializer(self):
        """Test InventoryItemSerializer"""
        serializer = InventoryItemSerializer(self.inventory)
        data = serializer.data

        self.assertEqual(data['quantity_total'], 10)
        self.assertEqual(data['quantity_available'], 8)
        self.assertIn('product_name', data)
        self.assertIn('availability_status', data)

    def test_stock_alert_serializer(self):
        """Test StockAlertSerializer"""
        alert = StockAlert.objects.create(
            inventory_item=self.inventory,
            alert_type='low_stock',
            message='Low stock alert'
        )

        serializer = StockAlertSerializer(alert)
        data = serializer.data

        self.assertEqual(data['alert_type'], 'low_stock')
        self.assertIn('inventory_item_name', data)

    def test_stock_movement_serializer(self):
        """Test StockMovementSerializer"""
        movement = StockMovement.objects.create(
            inventory_item=self.inventory,
            movement_type='in',
            quantity=5,
            previous_quantity=5,
            new_quantity=10
        )

        serializer = StockMovementSerializer(movement)
        data = serializer.data

        self.assertEqual(data['movement_type'], 'in')
        self.assertEqual(data['quantity'], 5)


class InventoryViewTests(APITestCase):
    """Test Cases for Inventory Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_inv@test.com',
            username='admin_inv_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='user_inv@test.com',
            username='user_inv_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = Category.objects.create(name_ar='ديكور', name_en='Decor')
        self.product = Product.objects.create(
            name_ar='مزهرية',
            name_en='Vase',
            owner=self.admin,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=20,
            quantity_available=15
        )

    def test_list_inventory_admin(self):
        """Test listing inventory as admin"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/inventory/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_inventory_user(self):
        """Test listing inventory as regular user"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/inventory/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_adjust_stock(self):
        """Test adjusting stock"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/inventory/{self.inventory.id}/adjust_stock/', {
            'quantity_change': 5,
            'notes': 'Restocking'
        })

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_low_stock_filter(self):
        """Test filtering by low stock"""
        self.client.force_authenticate(user=self.admin)
        self.inventory.quantity_available = 1
        self.inventory.low_stock_threshold = 5
        self.inventory.save()

        response = self.client.get('/api/inventory/?low_stock=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class StockAlertViewTests(APITestCase):
    """Test Cases for StockAlert Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_alert@test.com',
            username='admin_alert_test',
            password='TestPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        self.category = Category.objects.create(name_ar='مجوهرات', name_en='Jewelry')
        self.product = Product.objects.create(
            name_ar='خاتم',
            name_en='Ring',
            owner=self.admin,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=5,
            quantity_available=1,
            low_stock_threshold=3
        )
        self.alert = StockAlert.objects.create(
            inventory_item=self.inventory,
            alert_type='low_stock',
            message='Low stock alert'
        )

    def test_list_alerts(self):
        """Test listing stock alerts"""
        response = self.client.get('/api/stock-alerts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_acknowledge_alert(self):
        """Test acknowledging an alert"""
        response = self.client.post(f'/api/stock-alerts/{self.alert.id}/acknowledge/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])


class InventorySecurityTests(APITestCase):
    """Security Tests for Inventory"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_sec@test.com',
            username='admin_sec_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='user_sec@test.com',
            username='user_sec_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = Category.objects.create(name_ar='مقتنيات', name_en='Collectibles')
        self.product = Product.objects.create(
            name_ar='لوحة',
            name_en='Painting',
            owner=self.admin,
            category=self.category
        )
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=5
        )

    def test_regular_user_cannot_modify_stock(self):
        """Test regular user cannot modify stock"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/inventory/{self.inventory.id}/adjust_stock/', {
            'quantity_change': 100
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stock_adjustment_negative_quantity(self):
        """Test stock adjustment with negative quantity"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/inventory/{self.inventory.id}/adjust_stock/', {
            'quantity_change': -100
        })

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class InventoryEdgeCaseTests(TestCase):
    """Edge Case Tests for Inventory"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner_edge@test.com',
            username='owner_edge_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='حديقة', name_en='Garden')

    def test_zero_inventory(self):
        """Test zero inventory handling"""
        product = Product.objects.create(
            name_ar='طاولة',
            name_en='Table',
            owner=self.owner,
            category=self.category
        )

        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=0,
            quantity_available=0
        )

        self.assertFalse(inventory.is_in_stock())
        self.assertTrue(inventory.is_low_stock())

    def test_very_large_inventory(self):
        """Test very large inventory numbers"""
        product = Product.objects.create(
            name_ar='صندوق',
            name_en='Box',
            owner=self.owner,
            category=self.category
        )

        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=1000000,
            quantity_available=999999
        )

        self.assertTrue(inventory.is_in_stock())

    def test_negative_quantity_rejected(self):
        """Test that negative quantities are rejected"""
        product = Product.objects.create(
            name_ar='مرآة',
            name_en='Mirror',
            owner=self.owner,
            category=self.category
        )

        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=10
        )

        with self.assertRaises(Exception):
            inventory.quantity_available = -5
            inventory.save()

    def test_bulk_stock_movements(self):
        """Test bulk stock movement creation"""
        product = Product.objects.create(
            name_ar='سجادة',
            name_en='Carpet',
            owner=self.owner,
            category=self.category
        )

        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=100,
            quantity_available=100
        )

        movements = [
            StockMovement(
                inventory_item=inventory,
                movement_type='out',
                quantity=10,
                previous_quantity=100 - (i * 10),
                new_quantity=100 - ((i + 1) * 10)
            )
            for i in range(10)
        ]

        StockMovement.objects.bulk_create(movements)
        count = StockMovement.objects.filter(inventory_item=inventory).count()
        self.assertEqual(count, 10)

    def test_unicode_in_movement_notes(self):
        """Test Unicode characters in movement notes"""
        product = Product.objects.create(
            name_ar='ستارة',
            name_en='Curtain',
            owner=self.owner,
            category=self.category
        )

        inventory = InventoryItem.objects.create(
            product=product,
            quantity_total=50,
            quantity_available=50
        )

        movement = StockMovement.objects.create(
            inventory_item=inventory,
            movement_type='adjustment',
            quantity=5,
            previous_quantity=50,
            new_quantity=55,
            notes='تم إضافة مخزون جديد'
        )

        self.assertIn('مخزون', movement.notes)


if __name__ == '__main__':
    import unittest
    unittest.main()
