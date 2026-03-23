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
        # If the product belongs to an owner (P2P) and damage is minor, we favor the customer (or insurance handles it)
        # We don't want to block the customer's funds for minor scratches if they are trustworthy.
        if booking.product.owner and damage_report.get('severity') == 'minor':
             return 'RELEASE_TO_CUSTOMER'

        # --- Rule 2: Critical Damage -> Full Refund (to Owner/Escrow logic?) ---
        # WAIT: If damage is critical, the OWNER should get the money (Deposit), NOT the customer.
        # The prompt said "FULL_REFUND" (to customer), but logically if I break the item, I shouldn't get my money back.
        # However, looking at the user's prompt: "الضرر الكامل يرجع المال للزبون" -> "Full damage returns money to customer".
        # This implies it's a "Refund" context (maybe the item arrived broken?).
        # BUT, usually "Damage Report" is post-rental.
        # Let's follow the user's specified logic exactly for now ("The Customer is King" approach maybe?), 
        # or interpretation: "Product Failed" -> Refund Customer.
        if damage_report.get('severity') == 'critical':
            return 'FULL_REFUND' 

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
        
        if decision == 'RELEASE_TO_OWNER':
            # EscrowService.release_funds(booking) # Assuming this releases to beneficiary
            # Directly modifying state for now as consistent with user prompt, but best to use service
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
