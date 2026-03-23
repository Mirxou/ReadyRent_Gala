import pytest
from unittest.mock import patch, MagicMixin
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from decimal import Decimal

from apps.payments.models import Payment, PaymentMethod
from apps.bookings.models import Booking
from apps.products.models import Product, Category

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.unit
@pytest.mark.django_db
class TestPaymentViewSet:
    """Test Payment ViewSet"""
    
    def test_list_payments_requires_auth(self, api_client):
        """Test listing payments requires auth"""
        response = api_client.get('/api/payments/payments/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_payments_authenticated(self, api_client):
        """Test listing payments"""
        user = User.objects.create_user(username='test', email='test@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        response = api_client.get('/api/payments/payments/')
        assert response.status_code == status.HTTP_200_OK

    def test_payment_status_access(self, api_client):
        """Test viewing payment status"""
        user = User.objects.create_user(username='test', email='test@example.com', password='pass')
        other_user = User.objects.create_user(username='other', email='other@example.com', password='pass')
        
        payment = Payment.objects.create(
            user=user,
            amount=Decimal('500.00'),
            payment_method='baridimob'
        )
        
        api_client.force_authenticate(user=other_user)
        response = api_client.get(f'/api/payments/payments/{payment.id}/status/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        api_client.force_authenticate(user=user)
        response = api_client.get(f'/api/payments/payments/{payment.id}/status/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == payment.id

    @patch('apps.payments.services.BaridiMobService.verify_otp')
    def test_verify_otp_success(self, mock_verify, api_client):
        """Test successful OTP verification"""
        user = User.objects.create_user(username='test_otp', email='test_otp@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        payment = Payment.objects.create(
            user=user,
            amount=Decimal('500.00'),
            payment_method='baridimob',
            status='pending'
        )
        
        mock_verify.return_value = {'success': True, 'message': 'Verified'}
        
        response = api_client.post(f'/api/payments/payments/{payment.id}/verify_otp/', {'otp_code': '123456'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_verify_otp_wrong_method(self, api_client):
        """Test OTP verification on wrong method"""
        user = User.objects.create_user(username='test_card', email='test_card@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        payment = Payment.objects.create(
            user=user,
            amount=Decimal('500.00'),
            payment_method='bank_card'
        )
        
        response = api_client.post(f'/api/payments/payments/{payment.id}/verify_otp/', {'otp_code': '123456'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'not require OTP' in response.data['error']

    def test_list_payments_admin(self, api_client):
        """Test listing payments as admin"""
        admin = User.objects.create_superuser(username='admin_user', email='admin@example.com', password='pass', role='admin')
        user = User.objects.create_user(username='user1', email='user1@example.com', password='pass')
        Payment.objects.create(user=user, amount=Decimal('100.00'), payment_method='baridimob')
        
        api_client.force_authenticate(user=admin)
        response = api_client.get('/api/payments/payments/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    @patch('apps.payments.services.BaridiMobService.verify_otp')
    def test_verify_otp_failure(self, mock_verify, api_client):
        """Test failed OTP verification"""
        user = User.objects.create_user(username='test_otp_fail', email='fail_otp@example.com', password='pass')
        api_client.force_authenticate(user=user)
        payment = Payment.objects.create(user=user, amount=Decimal('500.00'), payment_method='baridimob', status='pending')
        
        mock_verify.return_value = {'success': False, 'error': 'Invalid OTP'}
        response = api_client.post(f'/api/payments/payments/{payment.id}/verify_otp/', {'otp_code': '000000'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'Invalid OTP'

    def test_verify_otp_missing_code(self, api_client):
        """Test OTP verification without code"""
        user = User.objects.create_user(username='test_otp_miss', email='miss_otp@example.com', password='pass')
        api_client.force_authenticate(user=user)
        payment = Payment.objects.create(user=user, amount=Decimal('500.00'), payment_method='baridimob', status='pending')
        
        response = api_client.post(f'/api/payments/payments/{payment.id}/verify_otp/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required' in response.data['error']

    def test_status_permission_denied(self, api_client):
        """Test viewing another user's payment status (Expect 404 for security)"""
        user1 = User.objects.create_user(username='u1', email='u1@example.com', password='pass')
        user2 = User.objects.create_user(username='u2', email='u2@example.com', password='pass')
        payment = Payment.objects.create(user=user1, amount=Decimal('100.00'), payment_method='baridimob')
        
        api_client.force_authenticate(user=user2)
        response = api_client.get(f'/api/payments/payments/{payment.id}/status/')
        # DRF returns 404 if object not in queryset
        assert response.status_code == status.HTTP_404_NOT_FOUND



@pytest.mark.unit
@pytest.mark.django_db
class TestPaymentCreateView:
    """Test Payment Creation View"""
    
    @patch('apps.payments.services.PaymentService.process_payment')
    def test_create_payment_bank_card(self, mock_process, api_client):
        """Test successful bank card payment creation"""
        user = User.objects.create_user(username='payer_card', email='payer_card@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        mock_process.return_value = {'success': True, 'requires_3d_secure': True, 'redirect_url': 'http://secure.3d'}
        
        data = {
            'payment_method': 'bank_card',
            'amount': '1000.00',
            'card_number': '1234567890123456',
            'card_expiry': '12/26',
            'card_cvv': '123',
            'cardholder_name': 'Test User'
        }
        
        response = api_client.post('/api/payments/create/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['requires_3d_secure'] is True

    def test_create_payment_booking_not_found(self, api_client):
        """Test payment creation with non-existent booking"""
        user = User.objects.create_user(username='payer_nb', email='payer_nb@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        data = {
            'booking_id': 9999,
            'payment_method': 'baridimob',
            'amount': '1000.00',
            'phone_number': '0661234567'
        }
        
        response = api_client.post('/api/payments/create/', data)
        assert response.status_code == status.HTTP_404_NOT_FOUND


    @patch('apps.payments.services.PaymentService.process_payment')
    def test_create_payment_processing_failure(self, mock_process, api_client):
        """Test payment processing failure"""
        user = User.objects.create_user(username='payer_fail', email='payer_fail@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        mock_process.return_value = {'success': False, 'error': 'Gateway unreachable'}
        
        data = {
            'payment_method': 'baridimob',
            'amount': '1000.00',
            'phone_number': '0661234567'
        }
        
        response = api_client.post('/api/payments/create/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'Gateway unreachable'


