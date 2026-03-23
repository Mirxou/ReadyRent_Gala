"""
Phase 16C.2 — PII Encryption Backfill (Cutover)
Management command: encrypt_pii_cutover

Encrypts email into email_encrypted shadow field using AES (Fernet).

Mandatory constraints enforced:
  - Per-row instance.save(update_fields=['email_encrypted']) ONLY — no bulk update
  - normalize_email() applied before encryption (canonical form)
  - Idempotency: skip rows where email_encrypted is already set
  - Per-row try/except isolation — one failure never aborts the batch
  - No plaintext email in any log output
  - Explicit transaction per row via atomic() — not global
  - --dry-run: full simulation without any write
  - --verify: decrypt 10 random rows and assert match after live run

Usage:
    python manage.py encrypt_pii_cutover --dry-run --batch=500
    python manage.py encrypt_pii_cutover --batch=500
    python manage.py encrypt_pii_cutover --batch=500 --verify
    python manage.py encrypt_pii_cutover --user-id=42   # single-row debug
"""
import random
import time

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.crypto.normalization import normalize_email
from apps.users.models import User


PASS = "✅"
FAIL = "❌"
SKIP = "⏭ "
INFO = "ℹ️ "


class Command(BaseCommand):
    help = "Phase 16C.2: Encrypt email into email_encrypted shadow field."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Simulate without writing. Reports what would change.',
        )
        parser.add_argument(
            '--batch',
            type=int,
            default=500,
            help='Rows to load per iteration (default: 500).',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Process a single user by ID (debug mode).',
        )
        parser.add_argument(
            '--verify',
            action='store_true',
            default=False,
            help='After run: decrypt 10 random rows and verify match.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch']
        user_id = options['user_id']
        verify = options['verify']

        mode = "DRY-RUN" if dry_run else "LIVE"
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  PHASE 16C.2 — EMAIL ENCRYPTION BACKFILL [{mode}]")
        self.stdout.write(f"{'='*60}")

        # Validate encryption keys are configured before touching any data
        try:
            from apps.core.crypto.fields import _get_encryption_keys, _get_current_version
            _get_encryption_keys()
            _get_current_version()
        except RuntimeError as e:
            raise CommandError(
                f"Cannot run 16C.2: {e}\n"
                "Set PII_ENCRYPTION_KEYS and PII_CURRENT_KEY_VERSION in .env first."
            )

        # Build queryset — only rows needing encryption
        if user_id:
            qs = User.objects.filter(pk=user_id)
            self.stdout.write(f"\n{INFO} Single-user mode: id={user_id}")
        else:
            # Idempotency: skip rows already encrypted (non-null email_encrypted)
            qs = User.objects.filter(email_encrypted__isnull=True).exclude(email='')
            qs = qs.exclude(email__isnull=True)

        total_to_process = qs.count()
        already_done = User.objects.filter(email_encrypted__isnull=False).count()

        self.stdout.write(f"\n{INFO} Already encrypted:    {already_done}")
        self.stdout.write(f"{INFO} Needs encryption:     {total_to_process}")
        self.stdout.write(f"{INFO} Batch size:           {batch_size}")
        self.stdout.write(f"{INFO} Verify after run:     {verify}")
        self.stdout.write(f"{INFO} Dry run:              {dry_run}\n")

        if total_to_process == 0:
            self.stdout.write(
                f"{PASS} All rows already encrypted (idempotency). Nothing to do."
            )
            if verify and not dry_run:
                self._run_verification()
            return

        # Capture sample BEFORE state (by ID — never log email)
        sample_id = qs.order_by('pk').values_list('pk', flat=True).first()
        sample_before_encrypted = User.objects.filter(pk=sample_id).values_list(
            'email_encrypted', flat=True
        ).first() if sample_id else None

        # Counters
        processed = 0
        skipped = 0
        failed = 0
        failed_ids = []
        start_time = time.time()

        # Process in batches by ordered pk
        offset = 0
        while True:
            # Fresh queryset slice each iteration to avoid stale caching
            batch_pks = list(
                qs.order_by('pk').values_list('pk', flat=True)[offset:offset + batch_size]
            )
            if not batch_pks:
                break

            batch_processed = 0
            batch_skipped = 0
            batch_failed = 0

            for pk in batch_pks:
                try:
                    # Fetch fresh instance each row — avoid stale state
                    user = User.objects.get(pk=pk)

                    # Guard 1: skip if no email
                    if not user.email:
                        skipped += 1
                        batch_skipped += 1
                        continue

                    # Guard 2: idempotency — skip if already encrypted
                    # (re-check in case of concurrent run)
                    if user.email_encrypted:
                        skipped += 1
                        batch_skipped += 1
                        continue

                    # Compute canonical form — same pipeline as hashing
                    canonical = normalize_email(user.email)

                    if dry_run:
                        # Simulate only — no write, no log of canonical value
                        batch_processed += 1
                        continue

                    # Per-row atomic transaction — one failure rolls back only that row
                    with transaction.atomic():
                        # Assign canonical value — get_prep_value() encrypts it
                        # via EncryptedCharField before SQL write
                        user.email_encrypted = canonical
                        # ONLY update email_encrypted — never touch other fields
                        user.save(update_fields=['email_encrypted'])

                    batch_processed += 1

                except User.DoesNotExist:
                    # Row deleted between queryset and fetch — safe to skip
                    batch_skipped += 1
                    skipped += 1

                except Exception as e:
                    batch_failed += 1
                    failed += 1
                    failed_ids.append(pk)
                    # Log ID only — never log email
                    self.stderr.write(
                        f"  {FAIL} user id={pk}: {type(e).__name__}: {e}"
                    )

            processed += batch_processed
            offset += batch_size

            self.stdout.write(
                f"  Batch offset={offset - batch_size:6d} | "
                f"encrypted={batch_processed} | "
                f"skipped={batch_skipped} | "
                f"failed={batch_failed} | "
                f"total_done={processed}"
            )

        # Sample AFTER state
        sample_after_encrypted = None
        if sample_id and not dry_run:
            sample_after_encrypted = User.objects.filter(pk=sample_id).values_list(
                'email_encrypted', flat=True
            ).first()
            # Show only enc: prefix confirmation — not the ciphertext
            if sample_after_encrypted:
                marker_visible = sample_after_encrypted[:8] + "..."
            else:
                marker_visible = "NULL"

        # Print sample before/after (IDs only, no email, no ciphertext beyond marker)
        if sample_id:
            self.stdout.write(f"\n{'─'*60}")
            self.stdout.write("  SAMPLE ROW — BEFORE / AFTER")
            self.stdout.write(f"{'─'*60}")
            self.stdout.write(f"  user id:              {sample_id}")
            self.stdout.write(
                f"  email_encrypted BEFORE: {'NULL' if not sample_before_encrypted else 'SET'}"
            )
            if not dry_run:
                self.stdout.write(
                    f"  email_encrypted AFTER:  "
                    f"{'enc:v…[REDACTED]' if sample_after_encrypted else 'NULL'}"
                )

        # Run post-backfill verification if requested
        if verify and not dry_run:
            self._run_verification()

        self._print_summary(processed, skipped, failed, failed_ids, start_time, dry_run)

    def _run_verification(self):
        """
        Decrypt 10 random encrypted rows and verify decrypt(email_encrypted) == normalize_email(email).
        Logs user ID and pass/fail only — no plaintext email, no ciphertext.
        """
        self.stdout.write(f"\n{'─'*60}")
        self.stdout.write("  VERIFICATION GATE — 10 random decrypt checks")
        self.stdout.write(f"{'─'*60}")

        candidates = list(
            User.objects.filter(
                email_encrypted__isnull=False
            ).exclude(email='').values_list('pk', flat=True)
        )

        if not candidates:
            self.stdout.write(f"  {INFO} No encrypted rows to verify.")
            return

        sample_pks = random.sample(candidates, min(10, len(candidates)))
        verify_passed = 0
        verify_failed = 0

        for pk in sample_pks:
            try:
                user = User.objects.get(pk=pk)
                # from_db_value() decrypts transparently on access
                decrypted = user.email_encrypted
                expected = normalize_email(user.email)

                if decrypted == expected:
                    self.stdout.write(f"  {PASS} id={pk}: decrypt matches canonical form")
                    verify_passed += 1
                else:
                    # Do NOT log actual values — log mismatch only
                    self.stdout.write(
                        f"  {FAIL} id={pk}: decrypt MISMATCH — "
                        f"canonical form differs from stored encrypted value"
                    )
                    verify_failed += 1

            except Exception as e:
                self.stdout.write(
                    f"  {FAIL} id={pk}: verification error: {type(e).__name__}: {e}"
                )
                verify_failed += 1

        self.stdout.write(
            f"\n  Verification: {verify_passed}/{len(sample_pks)} passed"
        )
        if verify_failed > 0:
            self.stdout.write(
                f"  {FAIL} VERIFICATION FAILED — do not proceed to 16C.3 or 16C.4a"
            )
        else:
            self.stdout.write(
                f"  {PASS} All decrypt checks passed — 16C.3 gate cleared"
            )

    def _print_summary(self, processed, skipped, failed, failed_ids, start_time, dry_run):
        elapsed = time.time() - start_time

        # Post-backfill counts
        null_count = User.objects.filter(email_encrypted__isnull=True).exclude(email='').count()
        encrypted_count = User.objects.filter(email_encrypted__isnull=False).count()

        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  PHASE 16C.2 SUMMARY {'[DRY-RUN]' if dry_run else '[LIVE]'}")
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"  Rows encrypted:      {processed}")
        self.stdout.write(f"  Rows skipped:        {skipped}")
        self.stdout.write(f"  Rows failed:         {failed}")
        self.stdout.write(f"  Time elapsed:        {elapsed:.2f}s")

        if not dry_run:
            self.stdout.write(f"\n  Post-backfill state:")
            self.stdout.write(f"  email_encrypted SET: {encrypted_count}")
            self.stdout.write(
                f"  email_encrypted NULL (with email): {null_count}  "
                f"{'← target: 0' if null_count > 0 else '✅ target reached'}"
            )

        if failed > 0:
            self.stdout.write(f"\n  {FAIL} Failed IDs: {failed_ids[:20]}")
            self.stdout.write(
                "  Action: re-run with --user-id=<id> to debug individual rows"
            )
        elif dry_run:
            self.stdout.write(f"\n  {PASS} Dry run complete — no data written.")
            self.stdout.write(
                "  Run without --dry-run to apply encryption."
            )
        else:
            self.stdout.write(f"\n  {PASS} Encryption backfill complete.")
            if null_count == 0:
                self.stdout.write(
                    f"  {PASS} All email rows encrypted — 16C.3 verification gate ready."
                )
            else:
                self.stdout.write(
                    f"  ⚠️  {null_count} rows still NULL — re-run to catch stragglers."
                )
        self.stdout.write(f"{'='*60}\n")
