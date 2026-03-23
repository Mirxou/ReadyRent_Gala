from django.utils import timezone
from .models import SettlementOffer, EvidenceLog
from django.core.exceptions import PermissionDenied

class SovereignGateService:
    """
    The Gatekeeper.
    Manages human-in-the-loop approvals for high-value AI decisions.
    """
    
    @staticmethod
    def approve_offer(offer_id: int, admin_user) -> SettlementOffer:
        """
        Approve a pending settlement offer, making it visible to parties.
        """
        # 1. Verify Permissions (Basic check, real RBAC handled by views)
        if not admin_user.is_staff:
            raise PermissionDenied("Only Sovereign Staff can open the Gate.")
            
        try:
            offer = SettlementOffer.objects.get(id=offer_id)
        except SettlementOffer.DoesNotExist:
            raise ValueError(f"Offer #{offer_id} not found.")
            
        if offer.status != SettlementOffer.Status.PENDING_REVIEW:
            # Idempotent success if already visible
            if offer.status == SettlementOffer.Status.VISIBLE:
                return offer
            raise ValueError(f"Cannot approve offer in status: {offer.status}")
            
        # 2. Gate Opening
        offer.status = SettlementOffer.Status.VISIBLE
        offer.approved_by = admin_user
        offer.approved_at = timezone.now()
        offer.save()
        
        # 3. Log the Decree
        EvidenceLog.objects.create(
            action="SOVEREIGN_GATE_OPENED",
            actor=admin_user,
            dispute=offer.session.dispute,
            booking=offer.session.dispute.booking,
            metadata={
                "offer_id": offer.id,
                "amount": str(offer.amount),
                "reason": "High Value Offer Approved"
            }
        )
        
        return offer

    @staticmethod
    def reject_offer(offer_id: int, admin_user, reason: str) -> SettlementOffer:
        """
        Reject a pending offer. The AI must try again or case goes to trial.
        """
        if not admin_user.is_staff:
            raise PermissionDenied("Only Sovereign Staff can close the Gate.")
            
        offer = SettlementOffer.objects.get(id=offer_id)
        
        offer.status = SettlementOffer.Status.REJECTED
        offer.save()
        
        EvidenceLog.objects.create(
            action="SOVEREIGN_GATE_CLOSED",
            actor=admin_user,
            dispute=offer.session.dispute,
            metadata={
                "offer_id": offer.id,
                "amount": str(offer.amount),
                "rejection_reason": reason
            }
        )
        
        return offer
