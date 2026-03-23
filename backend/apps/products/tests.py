"""
Tests for Products app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Category, Product, ProductImage

User = get_user_model()


class CategoryModelTest(TestCase):
    """Test Category model"""
    
    def setUp(self):
        self.category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses',
            description='Test category',
            is_active=True
        )
    
    def test_category_str(self):
        self.assertEqual(str(self.category), 'فساتين')
    
    def test_category_creation(self):
        self.assertEqual(self.category.name, 'Dresses')
        self.assertEqual(self.category.name_ar, 'فساتين')
        self.assertTrue(self.category.is_active)


class ProductModelTest(TestCase):
    """Test Product model"""
    
    def setUp(self):
        self.category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses',
            is_active=True
        )
        
        self.product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            description='Test description',
            description_ar='وصف تجريبي',
            category=self.category,
            price_per_day=1000.00,
            size='M',
            color='Red',
            color_hex='#FF0000',
            status='available'
        )
    
    def test_product_str(self):
        self.assertEqual(str(self.product), 'فستان تجريبي')
    
    def test_product_creation(self):
        self.assertEqual(self.product.name, 'Test Dress')
        self.assertEqual(self.product.price_per_day, 1000.00)
        self.assertEqual(self.product.status, 'available')
        self.assertEqual(self.product.category, self.category)
    
    def test_product_color_hex(self):
        self.assertEqual(self.product.color_hex, '#FF0000')

    def test_product_without_owner(self):
        """Test creating a product without an owner (Platform Inventory)"""
        product = Product.objects.create(
            name='Platform Dress',
            name_ar='فستان منصة',
            slug='platform-dress',
            description='Test',
            category=self.category,
            price_per_day=500,
            size='S',
            color='Blue',
            owner=None
        )
        self.assertIsNone(product.owner)
        self.assertTrue(Product.objects.filter(id=product.id).exists())

    def test_product_with_owner(self):
        """Test linking a product to an owner (P2P Future Feature)"""
        user = User.objects.create_user(username='owner', email='owner@test.com', password='password')
        
        product = Product.objects.create(
            name='User Dress',
            name_ar='فستان مستخدم',
            slug='user-dress',
            description='Test',
            category=self.category,
            price_per_day=500,
            size='S',
            color='Green',
            owner=user
        )
        self.assertEqual(product.owner, user)
        self.assertEqual(user.owned_products.count(), 1)

    def test_owner_deletion(self):
        """Test on_delete=SET_NULL behavior"""
        user = User.objects.create_user(username='todelete', email='delete@test.com', password='password')
        
        product = Product.objects.create(
            name='Delete Test Dress',
            name_ar='فستان للحذف',
            slug='delete-test-dress',
            description='Test',
            category=self.category,
            price_per_day=500,
            size='S',
            color='Black',
            owner=user
        )
        
        # Verify link exists
        self.assertEqual(product.owner, user)
        
        # Delete user
        user.delete()
        
        # Reload product
        product.refresh_from_db()
        
        # Verify product still exists but owner is None
        self.assertIsNone(product.owner)
        self.assertTrue(Product.objects.filter(id=product.id).exists())


class ProductImageModelTest(TestCase):
    """Test ProductImage model"""
    
    def setUp(self):
        self.category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        
        self.product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            description='Test',
            category=self.category,
            price_per_day=1000.00,
            size='M',
            color='Red'
        )
    
    def test_product_image_creation(self):
        # Note: In real tests, you would use a test image file
        # For now, we'll test the relationship
        self.assertEqual(self.product.images.count(), 0)

