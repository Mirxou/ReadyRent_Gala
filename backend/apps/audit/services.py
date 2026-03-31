import structlog
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog

logger = structlog.get_logger("audit.services")

class AuditService:
    @staticmethod
    def log(actor, action, target, ip_address=None, changes=None, metadata=None):
        """
        Creates an immutable audit log entry.
        """
        if changes is None:
            changes = {}
        if metadata is None:
            metadata = {}

        try:
            # Handle AnonymousUser or None
            actor_instance = actor if actor and actor.is_authenticated else None
            
            AuditLog.objects.create(
                actor=actor_instance,
                action=action,
                content_object=target,
                ip_address=ip_address,
                changes=changes,
                metadata=metadata
            )
        except Exception as e:
            # 🚨 CRITICAL: Audit logging should typically NOT break the main flow,
            # but in a banking system, failure to log might be a stop-the-world event.
            # For now, we log the error to system error output.
            logger.critical(
                "audit_logging_failed",
                action=action,
                error=str(e),
                exc_info=True
            )
