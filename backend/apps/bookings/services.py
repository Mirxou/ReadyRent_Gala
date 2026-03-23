"""
Booking services for cancellation and refund processing
"""
from django.utils import timezone
from .models import Booking, Refund, Cancellation
from .policies import CancellationPolicy, RefundPolicy


class BookingService:
    """Service for booking operations"""
    
    @staticmethod
    def create_booking(user, product, start_date, end_date, total_days, total_price):
        """
        Create a new booking with intelligent automation.
        Implements 'Tech Shock': Auto-confirm for high-trust users.
        """
        from standard_core.risk_engine import RiskEngine
        
        # 1. Evaluate Risk (Centralized)
        # Note: 'product' here corresponds to 'Asset' in core engine terms
        risk_decision = RiskEngine.evaluate(user, product)

        if not risk_decision.allowed:
            # If engine says NO (e.g. Critical Risk), we reject creation
            # Or we could create as 'rejected'? For now, let's create as 'pending_review' or raise error?
            # Better to create as 'pending' but flagged, OR raise ValueError if it's a hard block.
            # RiskEngine.evaluate returns allowed=False for Critical/HighRisk+HighValue.
            # Let's default to 'pending_risk_review' or just 'rejected'.
            # Given the flow, let's set status to 'rejected' explicitly or strictly 'manual_review'.
            initial_status = 'rejected' if risk_decision.risk_level == 'CRITICAL' else 'manual_review'
            auto_confirmed = False
        else:
            # 2. Determine Status from Decision
            if risk_decision.auto_confirm:
                initial_status = 'confirmed'
                auto_confirmed = True
            else:
                initial_status = 'pending'
                auto_confirmed = False

        # 3. Create Booking
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            total_price=total_price, # Base price
            security_deposit=risk_decision.deposit_requirement, # Apply calculated deposit
            status=initial_status
        )
        
        return booking, auto_confirmed

    @staticmethod
    def get_trust_reward_message(auto_confirmed):
        """Generate the 'Shock' message for the user"""
        if auto_confirmed:
            return "🌟 نظراً لسجلك الممتاز، تم تأكيد حجزك فوراً! شكراً لثقتك بنا."
        return "تم استلام طلبك وهو قيد المراجعة."

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


