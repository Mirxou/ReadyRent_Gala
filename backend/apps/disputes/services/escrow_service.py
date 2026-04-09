from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from ..models import Judgment, EvidenceLog

class EscrowService:
    """
    The Treasury's Executor.
    Handles the final financial distribution based on Final Judgments.
    
    User Feedback Integration:
    - Idempotent execution (critical for financial integrity)
    - Freeze check (no execution during appeals)
    - Evidence trail (every execution logged)
    """

    @staticmethod
    def execute_judgment(judgment: Judgment) -> dict:
        """
        Execute a FINAL judgment by distributing escrow funds.
        
        Rules:
        1. Judgment must be FINAL (not provisional, not overturned)
        2. No pending appeals with frozen funds
        3. Idempotent (can be called multiple times safely)
        
        Returns:
            dict: Execution result with transaction details
        """
        # Validation: Only Final Judgments
        if judgment.status != 'final':
            return {
                "success": False,
                "error": "Cannot execute non-final judgment",
                "judgment_id": judgment.id,
                "status": judgment.status
            }
        
        # Check for Appeal Freeze
        if hasattr(judgment, 'appeal') and judgment.appeal.is_fund_frozen:
            return {
                "success": False,
                "error": "Funds are frozen due to pending appeal",
                "judgment_id": judgment.id
            }
        
        with transaction.atomic():
            # Idempotency Check: Has this judgment already been executed?
            existing_execution = EvidenceLog.objects.filter(
                action__startswith="ESCROW_EXECUTED",
                metadata__judgment_id=judgment.id
            ).first()
            
            if existing_execution:
                return {
                    "success": True,
                    "already_executed": True,
                    "judgment_id": judgment.id,
                    "message": "Judgment was already executed previously.",
                    "execution_timestamp": existing_execution.timestamp
                }
            
            # Financial Logic (Simulated for now)
            booking = judgment.dispute.booking
            tenant = booking.user
            owner = getattr(booking.product, 'owner', None)
            awarded_amount = judgment.awarded_amount
            
            tx_result = {}
            
            verdict = Judgment.canonical_verdict(judgment.verdict)

            if verdict == 'favor_tenant':
                # Refund tenant
                tx_result = {
                    "recipient": tenant.username,
                    "amount": awarded_amount,
                    "type": "REFUND"
                }
            elif verdict == 'favor_owner':
                if not owner:
                    return {
                        "success": False,
                        "error": "Cannot release to owner for an ownerless product",
                        "judgment_id": judgment.id,
                    }
                # Pay owner
                tx_result = {
                    "recipient": owner.username,
                    "amount": awarded_amount,
                    "type": "PAYMENT"
                }
            elif verdict == 'split':
                if not owner:
                    return {
                        "success": False,
                        "error": "Cannot split escrow for an ownerless product",
                        "judgment_id": judgment.id,
                    }
                # Split decision (simplified: 50/50)
                tx_result = {
                    "tenant_refund": awarded_amount / 2,
                    "owner_payment": awarded_amount / 2,
                    "type": "SPLIT"
                }
            elif verdict == 'dismissed':
                # No financial transfer
                tx_result = {
                    "type": "NO_TRANSFER",
                    "message": "Dispute dismissed, no financial action."
                }
            
            # TODO: In production, integrate with actual payment gateway
            # payment_gateway.transfer(...)
            
            # Log Execution (Immutable Proof)
            EvidenceLog.objects.create(
                action=f"ESCROW_EXECUTED: {judgment.verdict.upper()}",
                actor=None,  # System action
                booking=booking,
                dispute=judgment.dispute,
                metadata={
                    "judgment_id": judgment.id,
                    "transaction": tx_result,
                    "awarded_amount": str(awarded_amount)
                },
                context_snapshot={
                    "execution_timestamp": timezone.now().isoformat(),
                    "judgment_status": judgment.status
                }
            )
            
            return {
                "success": True,
                "judgment_id": judgment.id,
                "transaction": tx_result,
                "message": "Judgment executed successfully. Funds distributed."
            }
