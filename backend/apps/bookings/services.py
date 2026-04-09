"""
Booking services for cancellation and refund processing
"""
import structlog
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from .models import Booking, Refund, Cancellation
from .policies import CancellationPolicy, RefundPolicy

logger = structlog.get_logger(__name__)

class BookingService:
    """Service for booking operations with Sovereign Integrity"""
    
    @staticmethod
    def create_booking(user, product, start_date, end_date, total_days=None, total_price=None, quantity=1):
        """
        Create a new booking with intelligent automation and forensic security.
        Implements 'Tech Shock': Auto-confirm for high-trust users.
        """
        from standard_core.risk_engine import RiskEngine
        from apps.users.services.user_logic import VerificationService as KYCService
        from apps.hygiene.models import HygieneCertificate
        from .availability_service import AvailabilityService
        import hmac
        import hashlib
        from django.conf import settings

        # 1. Internal Validation & Recalculation (Don't trust the frontend)
        if start_date < timezone.now().date():
            raise DjangoValidationError('لا يمكن الحجز في تاريخ ماضٍ.')
        
        if end_date < start_date:
            raise DjangoValidationError('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.')

        calc_total_days = (end_date - start_date).days + 1
        calc_total_price = product.price_per_day * calc_total_days * quantity
        
        # Log if there is a price mismatch (potential manipulation attempt)
        if total_price and abs(Decimal(str(total_price)) - calc_total_price) > Decimal("0.01"):
            logger.warning(
                "price_manipulation_detected",
                user_id=user.id,
                provided_price=str(total_price),
                calculated_price=str(calc_total_price)
            )

        # 2. Eligibility & Identity Gates
        KYCService.require_booking_eligibility(user, calc_total_price)

        # 3. Owner Integrity Shield
        owner = product.owner
        if not owner or not owner.is_active:
             raise DjangoValidationError('هذا المنتج غير متاح حالياً بسبب حالة حساب المالك.')
        
        if KYCService.check_blacklist(owner):
             raise DjangoValidationError('هذا المنتج تحت التجميد الأمني المؤقت.')

        # 4. Availability Check (Forensic Enforcement)
        # 🛡️ SOVEREIGN INTEGRITY: Always bypass cache during creation to ensure real-time accuracy under lock.
        availability = AvailabilityService.check_availability(
            product_id=product.id,
            start_date=start_date,
            end_date=end_date,
            bypass_cache=True
        )
        if not availability['available']:
            raise DjangoValidationError(availability['message'])

        # 5. Hygiene & Safety Check
        latest_certificate = (
            HygieneCertificate.objects.select_related('hygiene_record__product')
            .filter(hygiene_record__product=product)
            .order_by('-issued_date')
            .first()
        )
        if latest_certificate and (not latest_certificate.is_valid or latest_certificate.is_expired()):
            raise DjangoValidationError('شهادة النظافة لهذا المنتج منتهية أو غير صالحة.')

        # 6. Sovereign Risk Evaluation
        risk_decision = RiskEngine.evaluate(user, product)

        # 7. Decision Mapping
        if not risk_decision.allowed:
            initial_status = 'rejected' if risk_decision.risk_level == 'CRITICAL' else 'manual_review'
            auto_confirmed = False
        else:
            if risk_decision.auto_confirm:
                initial_status = 'confirmed'
                auto_confirmed = True
            else:
                initial_status = 'pending'
                auto_confirmed = False

        # 8. Atomic Transactional Creation
        with transaction.atomic():
            # Generate Sovereign Handshake (WORM Compliance)
            # Create a unique hash of the booking core details to prevent tampering
            signature_payload = f"{user.id}:{product.id}:{start_date}:{end_date}:{calc_total_price}"
            signature_proof = hmac.new(
                settings.SECRET_KEY.encode(),
                signature_payload.encode(),
                hashlib.sha256
            ).hexdigest()

            booking = Booking.objects.create(
                user=user,
                product=product,
                start_date=start_date,
                end_date=end_date,
                total_days=calc_total_days,
                total_price=calc_total_price,
                base_price=calc_total_price,
                status=initial_status,
                security_deposit=risk_decision.deposit_requirement,
                signature_proof=signature_proof,
                signed_at=timezone.now()
            )

            # 9. Atomic Escrow Initiation
            if initial_status == 'confirmed':
                from apps.payments.models import EscrowHold, Wallet, WalletTransaction
                
                wallet, _ = Wallet.objects.select_for_update().get_or_create(user=booking.user)
                
                if wallet.balance < booking.total_price:
                    raise DjangoValidationError('رصيد المحفظة غير كافٍ لإتمام حجز الضمان الذكي.')
                
                wallet.balance -= booking.total_price
                wallet.save(update_fields=['balance', 'updated_at'])
                
                EscrowHold.objects.create(
                    booking=booking,
                    wallet=wallet,
                    amount=booking.total_price,
                    state='held'
                )
                
                WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=-booking.total_price,
                    balance_after=wallet.balance,
                    transaction_type='escrow_lock',
                    reference_id=f"BOK-{booking.id}",
                    description="Tech Shock Auto-Escrow Lock"
                )

                logger.info("tech_shock_escrow_initiated", booking_id=booking.id, amount=str(calc_total_price))

        return booking, auto_confirmed

    @staticmethod
    def get_trust_reward_message(auto_confirmed):
        """Generate the 'Shock' message for the user"""
        if auto_confirmed:
            return "🌟 نظراً لسجلك الممتاز وثقتنا العالية، تم تأكيد حجزك فوراً! شكراً لوفائك."
        return "تم استلام طلبك وهو قيد المراجعة الأمنية السريعة."

    @staticmethod
    def cancel_booking(booking, user, reason=''):
        """Cancel booking and process refund"""
        # Check if can cancel
        can_cancel, message = CancellationPolicy.can_cancel(booking)
        if not can_cancel:
            raise ValueError(message)
        
        # Calculate cancellation fee
        fee_info = CancellationPolicy.calculate_cancellation_fee(booking)
        
        # Create cancellation record
        cancellation = Cancellation.objects.create(
            booking=booking,
            cancelled_by=user,
            reason=reason,
            cancellation_fee=fee_info['fee_amount'],
            refund_amount=fee_info['refund_amount'],
        )
        
        # Process refund if applicable
        refund = None
        if fee_info['refund_amount'] > 0 and RefundPolicy.AUTOMATIC_REFUND_ENABLED:
            refund = RefundPolicy.process_refund(
                booking,
                fee_info['refund_amount'],
                reason='Cancellation'
            )
            cancellation.refund = refund
            cancellation.save()
        
        # Update booking status
        booking.status = 'cancelled'
        booking.save()
        
        return cancellation, refund
    
    @staticmethod
    def process_early_return(booking, return_date, user):
        """Process early return and calculate refund"""
        if return_date >= booking.end_date:
            raise ValueError('Return date must be before end date')
        
        # Calculate refund
        refund_info = CancellationPolicy.calculate_early_return_refund(booking, return_date)
        
        if refund_info['refund_amount'] > 0:
            # Create refund
            refund = Refund.objects.create(
                booking=booking,
                amount=refund_info['refund_amount'],
                reason=f'Early return - {refund_info["unused_days"]} unused days',
                status='pending',
            )
            
            # Process refund
            if RefundPolicy.AUTOMATIC_REFUND_ENABLED:
                RefundPolicy.process_refund(
                    booking,
                    refund_info['refund_amount'],
                    reason='Early Return'
                )
            
            return refund, refund_info
        
        return None, refund_info
