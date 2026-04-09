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
from django.db import transaction
from django.views import View
from .models import Payment, PaymentWebhook, Wallet, WalletTransaction
from .services import BaridiMobService, BankCardService, PaymentService
from apps.bookings.models import Booking


@method_decorator(csrf_exempt, name='dispatch')
class BaridiMobWebhookView(View):
    """
    Webhook handler for BaridiMob (Phase 16.1 - Production-Grade)
    
    Guarantees:
    - Idempotency: Same event_id processed exactly once
    - Atomicity: All mutations in single transaction
    - Race-free: Full locking on payment and booking
    """
    
    def post(self, request):
        """Handle BaridiMob webhook"""
        try:
            payload = json.loads(request.body)
            signature = request.headers.get('X-BaridiMob-Signature', '')
            
            # 1. Verify signature FIRST (before any DB operations)
            if not BaridiMobService.verify_webhook(payload, signature):
                return JsonResponse({'error': 'Invalid signature'}, status=403)
            
            # Extract critical fields
            event_id = payload.get('event_id')
            if not event_id:
                return JsonResponse({'error': 'Missing event_id'}, status=400)
            
            transaction_id = payload.get('transaction_id')
            event_type = payload.get('event_type')
            
            # 2. ATOMIC ENVELOPE: Everything in single transaction
            with transaction.atomic():
                # 2a. Idempotent webhook creation (get_or_create + lock)
                webhook, created = PaymentWebhook.objects.select_for_update().get_or_create(
                    payment_method='baridimob',
                    event_id=event_id,
                    defaults={
                        'event_type': event_type,
                        'payload': payload,
                        'headers': dict(request.headers),
                        'processed': False
                    }
                )
                
                # 2b. Check if already processed (idempotency guard)
                if not created and webhook.processed:
                    return JsonResponse({
                        'status': 'already_processed',
                        'message': f'Event {event_id} already handled'
                    })
                
                # 2c. Lock Payment (prevents race with confirm endpoint)
                try:
                    payment = Payment.objects.select_for_update().get(
                        transaction_id=transaction_id
                    )
                except Payment.DoesNotExist:
                    webhook.error_message = f'Payment not found: {transaction_id}'
                    webhook.save()
                    return JsonResponse({'error': 'Payment not found'}, status=404)
                
                # 2c-CRITICAL: Validate webhook amount matches payment amount (H-3 fix)
                from decimal import Decimal
                webhook_amount = Decimal(str(payload.get('amount', '0')))
                if webhook_amount != payment.amount:
                    webhook.error_message = f'Amount mismatch: expected {payment.amount}, received {webhook_amount}'
                    webhook.save()
                    return JsonResponse({'error': 'Amount mismatch - webhook rejected'}, status=400)
                
                # 2d. Lock Booking (if exists)
                locked_booking = None
                if payment.booking:
                    locked_booking = Booking.objects.select_for_update().get(
                        id=payment.booking.id
                    )
                
                # 2e. Apply state changes based on event type
                if event_type == 'payment.completed':
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.gateway_response = payload
                    payment.save()

                    renter_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=payment.user)
                    if not WalletTransaction.objects.filter(
                        wallet=renter_wallet,
                        reference_id=f"payment:{payment.id}",
                        transaction_type='deposit'
                    ).exists():
                        renter_wallet.balance += payment.amount
                        renter_wallet.save()
                        WalletTransaction.objects.create(
                            wallet=renter_wallet,
                            amount=payment.amount,
                            balance_after=renter_wallet.balance,
                            transaction_type='deposit',
                            reference_id=f"payment:{payment.id}",
                            description=(
                                f"Payment completed for Booking #{payment.booking.id if payment.booking else 'N/A'}"
                            ),
                        )
                    
                    # Update booking (safely locked)
                    if locked_booking and locked_booking.status == 'pending':
                        locked_booking.status = 'confirmed'
                        locked_booking.save()
                        
                        # Phase 3: Escrow Engine Transition (Big Bang)
                        # Initiate escrow hold via Engine logic (PENDING -> HELD)
                        # Phase 3: Escrow Engine Transition (Big Bang)

                        # Initiate escrow hold via Engine logic (PENDING -> HELD)
                        
                        try:
                            from apps.payments.models import EscrowHold
                            from apps.payments.engine import EscrowEngine
                            from apps.payments.states import EscrowState
                            from apps.payments.context import EscrowEngineContext
                            from apps.payments.engine import InvalidStateTransitionError, TerminalStateError

                            # Ensure Hold Exists (Idempotent)
                            renter_wallet, _ = Wallet.objects.get_or_create(user=payment.user)
                            escrow_hold, created = EscrowHold.objects.get_or_create(
                                booking=locked_booking,
                                defaults={
                                    'amount': payment.amount,
                                    'state': EscrowState.PENDING,
                                    'wallet': renter_wallet,
                                }
                            )
                            
                            # Execute Transition
                            with EscrowEngineContext.activate():
                                EscrowEngine.transition(
                                    hold_id=escrow_hold.id,
                                    target_state=EscrowState.HELD,
                                    reason=f"Payment Success (Webhook: {payment.transaction_id})",
                                    actor=None # System
                                )
                                
                        except (InvalidStateTransitionError, TerminalStateError) as e:
                            # 3️⃣ Webhook Behavior Rule (Critical)
                            # Ignore redundant transitions or late arrivals
                            return JsonResponse({"status": "ignored", "reason": str(e)}, status=200)
                        except Exception as e:
                             # Critical System Error
                             raise e
                    
                    webhook.payment = payment
                    
                elif event_type == 'payment.failed':
                    payment.status = 'failed'
                    payment.failure_reason = payload.get('error_message', 'Payment failed')
                    payment.gateway_response = payload
                    payment.save()
                    
                    webhook.payment = payment
                
                # 2f. Mark webhook processed (LAST step before commit)
                webhook.processed = True
                webhook.save()
                
                return JsonResponse({'status': 'success'})
        
        except Exception as e:
            # Log error but return 500 (gateway will retry if needed)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'BaridiMob webhook error: {str(e)}', exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class BankCardWebhookView(View):
    """
    Webhook handler for Bank Card gateway (Phase 16.1 - Production-Grade)
    
    Guarantees:
    - Idempotency: Same event_id processed exactly once
    - Atomicity: All mutations in single transaction
    - Race-free: Full locking on payment and booking
    """
    
    def post(self, request):
        """Handle bank card webhook"""
        try:
            payload = json.loads(request.body)
            signature = request.headers.get('X-Gateway-Signature', '')
            
            # 1. Verify signature FIRST
            if not BankCardService.verify_webhook(payload, signature):
                return JsonResponse({'error': 'Invalid signature'}, status=403)
            
            # Extract critical fields
            event_id = payload.get('event_id')
            if not event_id:
                return JsonResponse({'error': 'Missing event_id'}, status=400)
            
            transaction_id = payload.get('transaction_id')
            event_type = payload.get('event_type')
            
            # 2. ATOMIC ENVELOPE: Everything in single transaction
            with transaction.atomic():
                # 2a. Idempotent webhook creation
                webhook, created = PaymentWebhook.objects.select_for_update().get_or_create(
                    payment_method='bank_card',
                    event_id=event_id,
                    defaults={
                        'event_type': event_type,
                        'payload': payload,
                        'headers': dict(request.headers),
                        'processed': False
                    }
                )
                
                # 2b. Check if already processed
                if not created and webhook.processed:
                    return JsonResponse({
                        'status': 'already_processed',
                        'message': f'Event {event_id} already handled'
                    })
                
                # 2c. Lock Payment
                try:
                    payment = Payment.objects.select_for_update().get(
                        transaction_id=transaction_id
                    )
                except Payment.DoesNotExist:
                    webhook.error_message = f'Payment not found: {transaction_id}'
                    webhook.save()
                    return JsonResponse({'error': 'Payment not found'}, status=404)
                
                # 2d. Validate webhook amount when present
                from decimal import Decimal
                webhook_amount = Decimal(str(payload.get('amount', '0')))
                if webhook_amount != payment.amount:
                    webhook.error_message = f'Amount mismatch: expected {payment.amount}, received {webhook_amount}'
                    webhook.save()
                    return JsonResponse({'error': 'Amount mismatch - webhook rejected'}, status=400)

                # 2e. Lock Booking (if exists)
                locked_booking = None
                if payment.booking:
                    locked_booking = Booking.objects.select_for_update().get(
                        id=payment.booking.id
                    )
                
                # 2f. Apply state changes
                if event_type in ['payment.completed', 'payment.3d_secure.completed']:
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.gateway_response = payload
                    payment.save()

                    renter_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=payment.user)
                    if not WalletTransaction.objects.filter(
                        wallet=renter_wallet,
                        reference_id=f"payment:{payment.id}",
                        transaction_type='deposit'
                    ).exists():
                        renter_wallet.balance += payment.amount
                        renter_wallet.save()
                        WalletTransaction.objects.create(
                            wallet=renter_wallet,
                            amount=payment.amount,
                            balance_after=renter_wallet.balance,
                            transaction_type='deposit',
                            reference_id=f"payment:{payment.id}",
                            description=(
                                f"Payment completed for Booking #{payment.booking.id if payment.booking else 'N/A'}"
                            ),
                        )
                    
                    # Update booking
                    if locked_booking and locked_booking.status == 'pending':
                        locked_booking.status = 'confirmed'
                        locked_booking.save()
                        
                        # Phase 3: Engine Transition (Big Bang) - 3D Secure / Completed
                        try:
                            from apps.payments.models import EscrowHold
                            from apps.payments.engine import EscrowEngine
                            from apps.payments.states import EscrowState
                            from apps.payments.context import EscrowEngineContext
                            from apps.payments.engine import InvalidStateTransitionError, TerminalStateError

                            # Ensure Hold Exists
                            renter_wallet, _ = Wallet.objects.get_or_create(user=payment.user)
                            escrow_hold, created = EscrowHold.objects.get_or_create(
                                booking=locked_booking,
                                defaults={
                                    'amount': payment.amount,
                                    'state': EscrowState.PENDING,
                                    'wallet': renter_wallet,
                                }
                            )
                            
                            # Execute Transition
                            with EscrowEngineContext.activate():
                                EscrowEngine.transition(
                                    hold_id=escrow_hold.id,
                                    target_state=EscrowState.HELD,
                                    reason=f"Payment Success (Webhook 3DS: {payment.transaction_id})",
                                    actor=None
                                )
                                
                        except (InvalidStateTransitionError, TerminalStateError) as e:
                            return JsonResponse({"status": "ignored", "reason": str(e)}, status=200)
                        except Exception as e:
                             raise e
                    
                    webhook.payment = payment
                
                elif event_type == 'payment.failed':
                    payment.status = 'failed'
                    payment.failure_reason = payload.get('error_message', 'Payment failed')
                    payment.gateway_response = payload
                    payment.save()
                    
                    webhook.payment = payment
                
                # 2f. Mark processed
                webhook.processed = True
                webhook.save()
                
                return JsonResponse({'status': 'success'})
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'BankCard webhook error: {str(e)}', exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)

