"""
Returns services
"""
from django.utils import timezone
from .models import Return, Refund
from apps.inventory.services import InventoryService


class ReturnService:
    """Service for return operations"""
    
    @staticmethod
    def create_return_request(booking):
        """
        Create a return request for a booking
        """
        # Check if return already exists
        if hasattr(booking, 'return_request'):
            return booking.return_request
        
        return_request = Return.objects.create(
            booking=booking,
            status='requested'
        )
        
        # Create return items
        from .models import ReturnItem
        ReturnItem.objects.create(
            return_request=return_request,
            product=booking.product,
            quantity_returned=1
        )
        
        return return_request
    
    @staticmethod
    def process_return(return_request):
        """
        Process a return after inspection
        """
        if return_request.status not in ['accepted', 'damaged']:
            return False
        
        # Release inventory
        booking = return_request.booking
        InventoryService.release_stock(
            product=booking.product,
            quantity=1,
            reference_type='Return',
            reference_id=return_request.id
        )
        
        # Update booking status
        booking.status = 'completed'
        booking.save()
        
        # Complete return
        return_request.status = 'completed'
        return_request.completed_at = timezone.now()
        return_request.save()
        
        return True
    
    @staticmethod
    def create_refund(return_request, refund_type, amount, reason):
        """
        Create a refund for a return
        """
        # Check if refund already exists
        if hasattr(return_request, 'refund'):
            return return_request.refund
        
        refund = Refund.objects.create(
            return_request=return_request,
            refund_type=refund_type,
            amount=amount,
            reason=reason,
            status='pending'
        )
        
        return refund

