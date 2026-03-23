import pytest
from decimal import Decimal
from apps.payments.serializers import (
    PaymentMethodSerializer, PaymentSerializer, PaymentCreateSerializer
)
from apps.payments.models import Payment, PaymentMethod
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.unit
@pytest.mark.django_db
class TestPaymentMethodSerializer:
    """Test PaymentMethodSerializer"""
    
    def test_payment_method_serialization(self):
        """Test payment method serialization"""
        method = PaymentMethod.objects.create(
            name='baridimob',
            display_name='BaridiMob',
            description='Pay with BaridiMob',
            is_active=True
        )
        
        serializer = PaymentMethodSerializer(method)
        data = serializer.data
        
        assert data['name'] == 'baridimob'
        assert data['display_name'] == 'BaridiMob'
        assert data['is_active'] is True

@pytest.mark.unit
@pytest.mark.django_db
class TestPaymentCreateSerializer:
    """Test PaymentCreateSerializer"""
    
    def test_payment_create_validation_baridimob(self):
        """Test validation for BaridiMob payment"""
        data = {
            'payment_method': 'baridimob',
            'amount': '1000.00',
            'currency': 'DZD'
        }
        # Missing phone number
        serializer = PaymentCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'phone_number' in serializer.errors
        
        # With phone number
        data['phone_number'] = '0666123456'
        serializer = PaymentCreateSerializer(data=data)
        assert serializer.is_valid()
    
    def test_payment_create_validation_bank_card(self):
        """Test validation for Bank Card payment"""
        data = {
            'payment_method': 'bank_card',
            'amount': '2000.00',
            'currency': 'DZD'
        }
        # Missing card details
        serializer = PaymentCreateSerializer(data=data)
        assert not serializer.is_valid()
        
        # With card details
        data.update({
            'card_number': '1234567890123456',
            'card_expiry': '12/25',
            'card_cvv': '123',
            'cardholder_name': 'John Doe'
        })
        serializer = PaymentCreateSerializer(data=data)
        assert serializer.is_valid()

@pytest.mark.unit
@pytest.mark.django_db
class TestPaymentSerializer:
    """Test PaymentSerializer"""
    
    def test_payment_serialization(self, api_client):
        """Test payment serialization"""
        user = User.objects.create_user(
            username='payer',
            email='payer@example.com',
            password='testpass123'
        )
        
        category = Category.objects.create(name='Test Cat', slug='test-cat')
        product = Product.objects.create(
            name='Test Product',
            price_per_day=Decimal('100.00'),
            category=category
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date='2026-01-01',
            end_date='2026-01-03',
            total_days=2,
            total_price=Decimal('200.00')
        )
        
        payment = Payment.objects.create(
            user=user,
            booking=booking,
            payment_method='baridimob',
            amount=Decimal('200.00'),
            currency='DZD',
            status='pending',
            phone_number='0661234567'
        )
        
        serializer = PaymentSerializer(payment)
        data = serializer.data
        
        assert data['user'] == user.id
        assert data['user_email'] == user.email
        assert data['amount'] == '200.00'
        assert data['payment_method'] == 'baridimob'
        assert data['status'] == 'pending'
        assert data['booking']['id'] == booking.id
