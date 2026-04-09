"""
Tests for AvailabilityService
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from django.core.cache import cache
from unittest.mock import patch, MagicMock

from apps.bookings.availability_service import AvailabilityService
from apps.bookings.models import Booking
from apps.products.models import Category, Product
from apps.inventory.models import InventoryItem
from django.contrib.auth import get_user_model

User = get_user_model()


class AvailabilityServiceTestCase(TestCase):
    """Test AvailabilityService"""
    
    def setUp(self):
        """Set up test data"""
        cache.clear()
        
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )
        
        # Create category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            is_active=True
        )
        
        # Create product
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test Description',
            owner=self.user,
            category=self.category,
            price_per_day=1000.00,
            status='available',
            size='M',
            color='Red'
        )
        
        # Create inventory
        self.inventory = InventoryItem.objects.create(
            product=self.product,
            quantity_total=10,
            quantity_available=10,
            quantity_rented=0
        )
    
    def test_check_availability_product_available(self):
        """Test checking availability for available product"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        result = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        assert result['available'] is True
        assert 'reason' not in result or result['reason'] is None
    
    def test_check_availability_product_not_found(self):
        """Test availability check for non-existent product"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        result = AvailabilityService.check_availability(
            9999,  # Non-existent ID
            start_date,
            end_date
        )
        
        assert result['available'] is False
        assert result['reason'] == 'product_not_found'
    
    def test_check_availability_product_unavailable(self):
        """Test availability check for unavailable product"""
        self.product.status = 'unavailable'
        self.product.save()
        
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        result = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        assert result['available'] is False
        assert result['reason'] == 'product_unavailable'
    
    def test_check_availability_out_of_stock(self):
        """Test availability check when out of stock"""
        self.inventory.quantity_available = 0
        self.inventory.quantity_rented = 10
        self.inventory.save()
        
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        result = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        assert result['available'] is False
        assert result['reason'] == 'out_of_stock'
    
    def test_check_availability_with_caching(self):
        """Test availability check uses cache"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        # First call - should hit database
        result1 = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        # Second call - should hit cache
        result2 = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        assert result1 == result2
    
    def test_check_availability_bypass_cache(self):
        """Test availability check bypassing cache"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        # First call - cache it
        AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        # Change inventory after caching
        self.inventory.quantity_available = 0
        self.inventory.save()
        
        # Without bypassing cache - would get old result
        result_cached = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        # With bypass - should get new result
        result_fresh = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date,
            bypass_cache=True
        )
        
        assert result_cached['available'] is True
        assert result_fresh['available'] is False
    
    def test_check_availability_with_conflict_booking(self):
        """Test availability check with conflicting booking"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        # Create conflicting booking
        Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=start_date,
            end_date=end_date,
            status='confirmed'
        )
        
        # Try to book same dates - should be unavailable
        result = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        
        assert result['available'] is False
    
    def test_check_availability_exclude_booking(self):
        """Test availability check excluding specific booking"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=2)
        
        # Create booking
        booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=start_date,
            end_date=end_date,
            status='confirmed'
        )
        
        # Should be unavailable
        result_unavailable = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date
        )
        assert result_unavailable['available'] is False
        
        # Should be available when excluding this booking
        result_available = AvailabilityService.check_availability(
            self.product.id,
            start_date,
            end_date,
            exclude_booking_id=booking.id,
            bypass_cache=True
        )
        assert result_available['available'] is True
    
    def test_check_availability_partial_overlap(self):
        """Test availability with partial date overlap"""
        conflicting_start = date.today() + timedelta(days=1)
        conflicting_end = conflicting_start + timedelta(days=2)
        
        # Create booking
        Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=conflicting_start,
            end_date=conflicting_end,
            status='confirmed'
        )
        
        # Try booking that starts before conflict but ends during it
        test_start = conflicting_start - timedelta(days=1)
        test_end = conflicting_start + timedelta(days=1)
        
        result = AvailabilityService.check_availability(
            self.product.id,
            test_start,
            test_end
        )
        
        assert result['available'] is False
    
    def test_check_availability_no_overlap(self):
        """Test availability with no date overlap"""
        conflicting_start = date.today() + timedelta(days=1)
        conflicting_end = conflicting_start + timedelta(days=2)
        
        # Create booking
        Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=conflicting_start,
            end_date=conflicting_end,
            status='confirmed'
        )
        
        # Try booking completely after conflict
        test_start = conflicting_end + timedelta(days=1)
        test_end = test_start + timedelta(days=2)
        
        result = AvailabilityService.check_availability(
            self.product.id,
            test_start,
            test_end
        )
        
        assert result['available'] is True
