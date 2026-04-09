import structlog
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.bookings.models import Booking
from .models import Dispute, EvidenceLog, Judgment
from .async_tasks import async_create_evidence_log, async_embed_judgment
from .services import DisputeRouter
from constance import config
import json

logger = structlog.get_logger("disputes.signals")

@receiver(post_save, sender=Booking)
def log_booking_event(sender, instance, created, **kwargs):
    """
    Evidence Vault Trigger: Booking State Changes.
    """
    # We only want to log state changes or creation
    # For simplicity in this iteration, we log all saves, 
    # but in production, we should check if status changed.
    
    action = "BOOKING_CREATED" if created else f"BOOKING_UPDATED: {instance.status}"
    
    # Snapshot Context
    context_snapshot = {
        "status": instance.status,
        "total_price": str(instance.total_price),
        "policy_version": "v1.0 (Hardcoded for now)", # TODO: Fetch from actual Policy Versioning
        "risk_score_snapshot": "N/A" # In a real scenario, fetch user's risk score
    }

    # ASYNC VERSION - Non-blocking write
    async_create_evidence_log(
        action=action,
        actor=instance.user,
        booking=instance,
        metadata={
            "booking_id": instance.id,
            "changes": "State Change"
        },
        context_snapshot=context_snapshot
    )

@receiver(post_save, sender=Dispute)
def log_dispute_event(sender, instance, created, **kwargs):
    """
    Evidence Vault Trigger: Dispute Lifecycle.
    """
    action = "DISPUTE_FILED" if created else f"DISPUTE_UPDATED: {instance.status}"
    
    context_snapshot = {
        "status": instance.status,
        "admissibility": instance.admissibility_report,
        "priority": instance.priority
    }

    # Phase 2: Auto-Routing
    if created:
        # 1. Route
        DisputeRouter.route(instance)
        
        # 2. Mediation (Phase 4)
        from .services import MediationService
        MediationService.start_mediation(instance)

    # ASYNC VERSION - Non-blocking write
    async_create_evidence_log(
        action=action,
        actor=instance.user,
        dispute=instance,
        booking=instance.booking,
        metadata={
            "dispute_id": instance.id,
            "title": instance.title
        },
        context_snapshot=context_snapshot
    )


@receiver(post_save, sender=Judgment)
def evaluate_judgment_consistency(sender, instance, created, **kwargs):
    """
    Phase 20: Institutional Memory
    Auto-trigger consistency check when a Judgment is finalized.
    
    User Feedback Integration:
    - Transparency over enforcement
    - Logged, not blocking
    """
    from .services import ConsistencyService
    
    # Only check when judgment reaches FINAL status
    if instance.status == 'final' and instance.finalized_at:
        try:
            # Run consistency evaluation
            report = ConsistencyService.evaluate_judgment(instance)
            
            # Log the report to EvidenceLog
            ConsistencyService.log_consistency_report(instance, report)
            
            # Optional: Log for consistency tracking
            if report.get('consistency_score') is not None:
                score = report['consistency_score']
                recommendation = report['recommendation']
                logger.info(
                    "judgment_consistency_evaluated",
                    judgment_id=instance.id,
                    score=score,
                    recommendation=recommendation
                )
            else:
                msg = report.get('message', 'No precedents')
                logger.info(
                    "judgment_consistency_no_precedents",
                    judgment_id=instance.id,
                    message=msg
                )
            
            # ASYNC: Trigger background embedding for precedent search
            async_embed_judgment(instance.id, delay_seconds=5)
                
        except Exception as e:
            logger.error(
                "judgment_consistency_evaluation_failed",
                judgment_id=instance.id,
                error=str(e),
                exc_info=True
            )
