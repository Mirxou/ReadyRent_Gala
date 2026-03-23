"""
Async Tasks Module for Disputes App

Provides background thread helpers to move blocking operations off the request path.

Usage:
    from apps.disputes.async_tasks import async_create_evidence_log, async_embed_judgment
    
    # In signals or views
    async_create_evidence_log(action="BOOKING_CREATED", actor=user, booking=booking)
"""

import threading
from django.db import transaction


def async_create_evidence_log(action, actor, booking=None, dispute=None, metadata=None, context_snapshot=None):
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
    
    Returns:
        None (fire-and-forget)
    """
    def _create():
        from apps.disputes.models import EvidenceLog
        try:
            EvidenceLog.objects.create(
                action=action,
                actor=actor,
                booking=booking,
                dispute=dispute,
                metadata=metadata or {},
                context_snapshot=context_snapshot or {}
            )
            print(f"✅ ASYNC VAULT: Logged {action}")
        except Exception as e:
            # Log error but don't crash the main application
            print(f"⚠️ ASYNC EVIDENCE VAULT ERROR: {e}")
            # In production, this should go to proper logging system
    
    # Run in background thread AFTER transaction commits
    # This prevents creating evidence logs for failed transactions
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
        from apps.disputes.models import Judgment
        from apps.disputes.precedent_search_service import PrecedentSearchService
        
        try:
            judgment = Judgment.objects.get(id=judgment_id)
            if judgment.status == 'final':
                PrecedentSearchService.embed_judgment(judgment)
                print(f"✅ ASYNC EMBED: Judgment #{judgment_id} embedded successfully")
        except Judgment.DoesNotExist:
            print(f"⚠️ ASYNC EMBED ERROR: Judgment #{judgment_id} not found")
        except Exception as e:
            print(f"⚠️ ASYNC EMBED ERROR for Judgment #{judgment_id}: {e}")
            # In production, this should go to proper logging system
    
    # Delay by N seconds to batch near-simultaneous requests
    # This reduces load during bulk operations
    threading.Timer(delay_seconds, _embed).start()
    print(f"🕐 ASYNC EMBED: Scheduled for Judgment #{judgment_id} in {delay_seconds}s")
