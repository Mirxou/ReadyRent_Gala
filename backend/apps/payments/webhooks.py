"""
Webhook handlers for payment gateways
"""
import json
import hmac
import hashlib
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views import View
from .models import Payment, PaymentWebhook
from .services import BaridiMobService, BankCardService, PaymentService
from apps.bookings.models import Booking


@method_decorator(csrf_exempt, name='dispatch')
class BaridiMobWebhookView(View):
    """Webhook handler for BaridiMob"""
    
    def post(self, request):
        """Handle BaridiMob webhook"""
        try:
            payload = json.loads(request.body)
            signature = request.headers.get('X-BaridiMob-Signature', '')
            
            # Verify signature
            if not BaridiMobService.verify_webhook(payload, signature):
                return JsonResponse({'error': 'Invalid signature'}, status=403)
            
            # Log webhook
            webhook = PaymentWebhook.objects.create(
                payment_method='baridimob',
                event_type=payload.get('event_type', 'unknown'),
                payload=payload,
                headers=dict(request.headers),
                processed=False
            )
            
            # Process webhook
            transaction_id = payload.get('transaction_id')
            event_type = payload.get('event_type')
            
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)
            except Payment.DoesNotExist:
                webhook.error_message = f'Payment not found for transaction_id: {transaction_id}'
                webhook.save()
                return JsonResponse({'error': 'Payment not found'}, status=404)
            
            # Update payment based on event
            if event_type == 'payment.completed':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.gateway_response = payload
                payment.save()
                
                # Update booking status using PaymentService
                PaymentService.update_booking_status(payment)
                
                webhook.payment = payment
                webhook.processed = True
                webhook.save()
                
            elif event_type == 'payment.failed':
                payment.status = 'failed'
                payment.failure_reason = payload.get('error_message', 'Payment failed')
                payment.gateway_response = payload
                payment.save()
                
                webhook.payment = payment
                webhook.processed = True
                webhook.save()
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class BankCardWebhookView(View):
    """Webhook handler for Bank Card gateway"""
    
    def post(self, request):
        """Handle bank card webhook"""
        try:
            payload = json.loads(request.body)
            signature = request.headers.get('X-Gateway-Signature', '')
            
            # Verify signature
            if not BankCardService.verify_webhook(payload, signature):
                return JsonResponse({'error': 'Invalid signature'}, status=403)
            
            # Log webhook
            webhook = PaymentWebhook.objects.create(
                payment_method='bank_card',
                event_type=payload.get('event_type', 'unknown'),
                payload=payload,
                headers=dict(request.headers),
                processed=False
            )
            
            # Process webhook
            transaction_id = payload.get('transaction_id')
            event_type = payload.get('event_type')
            
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)
            except Payment.DoesNotExist:
                webhook.error_message = f'Payment not found for transaction_id: {transaction_id}'
                webhook.save()
                return JsonResponse({'error': 'Payment not found'}, status=404)
            
            # Update payment based on event
            if event_type == 'payment.completed':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.gateway_response = payload
                payment.save()
                
                # Update booking status using PaymentService
                PaymentService.update_booking_status(payment)
                
                webhook.payment = payment
                webhook.processed = True
                webhook.save()
            
            elif event_type == 'payment.failed':
                payment.status = 'failed'
                payment.failure_reason = payload.get('error_message', 'Payment failed')
                payment.gateway_response = payload
                payment.save()
                
                webhook.payment = payment
                webhook.processed = True
                webhook.save()
            
            elif event_type == 'payment.3d_secure.completed':
                # 3D Secure authentication completed
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.gateway_response = payload
                payment.save()
                
                # Update booking status using PaymentService
                PaymentService.update_booking_status(payment)
                
                webhook.payment = payment
                webhook.processed = True
                webhook.save()
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
