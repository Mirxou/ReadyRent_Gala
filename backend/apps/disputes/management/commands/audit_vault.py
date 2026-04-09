from django.core.management.base import BaseCommand
from ...services.vault_audit import VaultAuditor
from ...models import EvidenceLog
from ...models import SystemFlag
import json

class Command(BaseCommand):
    help = 'Verify the cryptographic integrity of the Evidence Vault (Phase 18 Chain).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting Sovereign Vault Integrity Audit...'))
        
        result = VaultAuditor.audit_full_chain()
        
        if result['status'] == 'clean':
            self.stdout.write(self.style.SUCCESS(
                f"✅ Vault Integrity Verified. {result['total_logs']} logs checked. No corruption found."
            ))
        else:
            self.stdout.write(self.style.ERROR(
                f"❌ CRITICAL ERROR: Vault Corruption Detected! {result['error_count']} logs are compromised."
            ))
            for error in result['errors']:
                self.stdout.write(self.style.WARNING(
                    f"  - Error at Log #{error['id']}: {error['detail']}"
                ))
            
            # Exit with error code if corruption found
            import sys
            sys.exit(1)
