"""
Advanced integration tests for complete flows
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import json

from apps.bookings.models import Booking, Cart, CartItem
from apps.products.models import Category, Product
from apps.payments.models import Payment
from apps.disputes.models import Dispute
from apps.reviews.models import Review

User = get_user_model()


class CompleteRentalFlowTestCase(TestCase):
    """Test complete rental flow from search to review"""
    
    def setUp(self):
        self.client = Client()
        
        # Create users
        self.renter = User.objects.create_user(
            email='renter@example.com',
            password='password123',
            username='renter',
            first_name='Renter',
            last_name='User'
        )
        
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='password123',
            username='owner',
            first_name='Owner',
            last_name='User'
        )
        
        # Create category
        self.category = Category.objects.create(
            name='Evening Gowns',
            slug='evening-gowns',
            is_active=True
        )
        
        # Create product
        self.product = Product.objects.create(
            name='Beautiful Evening Gown',
            slug='beautiful-evening-gown',
            description='Elegant evening dress for special occasions',
            owner=self.owner,
            category=self.category,
            price_per_day=Decimal('500.00'),
            size='M',
            color='Red',
            status='available'
        )
    
    def test_complete_rental_flow(self):
        """Test complete flow from search to payment and review"""
        # Step 1: Renter searches for products
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)
        
        # Step 2: Renter views product details
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, 200)
        
        # Step 3: Login as renter
        self.client.login(email='renter@example.com', password='password123')
        
        # Step 4: Add to cart
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        response = self.client.post('/api/cart/items/', {
            'product': self.product.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'quantity': 1
        })
        self.assertEqual(response.status_code, 201)
        
        # Step 5: Checkout
        response = self.client.post('/api/bookings/', {
            'product': self.product.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        })
        self.assertEqual(response.status_code, 201)
        booking_response = response.json()
        booking_id = booking_response['id']
        
        # Step 6: Make payment
        response = self.client.post('/api/payments/', {
            'booking': booking_id,
            'payment_method': 'bank_card',
            'amount': Decimal('1000.00')
        })
        self.assertEqual(response.status_code, 201)
        
        # Step 7: Confirm booking
        response = self.client.patch(f'/api/bookings/{booking_id}/', {
            'status': 'confirmed'
        })
        self.assertEqual(response.status_code, 200)
        
        # Step 8: Complete booking
        response = self.client.patch(f'/api/bookings/{booking_id}/', {
            'status': 'completed'
        })
        self.assertEqual(response.status_code, 200)
        
        # Step 9: Leave review
        response = self.client.post(f'/api/products/{self.product.id}/reviews/', {
            'rating': 5,
            'comment': 'Excellent product and smooth rental process!',
            'booking': booking_id
        })
        self.assertEqual(response.status_code, 201)
        
        # Verify booking completed
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'completed')
        
        # Verify payment created
        payment = Payment.objects.filter(booking=booking).first()
        self.assertIsNotNone(payment)
        
        # Verify review created
        review = Review.objects.filter(product=self.product).first()
        self.assertIsNotNone(review)
        self.assertEqual(review.rating, 5)
    
    def test_rental_flow_with_conflict(self):
        """Test rental flow when dates are unavailable"""
        # Create existing booking
        existing_user = User.objects.create_user(
            email='existing@example.com',
            username='existing'
        )
        
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        Booking.objects.create(
            user=existing_user,
            product=self.product,
            start_date=start_date,
            end_date=end_date,
            status='confirmed'
        )
        
        # Login as renter
        self.client.login(email='renter@example.com', password='password123')
        
        # Try to book same dates
        response = self.client.post('/api/bookings/', {
            'product': self.product.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        })
        
        # Should fail with 400 or 409
        self.assertIn(response.status_code, [400, 409])


class CompleteDisputeFlowTestCase(TestCase):
    """Test complete dispute resolution flow"""
    
    def setUp(self):
        self.client = Client()
        
        self.renter = User.objects.create_user(
            email='renter@example.com',
            password='password123',
            username='renter'
        )
        
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='password123',
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
            price_per_day=Decimal('500.00')
        )
        
        self.booking = Booking.objects.create(
            user=self.renter,
            product=self.product,
            start_date=date.today() - timedelta(days=2),
            end_date=date.today() - timedelta(days=1),
            status='completed',
            total_price=Decimal('1000.00')
        )
    
    def test_complete_dispute_flow(self):
        """Test complete dispute creation and resolution"""
        self.client.login(email='renter@example.com', password='password123')
        
        # Create dispute
        response = self.client.post('/api/disputes/', {
            'booking': self.booking.id,
            'reason': 'damaged_item',
            'description': 'The item arrived damaged'
        })
        self.assertEqual(response.status_code, 201)
        dispute_response = response.json()
        dispute_id = dispute_response['id']
        
        # Add message from renter
        response = self.client.post(f'/api/disputes/{dispute_id}/messages/', {
            'content': 'Here is photographic evidence',
            'evidence_type': 'image'
        })
        self.assertEqual(response.status_code, 201)
        
        # Login as owner and respond
        self.client.login(email='owner@example.com', password='password123')
        
        response = self.client.post(f'/api/disputes/{dispute_id}/messages/', {
            'content': 'I apologize. Let me offer a partial refund.',
            'evidence_type': 'text'
        })
        self.assertEqual(response.status_code, 201)
        
        # Owner proposes resolution
        response = self.client.patch(f'/api/disputes/{dispute_id}/', {
            'status': 'resolved',
            'resolution': 'partial_refund',
            'refund_amount': Decimal('500.00')
        })
        self.assertEqual(response.status_code, 200)
        
        # Verify dispute resolved
        dispute = Dispute.objects.get(id=dispute_id)
        self.assertEqual(dispute.status, 'resolved')


class AdvancedSearchFilterTestCase(TestCase):
    """Test advanced product search and filtering"""
    
    def setUp(self):
        self.client = Client()
        
        self.user = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category1 = Category.objects.create(
            name='Evening Gowns',
            slug='evening-gowns'
        )
        
        self.category2 = Category.objects.create(
            name='Casual Wear',
            slug='casual-wear'
        )
        
        # Create multiple products
        self.product1 = Product.objects.create(
            name='Expensive Evening Gown',
            slug='expensive-gown',
            owner=self.user,
            category=self.category1,
            price_per_day=Decimal('1000.00'),
            color='Red',
            size='M',
            status='available'
        )
        
        self.product2 = Product.objects.create(
            name='Cheap Casual Dress',
            slug='cheap-dress',
            owner=self.user,
            category=self.category2,
            price_per_day=Decimal('100.00'),
            color='Blue',
            size='S',
            status='available'
        )
    
    def test_filter_by_price_range(self):
        """Test filtering products by price"""
        response = self.client.get('/api/products/?min_price=500&max_price=1500')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # Should contain expensive gown
        self.assertTrue(any(p['id'] == self.product1.id for p in data['results']))
    
    def test_filter_by_category(self):
        """Test filtering by category"""
        response = self.client.get(f'/api/products/?category={self.category1.slug}')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(any(p['id'] == self.product1.id for p in data['results']))
    
    def test_filter_by_color(self):
        """Test filtering by color"""
        response = self.client.get('/api/products/?color=Red')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(any(p['id'] == self.product1.id for p in data['results']))
    
    def test_filter_by_size(self):
        """Test filtering by size"""
        response = self.client.get('/api/products/?size=M')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(any(p['id'] == self.product1.id for p in data['results']))
    
    def test_search_by_name(self):
        """Test searching by product name"""
        response = self.client.get('/api/products/?search=Evening')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(any(p['id'] == self.product1.id for p in data['results']))
