"""
Unit tests for Returns Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from django.utils import timezone

from apps.returns.models import Return, ReturnItem, Refund
from apps.products.models import Category, Product
from apps.bookings.models import Booking

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.unit
@pytest.mark.django_db
class TestReturnViewSet:
    """Test Return ViewSet"""
    
    def test_list_returns_requires_auth(self, api_client):
        """Test listing returns requires authentication"""
        response = api_client.get('/api/returns/returns/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_returns_authenticated(self, api_client):
        """Test listing returns for authenticated user"""
        user = User.objects.create_user(
            username='test_v1',
            email='test_v1@example.com',
            password='testpass123'
        )
        api_client.force_authenticate(user=user)
        
        response = api_client.get('/api/returns/returns/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict) or isinstance(response.data, list)
    
    def test_create_return_requires_auth(self, api_client):
        """Test creating return requires authentication"""
        response = api_client.post('/api/returns/returns/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_return(self, api_client):
        """Test creating return"""
        user = User.objects.create_user(
            username='test_v2',
            email='test_v2@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v2'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v2',
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
        
        api_client.force_authenticate(user=user)
        
        response = api_client.post('/api/returns/returns/', {
            'booking': booking.id,
            'return_notes': 'Test return'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'requested'
    
    def test_retrieve_return(self, api_client):
        """Test retrieving return"""
        user = User.objects.create_user(
            username='test_v3',
            email='test_v3@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v3'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v3',
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
            status='requested'
        )
        
        api_client.force_authenticate(user=user)
        
        response = api_client.get(f'/api/returns/returns/{return_obj.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == return_obj.id
    
    def test_approve_return_requires_admin(self, api_client):
        """Test approving return requires admin"""
        user = User.objects.create_user(
            username='test_v4',
            email='test_v4@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v4'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v4',
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
            status='requested'
        )
        
        api_client.force_authenticate(user=user)
        
        response = api_client.post(f'/api/returns/returns/{return_obj.id}/approve/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_approve_return_admin(self, api_client, admin_user):
        """Test approving return as admin"""
        user = User.objects.create_user(
            username='test_v5',
            email='test_v5@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v5'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v5',
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
            status='requested'
        )
        
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post(f'/api/returns/returns/{return_obj.id}/approve/', {
            'scheduled_pickup_date': (date.today() + timedelta(days=1)).isoformat()
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'approved'
    
    def test_mark_received(self, api_client, admin_user):
        """Test marking return as received"""
        user = User.objects.create_user(
            username='test_v6',
            email='test_v6@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v6'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v6',
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
            status='scheduled'
        )
        
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post(f'/api/returns/returns/{return_obj.id}/mark_received/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'received'
        assert 'received_at' in response.data
    
    def test_complete_inspection(self, api_client, admin_user):
        """Test completing inspection"""
        user = User.objects.create_user(
            username='test_v7',
            email='test_v7@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v7'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v7',
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
            status='inspecting'
        )
        
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post(f'/api/returns/returns/{return_obj.id}/complete_inspection/', {
            'condition': 'good',
            'inspection_notes': 'Product in good condition',
            'damage_assessment': '',
            'damage_cost': 0
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'accepted'
        assert 'inspection_date' in response.data
    
    def test_my_returns(self, api_client):
        """Test my_returns action"""
        user = User.objects.create_user(
            username='test_v8',
            email='test_v8@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v8'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v8',
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
        Return.objects.create(
            booking=booking,
            status='requested'
        )
        
        api_client.force_authenticate(user=user)
        
        response = api_client.get('/api/returns/returns/my_returns/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.unit
@pytest.mark.django_db
class TestRefundViewSet:
    """Test Refund ViewSet"""
    
    def test_list_refunds_requires_admin(self, api_client):
        """Test listing refunds requires admin"""
        user = User.objects.create_user(
            username='test_v9',
            email='test_v9@example.com',
            password='testpass123'
        )
        api_client.force_authenticate(user=user)
        
        response = api_client.get('/api/returns/refunds/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_refunds_admin(self, api_client, admin_user):
        """Test listing refunds as admin"""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.get('/api/returns/refunds/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_process_refund(self, api_client, admin_user):
        """Test processing refund"""
        user = User.objects.create_user(
            username='test_v10',
            email='test_v10@example.com',
            password='testpass123'
        )
        category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses_v10'
        )
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress-v10',
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
        
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post(f'/api/returns/refunds/{refund.id}/process_refund/', {
            'transaction_reference': 'TXN123456'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'processed'
        assert 'processed_at' in response.data
