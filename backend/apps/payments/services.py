"""
Payment services for ReadyRent.Gala
"""
import requests
import hashlib
import hmac
import json
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .models import Payment, PaymentWebhook
from apps.bookings.models import Booking


class BaridiMobService:
    """Service for BaridiMob payment integration"""
    
    # Configuration from settings
    API_URL = getattr(settings, 'BARIDIMOB_API_URL', 'https://api.baridimob.dz')
    API_KEY = getattr(settings, 'BARIDIMOB_API_KEY', '')
    MERCHANT_ID = getattr(settings, 'BARIDIMOB_MERCHANT_ID', '')
    SECRET_KEY = getattr(settings, 'BARIDIMOB_SECRET_KEY', '')
    
    @classmethod
    def initiate_payment(cls, payment: Payment, phone_number: str):
        """
        Initiate BaridiMob payment
        
        Args:
            payment: Payment instance
            phone_number: Customer phone number (format: 213XXXXXXXXX)
        
        Returns:
            dict with success status and transaction_id or error
        """
        if not cls.API_KEY or not cls.MERCHANT_ID:
            return {
                'success': False,
                'error': 'BaridiMob API not configured'
            }
        
        # Format phone number (ensure country code)
        phone = phone_number.replace('+', '').replace(' ', '').replace('-', '')
        if not phone.startswith('213'):
            phone = '213' + phone.lstrip('0')
        
        # Prepare request data
        payload = {
            'merchant_id': cls.MERCHANT_ID,
            'amount': float(payment.amount),
            'currency': payment.currency,
            'order_id': f'RRG-{payment.id}',
            'customer_phone': phone,
            'description': f'Payment for booking #{payment.booking.id if payment.booking else "N/A"}',
            'callback_url': f'{getattr(settings, "BACKEND_URL", getattr(settings, "FRONTEND_URL", "http://localhost:8000"))}/api/payments/webhooks/baridimob/',
        }
        
        # Generate signature
        signature = cls._generate_signature(payload)
        payload['signature'] = signature
        
        # Send request
        try:
            headers = {
                'Authorization': f'Bearer {cls.API_KEY}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                f'{cls.API_URL}/api/v1/payments/initiate',
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                payment.transaction_id = data.get('transaction_id')
                payment.phone_number = phone
                payment.gateway_response = data
                payment.status = 'processing'
                payment.save()
                
                return {
                    'success': True,
                    'transaction_id': data.get('transaction_id'),
                    'otp_required': data.get('otp_required', True),
                    'message': data.get('message', 'Payment initiated successfully')
                }
            else:
                error_msg = response.json().get('error', 'Payment initiation failed')
                payment.status = 'failed'
                payment.failure_reason = error_msg
                payment.save()
                
                return {
                    'success': False,
                    'error': error_msg
                }
        except Exception as e:
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.save()
            
            return {
                'success': False,
                'error': f'Error initiating payment: {str(e)}'
            }
    
    @classmethod
    def verify_otp(cls, payment: Payment, otp_code: str):
        """
        Verify OTP code for BaridiMob payment
        
        Args:
            payment: Payment instance
            otp_code: OTP code from customer
        
        Returns:
            dict with success status
        """
        if not payment.transaction_id:
            return {
                'success': False,
                'error': 'Transaction ID not found'
            }
        
        payload = {
            'merchant_id': cls.MERCHANT_ID,
            'transaction_id': payment.transaction_id,
            'otp_code': otp_code,
        }
        
        signature = cls._generate_signature(payload)
        payload['signature'] = signature
        
        try:
            headers = {
                'Authorization': f'Bearer {cls.API_KEY}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                f'{cls.API_URL}/api/v1/payments/verify-otp',
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('verified'):
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.otp_code = otp_code
                    payment.gateway_response = data
                    payment.save()
                    
                    # Update booking status
                    PaymentService.update_booking_status(payment)
                    
                    return {
                        'success': True,
                        'message': 'Payment completed successfully'
                    }
                else:
                    return {
                        'success': False,
                        'error': data.get('error', 'OTP verification failed')
                    }
            else:
                error_msg = response.json().get('error', 'OTP verification failed')
                return {
                    'success': False,
                    'error': error_msg
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error verifying OTP: {str(e)}'
            }
    
    @classmethod
    def _generate_signature(cls, payload: dict) -> str:
        """Generate signature for BaridiMob API"""
        # Sort payload by keys
        sorted_payload = sorted(payload.items())
        # Create signature string
        signature_string = '&'.join([f'{k}={v}' for k, v in sorted_payload if k != 'signature'])
        signature_string += f'&secret={cls.SECRET_KEY}'
        # Generate hash
        return hashlib.sha256(signature_string.encode()).hexdigest()
    
    @classmethod
    def verify_webhook(cls, payload: dict, signature: str) -> bool:
        """Verify webhook signature"""
        expected_signature = cls._generate_signature(payload)
        return hmac.compare_digest(expected_signature, signature)


class BankCardService:
    """Service for Bank Card payment integration (Algerian banks)"""
    
    # Configuration from settings
    GATEWAY_URL = getattr(settings, 'BANK_GATEWAY_URL', 'https://gateway.example.dz')
    MERCHANT_ID = getattr(settings, 'BANK_MERCHANT_ID', '')
    API_KEY = getattr(settings, 'BANK_API_KEY', '')
    SECRET_KEY = getattr(settings, 'BANK_SECRET_KEY', '')
    
    @classmethod
    def process_payment(cls, payment: Payment, card_data: dict):
        """
        Process bank card payment
        
        Args:
            payment: Payment instance
            card_data: dict with card_number, expiry, cvv, cardholder_name
        
        Returns:
            dict with success status and transaction_id or error
        """
        if not cls.API_KEY or not cls.MERCHANT_ID:
            return {
                'success': False,
                'error': 'Bank gateway not configured'
            }
        
        # Extract card info (last 4 digits for storage)
        card_number = card_data.get('card_number', '').replace(' ', '').replace('-', '')
        card_last_four = card_number[-4:] if len(card_number) >= 4 else ''
        
        # Determine card brand
        card_brand = cls._detect_card_brand(card_number)
        
        # Prepare request data
        payload = {
            'merchant_id': cls.MERCHANT_ID,
            'amount': float(payment.amount),
            'currency': payment.currency,
            'order_id': f'RRG-{payment.id}',
            'card_number': card_number,
            'card_expiry': card_data.get('card_expiry', '').replace('/', ''),
            'card_cvv': card_data.get('card_cvv', ''),
            'cardholder_name': card_data.get('cardholder_name', ''),
            'description': f'Payment for booking #{payment.booking.id if payment.booking else "N/A"}',
            'callback_url': f'{getattr(settings, "BACKEND_URL", getattr(settings, "FRONTEND_URL", "http://localhost:8000"))}/api/payments/webhooks/bank-card/',
        }
        
        # Generate signature
        signature = cls._generate_signature(payload)
        payload['signature'] = signature
        
        try:
            headers = {
                'Authorization': f'Bearer {cls.API_KEY}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                f'{cls.GATEWAY_URL}/api/v1/payments/process',
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'success':
                    payment.transaction_id = data.get('transaction_id')
                    payment.card_last_four = card_last_four
                    payment.card_brand = card_brand
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.gateway_response = data
                    payment.save()
                    
                    # Update booking status
                    PaymentService.update_booking_status(payment)
                    
                    return {
                        'success': True,
                        'transaction_id': data.get('transaction_id'),
                        'message': 'Payment completed successfully'
                    }
                elif data.get('status') == '3d_secure_required':
                    # 3D Secure authentication required
                    payment.transaction_id = data.get('transaction_id')
                    payment.card_last_four = card_last_four
                    payment.card_brand = card_brand
                    payment.status = 'processing'
                    payment.gateway_response = data
                    payment.save()
                    
                    return {
                        'success': True,
                        'requires_3d_secure': True,
                        'redirect_url': data.get('redirect_url'),
                        'transaction_id': data.get('transaction_id')
                    }
                else:
                    error_msg = data.get('error', 'Payment processing failed')
                    payment.status = 'failed'
                    payment.failure_reason = error_msg
                    payment.save()
                    
                    return {
                        'success': False,
                        'error': error_msg
                    }
            else:
                error_msg = response.json().get('error', 'Payment processing failed')
                payment.status = 'failed'
                payment.failure_reason = error_msg
                payment.save()
                
                return {
                    'success': False,
                    'error': error_msg
                }
        except Exception as e:
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.save()
            
            return {
                'success': False,
                'error': f'Error processing payment: {str(e)}'
            }
    
    @classmethod
    def _detect_card_brand(cls, card_number: str) -> str:
        """Detect card brand from card number"""
        card_number = card_number.replace(' ', '').replace('-', '')
        
        if card_number.startswith('4'):
            return 'visa'
        elif card_number.startswith('5') or card_number.startswith('2'):
            return 'mastercard'
        elif card_number.startswith('3'):
            return 'amex'
        else:
            return 'unknown'
    
    @classmethod
    def _generate_signature(cls, payload: dict) -> str:
        """Generate signature for bank gateway"""
        sorted_payload = sorted(payload.items())
        signature_string = '&'.join([f'{k}={v}' for k, v in sorted_payload if k != 'signature'])
        signature_string += f'&secret={cls.SECRET_KEY}'
        return hashlib.sha256(signature_string.encode()).hexdigest()
    
    @classmethod
    def verify_webhook(cls, payload: dict, signature: str) -> bool:
        """Verify webhook signature"""
        expected_signature = cls._generate_signature(payload)
        return hmac.compare_digest(expected_signature, signature)


class PaymentService:
    """Main payment service"""
    
    @staticmethod
    def update_booking_status(payment: Payment):
        """
        Update booking status to confirmed when payment is completed
        """
        if payment.booking and payment.status == 'completed':
            if payment.booking.status == 'pending':
                payment.booking.status = 'confirmed'
                payment.booking.save()
                # Send confirmation notifications
                try:
                    from apps.notifications.services import send_booking_confirmation_email
                    send_booking_confirmation_email(payment.booking)
                except Exception as e:
                    # Log error but don't fail
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error sending booking confirmation: {e}")
    
    @staticmethod
    def create_payment(user, amount, currency='DZD', booking=None, payment_method='baridimob', **kwargs):
        """Create a new payment"""
        payment = Payment.objects.create(
            user=user,
            booking=booking,
            payment_method=payment_method,
            amount=amount,
            currency=currency,
            status='pending'
        )
        return payment
    
    @staticmethod
    def process_payment(payment: Payment, payment_data: dict):
        """Process payment based on method"""
        if payment.payment_method == 'baridimob':
            if 'otp_code' in payment_data and payment_data['otp_code']:
                # Verify OTP
                return BaridiMobService.verify_otp(payment, payment_data['otp_code'])
            else:
                # Initiate payment
                return BaridiMobService.initiate_payment(
                    payment,
                    payment_data.get('phone_number', '')
                )
        elif payment.payment_method == 'bank_card':
            return BankCardService.process_payment(payment, payment_data)
        else:
            return {
                'success': False,
                'error': f'Unknown payment method: {payment.payment_method}'
            }
