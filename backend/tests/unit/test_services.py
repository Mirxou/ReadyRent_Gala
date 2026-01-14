"""
Unit tests for Services
"""
import pytest
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.notifications.models import Notification

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestBookingServices:
    """Test Booking services"""
    
    def test_calculate_booking_price(self, product, regular_user):
        """Test booking price calculation"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        total_days = (end_date - start_date).days + 1
        
        expected_price = product.price_per_day * total_days
        
        # Create booking
        booking = Booking.objects.create(
            user=regular_user,
            product=product,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            total_price=expected_price,
            status='pending'
        )
        
        assert booking.total_price == expected_price
        assert booking.total_days == total_days
    
    def test_booking_date_validation(self, product, regular_user):
        """Test booking date validation"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date - timedelta(days=1)  # End before start
        
        # This should raise validation error
        with pytest.raises(Exception):
            Booking.objects.create(
                user=regular_user,
                product=product,
                start_date=start_date,
                end_date=end_date,
                total_days=0,
                total_price=Decimal('0.00'),
                status='pending'
            )


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationServices:
    """Test Notification services"""
    
    def test_create_notification(self, regular_user):
        """Test creating a notification"""
        notification = Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Booking Confirmed',
            message='Your booking has been confirmed'
        )
        
        assert notification.user == regular_user
        assert notification.type == 'booking_confirmed'
        assert notification.is_read is False
    
    def test_mark_notification_as_read(self, regular_user):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Booking Confirmed',
            message='Your booking has been confirmed'
        )
        
        notification.is_read = True
        notification.save()
        
        assert notification.is_read is True


@pytest.mark.unit
@pytest.mark.django_db
class TestProductServices:
    """Test Product services"""
    
    def test_product_availability(self, product):
        """Test product availability check"""
        assert product.status in ['available', 'rented', 'maintenance', 'unavailable']
    
    def test_product_featured(self, product):
        """Test featured product flag"""
        product.is_featured = True
        product.save()
        
        assert product.is_featured is True


@pytest.mark.unit
@pytest.mark.django_db
class TestHealthCheck:
    """Test Health Check endpoint"""
    
    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        from rest_framework.test import APIClient
        client = APIClient()
        
        response = client.get('/api/health/')
        
        assert response.status_code == 200
        assert 'status' in response.data
        assert 'database' in response.data
        assert 'cache' in response.data
        assert response.data['status'] in ['healthy', 'unhealthy']

