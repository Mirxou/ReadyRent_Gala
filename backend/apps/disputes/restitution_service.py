from django.utils.translation import gettext_lazy as _
import logging

logger = logging.getLogger(__name__)

class RestitutionService:
    """
    Phase 39: Automated Restitution.
    The "Financial Enforcer" that executes the Sovereign Verdict.
    
    Links the Judicial Domain (Judgments) to the Financial Domain (Payments/Escrow).
    """
    
    @staticmethod
    def process_restitution(judgment):
        """
        Executes financial actions based on the Judgment verdict.
        Called automatically by AdjudicationService.finalize_judgment().
        """
        # Lazy import to avoid AppRegistryNotReady
        from apps.payments.services import PaymentService
        """
        Executes financial actions based on the Judgment verdict.
        Called automatically by AdjudicationService.finalize_judgment().
        """
        booking = judgment.dispute.booking
        if not booking:
            logger.warning(f"Judgment #{judgment.id} has no associated booking. Skipping restitution.")
            return
            
        logger.info(f"Processing restitution for Judgment #{judgment.id} (Verdict: {judgment.verdict})")

        try:
            # Phase 3: Engine Transition context
            from apps.payments.models import EscrowHold
            from apps.payments.engine import EscrowEngine
            from apps.payments.states import EscrowState
            from apps.payments.context import EscrowEngineContext
            
            escrow_hold = EscrowHold.objects.get(booking=booking)

            if judgment.verdict == 'favor_owner':
                # Owner wins -> Release full escrow to owner
                with EscrowEngineContext.activate():
                    EscrowEngine.transition(
                        hold_id=escrow_hold.id,
                        target_state=EscrowState.RELEASED,
                        reason=f"Judgment #{judgment.id} Verdict: Favor Owner",
                        actor=judgment.resolved_by # Judge
                    )
                logger.info(f"Escrow released via Engine for Judgment #{judgment.id}")

            elif judgment.verdict == 'favor_tenant':
                # Tenant wins -> Refund full amount to tenant
                with EscrowEngineContext.activate():
                     EscrowEngine.transition(
                        hold_id=escrow_hold.id,
                        target_state=EscrowState.REFUNDED,
                        reason=f"Judgment #{judgment.id} Verdict: Favor Tenant",
                        actor=judgment.resolved_by
                    )
                logger.info(f"Full refund processed via Engine for Judgment #{judgment.id}")

            elif judgment.verdict == 'split':
                # Split decision -> Partial Refund / Partial Release
                # Wait, Engine Spec v1.2 says NO PARTIAL RELEASES (Binary).
                # Auditor approved Binary only for Phase 3.
                # "Keep it binary for Phase 3. Add splits in Phase 4 if needed."
                # Does this mean we cannot support split verdicts yet?
                # Or do we refund the tenant portion and release the rest?
                # But `EscrowEngine.transition` moves the WHOLE state to RELEASED or REFUNDED.
                # And `_apply_side_effects` moves `hold.amount`.
                # If we want a split, we need to change `hold.amount` or support split transactions.
                # Invariant #1: Immutability of Hold Amount.
                
                # CRITICAL: We cannot support SPLIT within the Engine yet without violating spec.
                # Option A: Fail split verdicts for now.
                # Option B: Manual partial refund via PaymentService (bypassing Engine money move?) NO.
                # Option C: Refund tenant (partial), then Release owner (remainder).
                # BUT Engine transitions are Terminal. RELEASED and REFUNDED are Terminal.
                # You can't do both.
                
                # STOP GAP: We log warning and default to Favor Owner or Tenant based on majority?
                # Or we implement partial refund logic OUTSIDE the engine state machine?
                # i.e. Refund X, but keep state HELD, then Release remaining?
                # Spec Table: HELD -> REFUNDED. Side effect: Credit Tenant Wallet (Exact Amount).
                # Engine `_apply_side_effects` uses `hold.amount`.
                
                # DECISION: We treat Split as manual intervention required for Phase 3.
                # OR, we update Engine to accept amount? No, spec says Exact Amount.
                
                logger.error(f"Split verdict for Judgment #{judgment.id} NOT SUPPORTED in Phase 3 Engine. Requires Manual Intervention.")
                # We do not transition state. Admin must resolve.
                
            else:
                logger.warning(f"Unknown verdict type '{judgment.verdict}' for Judgment #{judgment.id}")

        except Exception as e:
            logger.exception(f"Critical error in RestitutionService for Judgment #{judgment.id}: {e}")
            # Re-raise to propagate to caller — ensures transaction.atomic rollback
            raise
