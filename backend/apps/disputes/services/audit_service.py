from django.db import transaction
from ..models import EvidenceLog
from apps.payments.states import EscrowState
import logging

logger = logging.getLogger(__name__)

class AuditService:
    """
    Sovereign Audit Service.
    Wraps the Immutable EvidenceLog (The Vault).
    Enforces strict logging requirements for the Escrow Engine.
    """
    
    @staticmethod
    def log(entity, old_state, new_state, reason, actor=None, context=None):
        """
        Create a new EvidenceLog entry.
        
        Args:
            entity: The object being modified (e.g. EscrowHold)
            old_state: Previous state value
            new_state: New state value
            reason: The trigger/reason for the change
            actor: User object performing the action (optional)
            context: Additional metadata dict (optional)
            
        Returns:
            EvidenceLog instance if successful.
            
        Raises:
            Exception: If logging fails (to trigger rollback in caller).
        """
        try:
            # Construct Metadata
            metadata = {
                "old_state": str(old_state),
                "new_state": str(new_state),
                "reason": reason,
                "entity_id": entity.id,
                "entity_type": entity.__class__.__name__,
            }
            if context:
                metadata.update(context)

            # Determine Links
            booking = None
            dispute = None
            
            # If entity is EscrowHold, link via booking
            if hasattr(entity, 'booking'):
                booking = entity.booking
            
            # Create the Log
            # Note: valid_action string format is typically "ENTITY_ACTION"
            action_name = f"{entity.__class__.__name__}_{new_state}".upper()
            
            log_entry = EvidenceLog.objects.create(
                action=action_name,
                actor=actor,
                booking=booking,
                dispute=dispute,
                metadata=metadata,
                # context_snapshot can be populated here if needed
            )
            
            logger.info(f"Audit Log Created: {log_entry}")
            return log_entry
            
        except Exception as e:
            logger.error(f"CRITICAL: Failed to create Audit Log: {e}")
            raise e # Propagate to force transaction rollback
