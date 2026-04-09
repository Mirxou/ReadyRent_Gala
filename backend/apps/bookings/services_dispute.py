from django.utils import timezone
from .models import Booking
from .services_escrow import EscrowService

class DisputeService:
    """
    The Judge (AI Dispute Resolution).
    Decides the fate of funds based on damage assessment and AI verdict.
    """

    @staticmethod
    def resolve_dispute(booking_id: int, damage_report: dict, ai_assessment: dict) -> str:
        """
        Main Judgment Function.
        Returns the decision code: RELEASE_TO_CUSTOMER, FULL_REFUND, BLOCK_USER, PARTIAL_REFUND, RELEASE_TO_OWNER
        """
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return "ERROR_BOOKING_NOT_FOUND"

        # --- Rule 1: Owner Protection (Minor Damages) ---
        # 🛡️ SOVEREIGN BALANCE: Even minor damage needs compensation.
        # Instead of releasing everything to customer, we move to partial refund/mediation.
        if booking.product.owner and damage_report.get('severity') == 'minor':
             return 'PARTIAL_REFUND'

        # --- Rule 2: Critical Damage -> Release to Owner ---
        # If the product is critically damaged, the owner should receive the escrow funds.
        if damage_report.get('severity') == 'critical':
            return 'RELEASE_TO_OWNER' 

        # --- Rule 3: AI Fraud Detection ---
        if ai_assessment.get('verdict') == 'FRAUD_DETECTED':
            return 'BLOCK_USER'

        # --- Default: Partial Refund / Negotiation ---
        return 'PARTIAL_REFUND'

    @staticmethod
    def execute_dispute_judgment(booking_id: int, decision: str):
        """
        Execute the judgment: Move funds via EscrowService.
        """
        booking = Booking.objects.get(id=booking_id)
        
        from django.core.exceptions import ValidationError
        
        if decision == 'RELEASE_TO_OWNER':
            if not getattr(booking.product, 'owner', None):
                return 'ERROR_OWNERLESS_PRODUCT'
            EscrowService.release_funds(booking)
            
        elif decision == 'FULL_REFUND':
             EscrowService.refund_funds(booking, reason="Dispute Resolution: Fully Refunded")
        
        elif decision == 'RELEASE_TO_CUSTOMER':
             # Same as refunding the held amount back to customer
             EscrowService.refund_funds(booking, reason="Dispute Resolution: Released to Customer")

        elif decision == 'BLOCK_USER':
            # Logic to block user
            booking.user.is_active = False 
            booking.user.save()
            booking.notes += " [User Blocked due to Fraud Detection]"
            booking.save()
        
        return booking.escrow_status
