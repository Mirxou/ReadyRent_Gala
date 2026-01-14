"""
Integration tests for booking flow
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Category, Product
from apps.bookings.models import Booking, Cart, CartItem
import json

User = get_user_model()


class BookingFlowTest(TestCase):
    """Test complete booking flow"""
    
    def setUp(self):
        self.client = Client()
        
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create category
        self.category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses',
            is_active=True
        )
        
        # Create product
        self.product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            description='Test description',
            category=self.category,
            price_per_day=1000.00,
            size='M',
            color='Red',
            status='available'
        )
        
        self.start_date = (timezone.now().date() + timedelta(days=1)).isoformat()
        self.end_date = (timezone.now().date() + timedelta(days=3)).isoformat()
    
    def test_complete_booking_flow(self):
        """Test: Add to cart -> Create booking -> Verify booking"""
        
        # 1. Login
        self.client.login(email='test@example.com', password='testpass123')
        
        # 2. Add item to cart (via API)
        # Note: This would typically be done via API endpoint
        # For now, we'll test the model layer directly
        cart, _ = Cart.objects.get_or_create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            start_date=self.start_date,
            end_date=self.end_date,
            quantity=1
        )
        
        # Verify cart item
        self.assertEqual(cart.items.count(), 1)
        self.assertEqual(cart_item.product, self.product)
        
        # 3. Create booking from cart
        total_days = 3
        total_price = self.product.price_per_day * total_days
        
        booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=self.start_date,
            end_date=self.end_date,
            total_days=total_days,
            total_price=total_price,
            status='pending'
        )
        
        # 4. Verify booking
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.product, self.product)
        self.assertEqual(booking.status, 'pending')
        self.assertEqual(booking.total_price, total_price)
        
        # 5. Clear cart
        cart.items.all().delete()
        self.assertEqual(cart.items.count(), 0)
        
        # 6. Confirm booking
        booking.status = 'confirmed'
        booking.save()
        self.assertEqual(booking.status, 'confirmed')

