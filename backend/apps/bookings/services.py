"""
Booking services for cancellation and refund processing
"""
from django.utils import timezone
from .models import Booking, Refund, Cancellation
from .policies import CancellationPolicy, RefundPolicy


class BookingService:
    """Service for booking operations"""
    
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


