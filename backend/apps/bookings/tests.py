"""
Tests for Bookings app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Category, Product
from .models import Booking, Cart, CartItem

User = get_user_model()


class CartModelTest(TestCase):
    """Test Cart model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.cart = Cart.objects.create(user=self.user)
    
    def test_cart_creation(self):
        self.assertEqual(self.cart.user, self.user)
        self.assertEqual(self.cart.items.count(), 0)


class CartItemModelTest(TestCase):
    """Test CartItem model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.cart = Cart.objects.create(user=self.user)
        
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
        
        self.start_date = timezone.now().date() + timedelta(days=1)
        self.end_date = timezone.now().date() + timedelta(days=3)
    
    def test_cart_item_creation(self):
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            start_date=self.start_date,
            end_date=self.end_date,
            quantity=1
        )
        
        self.assertEqual(cart_item.cart, self.cart)
        self.assertEqual(cart_item.product, self.product)
        self.assertEqual(cart_item.quantity, 1)


class BookingModelTest(TestCase):
    """Test Booking model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
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
        
        self.start_date = timezone.now().date() + timedelta(days=1)
        self.end_date = timezone.now().date() + timedelta(days=3)
    
    def test_booking_creation(self):
        booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=self.start_date,
            end_date=self.end_date,
            total_days=3,
            total_price=3000.00,
            status='pending'
        )
        
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.product, self.product)
        self.assertEqual(booking.status, 'pending')
        self.assertEqual(booking.total_price, 3000.00)

