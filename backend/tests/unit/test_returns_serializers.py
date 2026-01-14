"""
Unit tests for Returns Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from django.utils import timezone

from apps.returns.serializers import (
    ReturnSerializer, ReturnItemSerializer, RefundSerializer
)
from apps.returns.models import Return, ReturnItem, Refund
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestReturnItemSerializer:
    """Test ReturnItem serializer"""
    
    def test_return_item_serialization(self, product, api_client):
        """Test return item serialization"""
        return_obj = Return.objects.create(
            booking=Booking.objects.create(
                user=User.objects.create_user(
                    email='test@example.com',
                    password='testpass123'
                ),
                product=product,
                start_date=date.today() - timedelta(days=3),
                end_date=date.today() - timedelta(days=1),
                total_days=3,
                total_price=3000.00,
                status='completed'
            ),
            status='received'
        )
        
        return_item = ReturnItem.objects.create(
            return_request=return_obj,
            product=product,
            quantity_returned=1,
            condition='good'
        )
        
        serializer = ReturnItemSerializer(return_item)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'quantity_returned' in data
        assert 'condition' in data
        assert data['quantity_returned'] == 1
        assert data['condition'] == 'good'
    
    def test_return_item_validation(self):
        """Test return item validation"""
        serializer = ReturnItemSerializer(data={
            'quantity_returned': -1,
            'condition': 'invalid'
        })
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestRefundSerializer:
    """Test Refund serializer"""
    
    def test_refund_serialization(self, admin_user, api_client):
        """Test refund serialization"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            category=category,
            price_per_day=1000.00
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        return_obj = Return.objects.create(
            booking=booking,
            status='accepted'
        )
        
        refund = Refund.objects.create(
            return_request=return_obj,
            refund_type='full',
            amount=3000.00,
            status='approved',
            reason='Test refund'
        )
        
        serializer = RefundSerializer(refund)
        data = serializer.data
        
        assert 'id' in data
        assert 'return_request' in data
        assert 'refund_type' in data
        assert 'amount' in data
        assert 'status' in data
        assert 'reason' in data
        assert data['refund_type'] == 'full'
        assert float(data['amount']) == 3000.00
        assert data['status'] == 'approved'
    
    def test_refund_validation(self):
        """Test refund validation"""
        serializer = RefundSerializer(data={
            'refund_type': 'invalid',
            'amount': -1000.00
        })
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestReturnSerializer:
    """Test Return serializer"""
    
    def test_return_serialization(self, admin_user, api_client):
        """Test return serialization"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            category=category,
            price_per_day=1000.00
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        return_obj = Return.objects.create(
            booking=booking,
            status='requested',
            return_notes='Test return'
        )
        
        serializer = ReturnSerializer(return_obj)
        data = serializer.data
        
        assert 'id' in data
        assert 'booking' in data
        assert 'booking_details' in data
        assert 'status' in data
        assert 'requested_at' in data
        assert 'items' in data
        assert 'is_late' in data
        assert data['status'] == 'requested'
        assert 'product_name' in data['booking_details']
    
    def test_return_with_items(self, admin_user, api_client):
        """Test return serialization with items"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            category=category,
            price_per_day=1000.00
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        return_obj = Return.objects.create(
            booking=booking,
            status='received'
        )
        
        ReturnItem.objects.create(
            return_request=return_obj,
            product=product,
            quantity_returned=1,
            condition='good'
        )
        
        serializer = ReturnSerializer(return_obj)
        data = serializer.data
        
        assert len(data['items']) == 1
        assert data['items'][0]['condition'] == 'good'
    
    def test_return_with_refund(self, admin_user, api_client):
        """Test return serialization with refund"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            category=category,
            price_per_day=1000.00
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        return_obj = Return.objects.create(
            booking=booking,
            status='accepted'
        )
        
        Refund.objects.create(
            return_request=return_obj,
            refund_type='full',
            amount=3000.00,
            status='approved',
            reason='Test refund'
        )
        
        serializer = ReturnSerializer(return_obj)
        data = serializer.data
        
        assert 'refund' in data
        assert data['refund']['refund_type'] == 'full'
        assert float(data['refund']['amount']) == 3000.00
    
    def test_return_is_late_property(self, admin_user, api_client):
        """Test return is_late property"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            category=category,
            price_per_day=1000.00
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() - timedelta(days=2),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        return_obj = Return.objects.create(
            booking=booking,
            status='requested'
        )
        
        serializer = ReturnSerializer(return_obj)
        data = serializer.data
        
        assert 'is_late' in data
        # Should be late if end_date passed and status not completed/accepted
        assert isinstance(data['is_late'], bool)

