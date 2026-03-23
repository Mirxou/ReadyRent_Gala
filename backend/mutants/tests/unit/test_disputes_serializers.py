"""
Unit tests for Disputes Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta

from apps.disputes.serializers import (
    DisputeSerializer, DisputeMessageSerializer,
    SupportTicketSerializer, TicketMessageSerializer
)
from apps.disputes.models import Dispute, DisputeMessage, SupportTicket, TicketMessage
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestDisputeMessageSerializer:
    """Test DisputeMessage serializer"""
    
    def test_dispute_message_serialization(self, regular_user, api_client):
        """Test dispute message serialization"""
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
            user=regular_user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Test Dispute',
            description='Test description',
            status='open'
        )
        
        message = DisputeMessage.objects.create(
            dispute=dispute,
            user=regular_user,
            message='Test message'
        )
        
        serializer = DisputeMessageSerializer(message)
        data = serializer.data
        
        assert 'id' in data
        assert 'dispute' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'message' in data
        assert data['message'] == 'Test message'


@pytest.mark.unit
@pytest.mark.django_db
class TestDisputeSerializer:
    """Test Dispute serializer"""
    
    def test_dispute_serialization(self, regular_user, api_client):
        """Test dispute serialization"""
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
            user=regular_user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Test Dispute',
            description='Test description',
            status='open',
            priority='medium'
        )
        
        serializer = DisputeSerializer(dispute)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'booking' in data
        assert 'title' in data
        assert 'description' in data
        assert 'status' in data
        assert 'priority' in data
        assert 'messages' in data
        assert 'message_count' in data
        assert data['status'] == 'open'
        assert data['priority'] == 'medium'
    
    def test_dispute_with_messages(self, regular_user, api_client):
        """Test dispute serialization with messages"""
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
            user=regular_user,
            product=product,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
        
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Test Dispute',
            description='Test description',
            status='open'
        )
        
        DisputeMessage.objects.create(
            dispute=dispute,
            user=regular_user,
            message='First message'
        )
        
        serializer = DisputeSerializer(dispute)
        data = serializer.data
        
        assert len(data['messages']) == 1
        assert data['message_count'] == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestSupportTicketSerializer:
    """Test SupportTicket serializer"""
    
    def test_support_ticket_serialization(self, regular_user, api_client):
        """Test support ticket serialization"""
        ticket = SupportTicket.objects.create(
            user=regular_user,
            subject='Test Ticket',
            description='Test description',
            status='open',
            priority='medium'
        )
        
        serializer = SupportTicketSerializer(ticket)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'subject' in data
        assert 'description' in data
        assert 'status' in data
        assert 'priority' in data
        assert 'messages' in data
        assert 'message_count' in data
        assert data['subject'] == 'Test Ticket'
        assert data['status'] == 'open'


@pytest.mark.unit
@pytest.mark.django_db
class TestTicketMessageSerializer:
    """Test TicketMessage serializer"""
    
    def test_ticket_message_serialization(self, regular_user, api_client):
        """Test ticket message serialization"""
        ticket = SupportTicket.objects.create(
            user=regular_user,
            subject='Test Ticket',
            description='Test description',
            status='open'
        )
        
        message = TicketMessage.objects.create(
            ticket=ticket,
            user=regular_user,
            message='Test message'
        )
        
        serializer = TicketMessageSerializer(message)
        data = serializer.data
        
        assert 'id' in data
        assert 'ticket' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'message' in data
        assert data['message'] == 'Test message'

