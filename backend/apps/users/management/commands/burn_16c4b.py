from django.core.management.base import BaseCommand
from django.db import connection
import sys

class Command(BaseCommand):
    help = "Phase 16C.4b: Final Burn mechanism to wipe plaintext emails"

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("  PHASE 16C.4b — THE FINAL BURN")
        self.stdout.write("=" * 60)

        with connection.cursor() as cursor:
            # 1. Verify ciphertext completeness
            cursor.execute("SELECT COUNT(*) FROM users_user WHERE email IS NULL OR email NOT LIKE 'enc:v%'")
            null_cipher = cursor.fetchone()[0]
            
            if null_cipher > 0:
                self.stdout.write(self.style.ERROR(f"❌ STOP: Found {null_cipher} rows where email_ciphertext is missing or invalid."))
                sys.exit(1)
            self.stdout.write(self.style.SUCCESS("✅ [1] Ciphertext completeness verified: 0 unencrypted rows."))

            # 2. Soft wipe
            cursor.execute("""
                UPDATE users_user 
                SET email_plaintext_backup = NULL 
                WHERE email_plaintext_backup IS NOT NULL
            """)
            wiped_count = cursor.rowcount
            self.stdout.write(self.style.SUCCESS(f"✅ [2] Plaintext wiped. Rows updated: {wiped_count}"))

            # 3. Verify wipe
            cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_plaintext_backup IS NOT NULL")
            remaining = cursor.fetchone()[0]
            
            if remaining > 0:
                self.stdout.write(self.style.ERROR(f"❌ STOP: Wipe failed! {remaining} rows still have plaintext."))
                sys.exit(1)
            self.stdout.write(self.style.SUCCESS("✅ [3] Wipe verified: 0 rows have plaintext."))

        self.stdout.write("=" * 60)
        self.stdout.write("  Ready for final migration (RemoveField).")
