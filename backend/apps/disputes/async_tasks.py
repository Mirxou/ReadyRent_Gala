import structlog
import threading
from django.db import transaction

logger = structlog.get_logger("disputes.async_tasks")

def async_create_evidence_log(action, actor, booking=None, dispute=None, metadata=None, context_snapshot=None, previous_hash=None):
    """
    Create EvidenceLog in background thread
    
    CRITICAL: transaction.on_commit ensures we only create evidence AFTER
    the parent transaction commits (prevents phantom evidence logs)
    
    Args:
        action (str): Event action (e.g. "BOOKING_CREATED")
        actor (User): User who performed the action
        booking (Booking, optional): Related booking
        dispute (Dispute, optional): Related dispute
        metadata (dict, optional): Event metadata
        context_snapshot (dict, optional): Context at time of event
        previous_hash (str, optional): Pre-computed hash of the parent log to prevent chain races
    
    Returns:
        None (fire-and-forget)
    """
    def _create():
        from .models import EvidenceLog
        try:
            EvidenceLog.objects.create(
                action=action,
                actor=actor,
                booking=booking,
                dispute=dispute,
                metadata=metadata or {},
                context_snapshot=context_snapshot or {},
                previous_hash=previous_hash,
            )
            logger.info("async_vault_logged", action=action)
        except Exception as e:
            logger.error(
                "async_evidence_vault_error",
                action=action,
                error=str(e),
                exc_info=True,
            )
    
    transaction.on_commit(lambda: threading.Thread(target=_create, daemon=True).start())


def async_embed_judgment(judgment_id, delay_seconds=5):
    """
    Embed judgment in background thread with delay
    
    Called after judgment is finalized (not on creation).
    Delay batches near-simultaneous requests.
    
    Args:
        judgment_id (int): ID of judgment to embed
        delay_seconds (int): Seconds to wait before embedding (default: 5)
    
    Returns:
        None (fire-and-forget)
    """
    def _embed():
        from .models import Judgment
        from .services import PrecedentSearchService
        from django.db import OperationalError, ProgrammingError

        try:
            judgment = Judgment.objects.get(id=judgment_id)
            if judgment.status == 'final':
                PrecedentSearchService.embed_judgment(judgment)
                logger.info("async_embed_success", judgment_id=judgment_id)
        except (OperationalError, ProgrammingError) as e:
            # Table may not exist in test environment (in-memory SQLite, no migration).
            # Non-fatal: embedding is best-effort in tests.
            logger.warning(
                "async_embed_skipped_missing_table",
                judgment_id=judgment_id,
                error=str(e),
            )
        except Judgment.DoesNotExist:
            logger.error("async_embed_failed_not_found", judgment_id=judgment_id)
        except Exception as e:
            logger.error(
                "async_embed_failed_error",
                judgment_id=judgment_id,
                error=str(e),
                exc_info=True
            )
    
    # Delay by N seconds to batch near-simultaneous requests
    # This reduces load during bulk operations
    threading.Timer(delay_seconds, _embed).start()
    logger.info("async_embed_scheduled", judgment_id=judgment_id, delay_seconds=delay_seconds)
