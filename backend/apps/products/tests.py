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

