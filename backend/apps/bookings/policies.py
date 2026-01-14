"""
Cancellation and refund policies for ReadyRent.Gala
"""
from datetime import timedelta
from django.utils import timezone
from django.db import models


class CancellationPolicy:
    """Cancellation policy manager"""
    
    # Cancellation fee percentages based on hours before start date
    CANCELLATION_FEES = {
        24: 0.0,      # More than 24 hours: 0% fee
        12: 0.1,      # 12-24 hours: 10% fee
        6: 0.25,      # 6-12 hours: 25% fee
        0: 0.5,       # Less than 6 hours: 50% fee
    }
    
    # No refund if cancelled after start date
    NO_REFUND_AFTER_START = True
    
    # Early return refund percentage (per day)
    EARLY_RETURN_REFUND_RATE = 0.8  # 80% refund per unused day
    
    @classmethod
    def calculate_cancellation_fee(cls, booking, cancellation_time=None):
        """Calculate cancellation fee based on time before start date"""
        if cancellation_time is None:
            cancellation_time = timezone.now()
        
        time_until_start = booking.start_date - cancellation_time.date()
        hours_until_start = time_until_start.total_seconds() / 3600
        
        # Determine fee percentage
        fee_percentage = 0.5  # Default: 50%
        for hours_threshold, percentage in sorted(cls.CANCELLATION_FEES.items(), reverse=True):
            if hours_until_start >= hours_threshold:
                fee_percentage = percentage
                break
        
        # Calculate fee amount
        fee_amount = booking.total_price * fee_percentage
        
        # Refund amount
        refund_amount = booking.total_price - fee_amount
        
        return {
            'fee_percentage': fee_percentage * 100,
            'fee_amount': fee_amount,
            'refund_amount': refund_amount,
            'hours_until_start': hours_until_start,
        }
    
    @classmethod
    def can_cancel(cls, booking, cancellation_time=None):
        """Check if booking can be cancelled"""
        if cancellation_time is None:
            cancellation_time = timezone.now()
        
        # Can't cancel if already started
        if booking.status == 'in_use':
            return False, 'Cannot cancel booking that is already in use'
        
        # Can't cancel if already completed
        if booking.status == 'completed':
            return False, 'Cannot cancel completed booking'
        
        # Can't cancel if already cancelled
        if booking.status == 'cancelled':
            return False, 'Booking is already cancelled'
        
        # Can't cancel after start date if policy says so
        if cls.NO_REFUND_AFTER_START and cancellation_time.date() >= booking.start_date:
            return False, 'Cannot cancel booking after start date'
        
        return True, 'Booking can be cancelled'
    
    @classmethod
    def calculate_early_return_refund(cls, booking, return_date):
        """Calculate refund for early return"""
        if return_date >= booking.end_date:
            return {
                'refund_amount': 0,
                'unused_days': 0,
                'refund_per_day': 0,
            }
        
        unused_days = (booking.end_date - return_date).days
        if unused_days <= 0:
            return {
                'refund_amount': 0,
                'unused_days': 0,
                'refund_per_day': 0,
            }
        
        # Calculate refund per day
        price_per_day = booking.total_price / booking.total_days
        refund_per_day = price_per_day * cls.EARLY_RETURN_REFUND_RATE
        refund_amount = refund_per_day * unused_days
        
        return {
            'refund_amount': refund_amount,
            'unused_days': unused_days,
            'refund_per_day': refund_per_day,
        }


class RefundPolicy:
    """Refund policy manager"""
    
    # Automatic refund for cancellations
    AUTOMATIC_REFUND_ENABLED = True
    
    # Refund processing time (days)
    REFUND_PROCESSING_DAYS = 3
    
    @classmethod
    def process_refund(cls, booking, refund_amount, reason='Cancellation'):
        """Process refund for booking"""
        # In production, integrate with payment gateway
        # For now, just create a refund record
        
        from .models import Refund
        
        refund = Refund.objects.create(
            booking=booking,
            amount=refund_amount,
            reason=reason,
            status='pending',
            processing_days=cls.REFUND_PROCESSING_DAYS,
        )
        
        # TODO: Integrate with payment gateway to process actual refund
        # For now, mark as processed after processing days
        # In production, use Celery task to process refund
        
        return refund
    
    @classmethod
    def get_refund_status(cls, refund):
        """Get refund status"""
        if refund.status == 'pending':
            days_passed = (timezone.now().date() - refund.created_at.date()).days
            if days_passed >= refund.processing_days:
                return 'processing'
            return 'pending'
        return refund.status


