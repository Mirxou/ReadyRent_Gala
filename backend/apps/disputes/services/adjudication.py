"""
Sovereign Adjudication Service
Handles the lifecycle of judgments, appeals, and escrow settlements.
Ref: THE_FOUNDER_VISION § Judicial Stability
"""
import logging
from django.db import transaction
from django.utils import timezone
from apps.payments.models import EscrowHold
from apps.payments.engine import EscrowEngine, OwnerlessProductError
from apps.payments.states import EscrowState
from apps.bookings.models import Refund
from decimal import Decimal

logger = logging.getLogger("apps.disputes.adjudication")

class AdjudicationService:
    @staticmethod
    def finalize_judgment(judgment, actor=None):
        """
        Transitions a provisional judgment to final and triggers financial settlement.
        🛡️ SOVEREIGN IDEMPOTENCY: Ensures financial execution runs exactly once.
        """
        actor = actor or judgment.judge

        with transaction.atomic():
            # Reload to ensure fresh state
            judgment.refresh_from_db()
            
            # If already finalized, we still check if financial settlement was completed
            # In a production system, we'd check a 'settlement_status' field.
            # For now, we use the dispute status as a proxy.
            dispute = judgment.dispute
            
            if judgment.status != 'final':
                judgment.status = 'final'
                judgment.finalized_at = judgment.finalized_at or timezone.now()
                if actor:
                    judgment.judge = actor
                judgment.save()

            if dispute.status != 'judgment_final' and dispute.status != 'closed':
                dispute.status = 'judgment_final'
                dispute.save(update_fields=['status'])

                normalized_verdict = judgment.__class__.canonical_verdict(judgment.verdict)

                # Trigger Financial Engine
                if normalized_verdict == 'split':
                    AdjudicationService._execute_split_verdict(judgment)
                elif normalized_verdict == 'favor_tenant':
                    AdjudicationService._execute_full_release(judgment, to_party='tenant')
                elif normalized_verdict == 'favor_owner':
                    AdjudicationService._execute_full_release(judgment, to_party='owner')
            else:
                logger.warning(f"Financial settlement for judgment {judgment.id} already processed or dispute closed.")

        logger.info(f"Judgment {judgment.id} finalized/verified by {getattr(actor, 'email', 'system')}")
        return judgment

    @staticmethod
    @transaction.atomic
    def _execute_split_verdict(judgment):
        """Internal: Coordinates split escrow release"""
        if not judgment.split_renter_percentage:
            if judgment.awarded_amount and judgment.dispute.booking and judgment.dispute.booking.total_price:
                judgment.split_renter_percentage = (Decimal(str(judgment.awarded_amount)) / Decimal(str(judgment.dispute.booking.total_price))) * Decimal('100')
            else:
                judgment.split_renter_percentage = Decimal('50')

        try:
            hold = EscrowHold.objects.get(booking=judgment.dispute.booking)
            EscrowEngine.execute_split_release(
                hold_id=hold.id,
                renter_percentage=judgment.split_renter_percentage,
                judgment_id=judgment.id,
                reason=f"Judicial Split Verdict (Judgment #{judgment.id})",
                actor=judgment.judge
            )
        except EscrowHold.DoesNotExist:
            logger.error(f"Cannot execute split verdict {judgment.id}: no EscrowHold found.")
            booking = judgment.dispute.booking
            booking.escrow_status = 'RELEASED'
            booking.save()
            refund_amount = Decimal(str(judgment.awarded_amount or 0)).quantize(Decimal('0.01'))
            if refund_amount > 0:
                Refund.objects.get_or_create(
                    booking=booking,
                    amount=refund_amount,
                    reason=f"Judicial Split Verdict (Judgment #{judgment.id})",
                    defaults={'status': 'completed'}
                )
        except OwnerlessProductError as e:
            # 🛡️ SOVEREIGN INTEGRITY: المالك حُذف — لا يمكن تحويل حصة الملك تلقائياً.
            logger.critical(
                "adjudication_split_verdict_ownerless_halt",
                judgment_id=judgment.id,
                dispute_id=judgment.dispute.id,
                error=str(e),
                action_required="MANUAL_TREASURY_RECONCILIATION"
            )
            # النزاع لا يتوقف — يتم التسجيل للمراجعة اليدوية للأموال.

    @staticmethod
    def _execute_full_release(judgment, to_party='tenant'):
        """Internal: Coordinates full escrow release or refund"""
        try:
            hold = EscrowHold.objects.get(booking=judgment.dispute.booking)
            target_state = EscrowState.REFUNDED if to_party == 'tenant' else EscrowState.RELEASED
            EscrowEngine.transition(
                hold_id=hold.id,
                target_state=target_state,
                reason=f"Judicial Verdict ({judgment.id})",
                actor=judgment.judge,
            )
        except EscrowHold.DoesNotExist:
            logger.error(f"Cannot execute verdict {judgment.id}: no EscrowHold found.")
            booking = judgment.dispute.booking
            if to_party == 'tenant':
                booking.escrow_status = 'REFUNDED'
                refund_amount = Decimal(str(booking.total_price or 0)).quantize(Decimal('0.01'))
                if refund_amount > 0:
                    Refund.objects.get_or_create(
                        booking=booking,
                        amount=refund_amount,
                        reason=f"Judicial Verdict ({judgment.id})",
                        defaults={'status': 'completed'}
                    )
            else:
                booking.escrow_status = 'RELEASED'
            booking.save()
        except OwnerlessProductError as e:
            # 🛡️ SOVEREIGN INTEGRITY: المالك حُذف — لا يمكن تحويل الأموال تلقائياً.
            logger.critical(
                "adjudication_full_release_ownerless_halt",
                judgment_id=judgment.id,
                dispute_id=judgment.dispute.id,
                to_party=to_party,
                error=str(e),
                action_required="MANUAL_TREASURY_RECONCILIATION"
            )
            # النزاع لا يتوقف برمجياً — يتم تسجيل الواقعة للمراجعة اليدوية من قبل الخزينة.


    @staticmethod
    @transaction.atomic
    def issue_verdict(dispute, judge, verdict_type, ruling_text, awarded_amount=0, split_percentage=None):
        """
        Creates a Judgment for a given dispute and initializes the adjudication process.
        Ref: THE_FOUNDER_VISION § Judicial Stability
        """
        from apps.disputes.models import Judgment

        judgment = Judgment.objects.create(
            dispute=dispute,
            judge=judge,
            verdict=verdict_type,
            ruling_text=ruling_text,
            awarded_amount=awarded_amount,
            split_renter_percentage=split_percentage,
            status='provisional'
        )

        # Update dispute status
        dispute.status = 'judgment_provisional'
        dispute.save()

        logger.info(f"Provisional Judgment {judgment.id} issued for Dispute {dispute.id}")
        return judgment

    @staticmethod
    @transaction.atomic
    def force_resolution(dispute, judge, verdict_type, ruling_text, justification, awarded_amount=0):
        """
        Phase 42: Sovereign Override (Red Button).
        Forcefully resolves a dispute with mandatory justification record.
        """
        from apps.disputes.models import Judgment, EvidenceLog

        judgment = Judgment.objects.create(
            dispute=dispute,
            judge=judge,
            verdict=verdict_type,
            ruling_text=f"SOVEREIGN OVERRIDE: {ruling_text}\nJustification: {justification}",
            awarded_amount=awarded_amount,
            status='final',
            finalized_at=timezone.now()
        )

        # Log to the Evidence Vault (WORM)
        EvidenceLog.objects.create(
            dispute=dispute,
            action='SOVEREIGN_OVERRIDE_EXECUTED',
            actor=judge,
            metadata={
                'judgment_id': judgment.id,
                'justification': justification,
                'verdict': verdict_type
            }
        )

        # Direct financial finalization - handles state transition and escrow
        AdjudicationService.finalize_judgment(judgment, judge)

        logger.warning(f"SOVEREIGN OVERRIDE: Dispute {dispute.id} forcefully closed by {judge.email}")
        return judgment
