"""
Phase 16C — Crypto Recovery Verification Script
================================================
Runs after each deployment to verify the encryption keys are still valid.
Catches 'Orphaned Crypto Dependency' — the silent key loss scenario.

Usage:
    python manage.py verify_crypto_recovery

CRON: Run daily in production to detect key issues before users report them.
Alarm on: any FAIL or any InvalidToken count > 0.
"""
from django.core.management.base import BaseCommand
from apps.core.crypto.normalization import normalize_email
from apps.core.crypto.hashing import compute_pii_hash, get_pii_hash_key
from apps.users.models import User
import random


class Command(BaseCommand):
    help = "Phase 16C: Verify crypto key health — decrypt sample emails and cross-check hashes."

    def add_arguments(self, parser):
        parser.add_argument('--sample', type=int, default=10, help='Rows to sample (default: 10)')

    def handle(self, *args, **options):
        sample_size = options['sample']

        self.stdout.write("=" * 60)
        self.stdout.write("  CRYPTO RECOVERY VERIFICATION")
        self.stdout.write("=" * 60)

        # Validate key availability before touching any data
        try:
            get_pii_hash_key()
        except RuntimeError as e:
            self.stdout.write(self.style.ERROR(f"❌ PII_HASH_KEY missing: {e}"))
            return

        try:
            from apps.core.crypto.fields import _get_encryption_keys, _get_current_version
            _get_encryption_keys()
            _get_current_version()
        except RuntimeError as e:
            self.stdout.write(self.style.ERROR(f"❌ PII_ENCRYPTION_KEY missing: {e}"))
            return

        self.stdout.write("✅ Keys present and loadable.")

        # Sample users with encrypted email
        candidates = list(
            User.objects.filter(email_hash__isnull=False)
            .exclude(email__isnull=True)
            .values_list('pk', flat=True)
        )

        if not candidates:
            self.stdout.write(self.style.WARNING("⚠️  No users with email_hash found."))
            return

        sample_pks = random.sample(candidates, min(sample_size, len(candidates)))

        passed = 0
        failed = 0

        self.stdout.write(f"\n  Sampling {len(sample_pks)} users...\n")

        for pk in sample_pks:
            try:
                user = User.objects.get(pk=pk)

                # Step 1: Decrypt (catches key mismatch / key loss)
                decrypted = user.email
                if not decrypted or '@' not in str(decrypted):
                    self.stdout.write(self.style.ERROR(
                        f"  ❌ id={pk}: decrypt returned invalid value (no '@')"
                    ))
                    failed += 1
                    continue

                # Step 2: Re-hash decrypted and compare to stored hash
                recomputed_hash = compute_pii_hash(normalize_email(decrypted), get_pii_hash_key())

                if recomputed_hash != user.email_hash:
                    self.stdout.write(self.style.ERROR(
                        f"  ❌ id={pk}: hash MISMATCH — "
                        f"hash key or canonicalization may have changed"
                    ))
                    failed += 1
                    continue

                self.stdout.write(self.style.SUCCESS(
                    f"  ✅ id={pk}: decrypt OK, hash consistent"
                ))
                passed += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"  ❌ id={pk}: {type(e).__name__}: {e}"
                ))
                failed += 1

        self.stdout.write(f"\n{'=' * 60}")
        self.stdout.write(f"  Results: {passed}/{len(sample_pks)} PASSED — {failed} FAILED")

        if failed > 0:
            self.stdout.write(self.style.ERROR(
                "  ❌ CRYPTO HEALTH FAILURE — Check PII_ENCRYPTION_KEY_V1 and PII_HASH_KEY immediately."
            ))
            self.stdout.write(
                "  Action: Do NOT rotate keys until all failures are investigated."
            )
        else:
            self.stdout.write(self.style.SUCCESS(
                "  ✅ Crypto health check passed — keys are valid and consistent."
            ))

        self.stdout.write("=" * 60)
