import hashlib
import json
from django.utils import timezone
from django.template.loader import render_to_string
from ..models import EvidenceLog
from .vault_audit import VaultAuditor

class LedgerExportService:
    """
    Sovereign Ledger Export (Phase 7).
    Generates a "Proof of Truth" certificate for judicial oversight.
    """

    @staticmethod
    def generate_integrity_certificate(actor=None):
        """
        Generates a summary of the current vault integrity.
        Includes BLAKE2b hashes and chain verification status.
        """
        audit_result = VaultAuditor.audit_full_chain()
        
        # Manifest Data for Cryptographic Signature
        manifest = {
            "timestamp": timezone.now().isoformat(),
            "verifier": actor.email if actor else "System High Court",
            "audit_summary": audit_result,
            "security_clearance": "Sovereign Elite"
        }
        
        # Generate a "Certificate Hash" of this specific report
        manifest_json = json.dumps(manifest, sort_keys=True)
        cert_hash = hashlib.blake2b(manifest_json.encode()).hexdigest()
        
        context = {
            "manifest": manifest,
            "cert_hash": cert_hash,
            "is_valid": audit_result['is_valid'],
            "verified_count": audit_result['verified_count'],
            "total_count": audit_result['total_count'],
            "last_hash": audit_result['last_hash'],
            "current_time": timezone.now()
        }
        
        # Render the "Executive Certificate" template
        # Note: We'll need to create this template in templates/sovereign/certificate.html
        certificate_html = render_to_string('sovereign/certificate.html', context)
        
        return {
            "html": certificate_html,
            "cert_hash": cert_hash,
            "timestamp": manifest["timestamp"]
        }
