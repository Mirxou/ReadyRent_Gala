"""
Unit tests for Disputes Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date, timedelta

from apps.disputes.models import Dispute, DisputeMessage, SupportTicket, TicketMessage
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestDisputeViews:
    """Test Dispute Views"""
    
    def test_create_dispute_requires_auth(self, api_client):
        """Test creating dispute requires authentication"""
        response = api_client.post('/api/disputes/disputes/create/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_dispute(self, api_client, regular_user):
        """Test creating dispute"""
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
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/disputes/disputes/create/', {
            'booking_id': booking.id,
            'title': 'Test Dispute',
            'description': 'Test description'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'open'
    
    def test_list_disputes_requires_auth(self, api_client):
        """Test listing disputes requires authentication"""
        response = api_client.get('/api/disputes/disputes/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_disputes_authenticated(self, api_client, regular_user):
        """Test listing disputes for authenticated user"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.get('/api/disputes/disputes/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_retrieve_dispute(self, api_client, regular_user):
        """Test retrieving dispute"""
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
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.get(f'/api/disputes/disputes/{dispute.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == dispute.id
    
    def test_add_message_to_dispute(self, api_client, regular_user):
        """Test adding message to dispute"""
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
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post(f'/api/disputes/disputes/{dispute.id}/messages/', {
            'dispute': dispute.id,
            'message': 'Test message'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['message'] == 'Test message'


@pytest.mark.unit
@pytest.mark.django_db
class TestSupportTicketViews:
    """Test SupportTicket Views"""
    
    def test_create_ticket_requires_auth(self, api_client):
        """Test creating ticket requires authentication"""
        response = api_client.post('/api/disputes/tickets/create/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_ticket(self, api_client, regular_user):
        """Test creating support ticket"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/disputes/tickets/create/', {
            'subject': 'Test Ticket',
            'description': 'Test description'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'open'
    
    def test_list_tickets_requires_auth(self, api_client):
        """Test listing tickets requires authentication"""
        response = api_client.get('/api/disputes/tickets/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_tickets_authenticated(self, api_client, regular_user):
        """Test listing tickets for authenticated user"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.get('/api/disputes/tickets/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_add_message_to_ticket(self, api_client, regular_user):
        """Test adding message to ticket"""
        ticket = SupportTicket.objects.create(
            user=regular_user,
            subject='Test Ticket',
            description='Test description',
            status='open'
        )
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post(f'/api/disputes/tickets/{ticket.id}/messages/', {
            'ticket': ticket.id,
            'message': 'Test message'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['message'] == 'Test message'


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminDisputeViews:
    """Test Admin Dispute Views"""
    
    def test_dispute_stats_requires_admin(self, api_client, regular_user):
        """Test dispute stats requires admin"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.get('/api/disputes/admin/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_dispute_stats_admin(self, api_client, admin_user):
        """Test dispute stats as admin"""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.get('/api/disputes/admin/disputes/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'open' in response.data
    
    def test_ticket_stats_admin(self, api_client, admin_user):
        """Test ticket stats as admin"""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.get('/api/disputes/admin/tickets/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'open' in response.data

