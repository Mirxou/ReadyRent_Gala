"""
Tests for Models that need coverage
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from apps.bookings.models import Booking, Cart, CartItem, Escrow
from apps.products.models import Category, Product, ProductImage
from apps.users.models import UserProfile, KYCVerification
from apps.inventory.models import InventoryItem, StockMovement
from apps.reviews.models import Review
from apps.recommendations.models import ProductRecommendation
from apps.notifications.models import Notification

User = get_user_model()


class CartModelTestCase(TestCase):
    """Test Cart model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser'
        )
    
    def test_create_cart(self):
        """Test creating a cart"""
        cart = Cart.objects.create(user=self.user)
        
        assert cart.user == self.user
        assert cart.is_active is True
    
    def test_cart_total_price(self):
        """Test calculating cart total"""
        cart = Cart.objects.create(user=self.user)
        
        category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user,
            category=category,
            price_per_day=Decimal('1000.00')
        )
        
        CartItem.objects.create(
            cart=cart,
            product=product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=4),
            quantity=1
        )
        
        total = cart.get_total_price()
        
        # 3 days × 1000 = 3000
        assert total == Decimal('3000.00')
    
    def test_cart_empty(self):
        """Test empty cart"""
        cart = Cart.objects.create(user=self.user)
        
        total = cart.get_total_price()
        
        assert total == Decimal('0.00')
    
    def test_clear_cart(self):
        """Test clearing cart"""
        cart = Cart.objects.create(user=self.user)
        
        category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user,
            category=category,
            price_per_day=Decimal('1000.00')
        )
        
        CartItem.objects.create(
            cart=cart,
            product=product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=4)
        )
        
        assert cart.items.count() == 1
        
        cart.clear()
        
        assert cart.items.count() == 0


class ProductImageModelTestCase(TestCase):
    """Test ProductImage model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user,
            category=self.category,
            price_per_day=Decimal('1000.00')
        )
    
    def test_create_product_image(self):
        """Test creating product image"""
        image = ProductImage.objects.create(
            product=self.product,
            image='path/to/image.jpg',
            alt_text='Test Image',
            is_primary=True,
            display_order=1
        )
        
        assert image.product == self.product
        assert image.is_primary is True
    
    def test_product_primary_image(self):
        """Test getting primary image"""
        image1 = ProductImage.objects.create(
            product=self.product,
            image='path/to/image1.jpg',
            is_primary=False,
            display_order=1
        )
        
        image2 = ProductImage.objects.create(
            product=self.product,
            image='path/to/image2.jpg',
            is_primary=True,
            display_order=2
        )
        
        primary = self.product.get_primary_image()
        
        assert primary == image2


class ReviewModelTestCase(TestCase):
    """Test Review model"""
    
    def setUp(self):
        self.reviewer = User.objects.create_user(
            email='reviewer@example.com',
            username='reviewer'
        )
        
        self.owner = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.owner,
            category=self.category,
            price_per_day=Decimal('1000.00')
        )
    
    def test_create_review(self):
        """Test creating a review"""
        review = Review.objects.create(
            product=self.product,
            reviewer=self.reviewer,
            rating=5,
            comment='Excellent product',
            is_verified_purchase=True
        )
        
        assert review.product == self.product
        assert review.rating == 5
        assert review.is_verified_purchase is True
    
    def test_review_rating_validation(self):
        """Test review rating is within range"""
        review = Review(
            product=self.product,
            reviewer=self.reviewer,
            rating=5,
            comment='Good'
        )
        
        review.full_clean()
        review.save()
        
        assert review.rating == 5
    
    def test_product_average_rating(self):
        """Test calculating product average rating"""
        Review.objects.create(
            product=self.product,
            reviewer=self.reviewer,
            rating=5
        )
        
        Review.objects.create(
            product=self.product,
            reviewer=User.objects.create_user(
                email='reviewer2@example.com',
                username='reviewer2'
            ),
            rating=3
        )
        
        avg = self.product.get_average_rating()
        
        assert avg == 4  # (5 + 3) / 2


class UserProfileModelTestCase(TestCase):
    """Test UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser'
        )
    
    def test_create_user_profile(self):
        """Test creating user profile"""
        profile = UserProfile.objects.create(
            user=self.user,
            phone_number='+212612345678',
            gender='M',
            date_of_birth=date(1990, 1, 1)
        )
        
        assert profile.user == self.user
        assert profile.phone_number == '+212612345678'
    
    def test_user_kyc_status(self):
        """Test user KYC verification status"""
        profile = UserProfile.objects.create(
            user=self.user
        )
        
        kyc = KYCVerification.objects.create(
            user=self.user,
            id_type='passport',
            id_number='AB123456',
            status='pending'
        )
        
        assert not profile.is_kyc_verified
        
        kyc.status = 'approved'
        kyc.save()
        
        profile.refresh_from_db()
        assert profile.is_kyc_verified


class InventoryModelTestCase(TestCase):
    """Test Inventory model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user,
            category=self.category,
            price_per_day=Decimal('1000.00')
        )
    
    def test_create_inventory(self):
        """Test creating inventory"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=10,
            quantity_rented=0
        )
        
        assert inventory.product == self.product
        assert inventory.quantity_total == 10
    
    def test_inventory_stock_level_warning(self):
        """Test low stock warning"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=2,
            quantity_rented=8
        )
        
        assert inventory.is_low_stock()
    
    def test_stock_movement_tracking(self):
        """Test tracking stock movements"""
        inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=10
        )
        
        movement = StockMovement.objects.create(
            inventory=inventory,
            movement_type='rent',
            quantity=2,
            notes='Rented by user'
        )
        
        assert movement.quantity == 2
        assert movement.movement_type == 'rent'
