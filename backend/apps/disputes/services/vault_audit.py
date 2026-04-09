import hashlib
import json
import structlog
from django.core.serializers.json import DjangoJSONEncoder
from ..models import EvidenceLog

logger = structlog.get_logger("vault_audit")

class VaultIntegrityError(Exception):
    """Raised when the Evidence Vault chain is corrupted."""
    pass

class VaultAuditor:
    """
    The Sentinel of Truth.
    Verifies the cryptographic integrity of the EvidenceLog chain.
    """

    @classmethod
    def audit_full_chain(cls):
        """
        Verify every log in the database from oldest to newest.
        Complexity: O(N) where N is number of EvidenceLogs.
        """
        logs = EvidenceLog.objects.order_by('id')
        total_count = logs.count()
        
        logger.info("vault_audit_started", total_logs=total_count)
        
        previous_hash = None
        corrupted_logs = []
        verified_count = 0

        for log in logs:
            # 1. Check Chain Link
            if log.previous_hash != previous_hash:
                error_msg = f"Chain Break at Log #{log.id}: Expected prev_hash {previous_hash}, found {log.previous_hash}"
                logger.error("vault_chain_break", log_id=log.id, expected=previous_hash, actual=log.previous_hash)
                corrupted_logs.append({"id": log.id, "error": "chain_break", "detail": error_msg})

            # 2. Re-calculate & Verify Current Hash
            calculated_hash = log.generate_integrity_hash()
            if log.hash != calculated_hash:
                error_msg = f"Hash Mismatch at Log #{log.id}: Record hash {log.hash}, but re-calculation yields {calculated_hash}"
                logger.error("vault_hash_mismatch", log_id=log.id, recorded=log.hash, calculated=calculated_hash)
                corrupted_logs.append({"id": log.id, "error": "hash_mismatch", "detail": error_msg})

            # Update for next iteration
            previous_hash = log.hash
            verified_count += 1

        status = "invalid" if corrupted_logs else "valid"
        logger.info("vault_audit_completed", status=status, verified=verified_count, errors=len(corrupted_logs))

        return {
            "status": status,
            "total_logs": total_count,
            "verified_logs": verified_count,
            "error_count": len(corrupted_logs),
            "errors": corrupted_logs,
            "last_hash": previous_hash if previous_hash else 'N/A'
        }

    @classmethod
    def verify_log(cls, log_id: int):
        """Verify a single log's internal hash integrity."""
        try:
            log = EvidenceLog.objects.get(id=log_id)
            calculated_hash = log.generate_integrity_hash()
            is_valid = log.hash == calculated_hash
            
            return {
                "id": log.id,
                "is_valid": is_valid,
                "recorded_hash": log.hash,
                "calculated_hash": calculated_hash
            }
        except EvidenceLog.DoesNotExist:
            return None
