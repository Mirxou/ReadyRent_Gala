
from django.db import transaction
from django.utils import timezone
from ..models import Dispute, Judgment, EvidenceLog

class AdjudicationService:
    """
    Formalizes the issuance of judicial verdicts.
    Ensures procedural fairness and immutability of the final ruling.
    """

    @staticmethod
    def issue_verdict(dispute, judge, verdict_type, ruling_text, awarded_amount=0):
        """
        Creates a Judgment record and updates Dispute status.
        Triggers the "Justice Receipt" transition to JUDGMENT_PROVISIONAL.
        """
        # 1. State Guard: Only admissible disputes under review can be judged
        if dispute.status not in ['admissible', 'under_review']:
            raise ValueError(f"Dispute {dispute.id} is in status {dispute.status} and cannot receive judgment.")

        with transaction.atomic():
            # 2. Permanent Judgment Creation
            judgment = Judgment.objects.create(
                dispute=dispute,
                judge=judge,
                verdict=verdict_type,
                ruling_text=ruling_text,
                awarded_amount=awarded_amount,
                status='provisional'
            )

            # 3. Dispute State Transition
            dispute.status = 'judgment_provisional'
            dispute.save()

            # 4. LOG: Formal Judgment (The Black Box)
            EvidenceLog.objects.create(
                action="JUDGMENT_ISSUED",
                actor=judge,
                dispute=dispute,
                metadata={
                    "judgment_id": judgment.id,
                    "verdict": verdict_type,
                    "awarded": str(awarded_amount)
                }
            )

            return judgment

    @staticmethod
    def finalize_judgment(judgment):
        """
        Closes the appeal window and makes the judgment final.
        """
        with transaction.atomic():
            judgment.status = 'final'
            judgment.finalized_at = timezone.now()
            judgment.save()

            dispute = judgment.dispute
            dispute.status = 'judgment_final'
            dispute.save()

            # Phase 38: Publish to Public Ledger
            from .anonymization_service import AnonymizationService
            AnonymizationService.anonymize(judgment)

            # Phase 39: Automated Restitution (Financial Layer)
            from .restitution_service import RestitutionService
            RestitutionService.process_restitution(judgment)

            # LOG: Finality
            EvidenceLog.objects.create(
                action="JUDGMENT_FINALIZED",
                actor=None, # System automation
                dispute=dispute,
                metadata={"judgment_id": judgment.id}
            )

    @staticmethod
    def force_resolution(dispute, judge, verdict_type, ruling_text, awarded_amount=0, justification="Sovereign Override"):
        """
        Phase 42: The Sovereign Override (Red Button).
        
        Forcefully resolves a dispute, bypassing:
        - Appeal windows
        - Admissibility checks
        - Provisional status
        
        Used only by High Court / Admin for deadlocked or special cases.
        """
        with transaction.atomic():
            # 1. Immediate Final Judgment
            judgment = Judgment.objects.create(
                dispute=dispute,
                judge=judge,
                verdict=verdict_type,
                ruling_text=ruling_text,
                awarded_amount=awarded_amount,
                status='final', # Skip provisional
                finalized_at=timezone.now()
            )

            dispute.status = 'judgment_final'
            dispute.resolution = f"SOVEREIGN OVERRIDE: {justification}"
            dispute.resolved_at = timezone.now()
            dispute.resolved_by = judge
            dispute.save()

            # 2. LOG: The Override Event (Transparency)
            EvidenceLog.objects.create(
                action="SOVEREIGN_OVERRIDE",
                actor=judge,
                dispute=dispute,
                metadata={
                    "judgment_id": judgment.id,
                    "justification": justification,
                    "verdict": verdict_type
                }
            )

            # 3. Trigger Downstream Effects Immediately
            # Phase 38: Public Ledger
            from .anonymization_service import AnonymizationService
            AnonymizationService.anonymize(judgment)

            # Phase 39: Restitution
            from .restitution_service import RestitutionService
            RestitutionService.process_restitution(judgment)

            return judgment
