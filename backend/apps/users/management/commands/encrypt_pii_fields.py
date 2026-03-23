"""
Phase 16B: PII Encryption Backfill
Management command: encrypt_pii_fields

Backfills email_hash and phone_hash for all existing users using the
canonical normalization pipeline (frozen after this run).

Usage:
    python manage.py encrypt_pii_fields --dry-run --batch=500
    python manage.py encrypt_pii_fields --batch=500

Options:
    --dry-run       Simulate without writing to DB. Reports what would change.
    --batch=N       Process N rows per transaction (default: 500).
    --user-id=ID    Process a single user by ID (for debugging).

Safety guarantees:
    - Each batch runs in its own atomic transaction.
    - Per-row errors are caught and logged — one bad row never aborts the batch.
    - Idempotent: re-running is safe (skips already-hashed rows unless --force).
    - --force: re-compute hashes even if already set (use after canonicalization change).
"""
import time
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

from apps.core.crypto.normalization import normalize_email, normalize_phone
from apps.core.crypto.hashing import compute_pii_hash, get_pii_hash_key


PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "
INFO = "ℹ️ "


class Command(BaseCommand):
    help = "Phase 16B: Backfill email_hash and phone_hash for all existing users."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Simulate without writing to DB.',
        )
        parser.add_argument(
            '--batch',
            type=int,
            default=500,
            help='Rows per transaction (default: 500).',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Process a single user by ID.',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            default=False,
            help='Re-compute hashes even if already set.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch']
        user_id = options['user_id']
        force = options['force']

        self.stdout.write("\n" + "=" * 60)
        mode = "DRY-RUN" if dry_run else "LIVE"
        self.stdout.write(f"  PHASE 16B — PII BACKFILL [{mode}]")
        self.stdout.write("=" * 60)

        # Load key — fail fast if not configured
        try:
            key = get_pii_hash_key()
        except RuntimeError as e:
            raise CommandError(f"Cannot run 16B: {e}\nSet PII_HASH_KEY in .env first.")

        # Counters
        total = 0
        processed = 0
        skipped = 0
        failed = 0
        failed_ids = []

        start_time = time.time()

        # Build queryset
        from apps.users.models import User
        qs = User.objects.all()
        if user_id:
            qs = qs.filter(pk=user_id)
            self.stdout.write(f"\n{INFO} Single-user mode: id={user_id}")
        elif not force:
            # Only process rows missing a hash
            qs = qs.filter(email_hash__isnull=True) | qs.filter(email_hash='')
            # Django ORM union — use raw for clarity
            qs = User.objects.filter(
                pk__in=User.objects.filter(email_hash__isnull=True).values('pk') |
                       User.objects.filter(email_hash='').values('pk')
            )

        total_to_process = qs.count()
        self.stdout.write(f"\n{INFO} Users to process: {total_to_process}")
        self.stdout.write(f"{INFO} Batch size: {batch_size}")
        self.stdout.write(f"{INFO} Force re-hash: {force}")
        self.stdout.write(f"{INFO} Dry run: {dry_run}\n")

        if total_to_process == 0:
            self.stdout.write(f"{PASS} All users already have email_hash computed. Nothing to do.")
            self._print_summary(processed, skipped, failed, failed_ids, start_time, dry_run)
            return

        # Capture a sample BEFORE state
        sample_before = None
        first_user = qs.first()
        if first_user:
            sample_before = {
                'id': first_user.pk,
                'email': first_user.email,
                'email_hash_before': first_user.email_hash,
                'phone': first_user.phone,
                'phone_hash_before': first_user.phone_hash,
            }

        # Process in batches
        offset = 0
        while True:
            batch_qs = qs.order_by('pk')[offset:offset + batch_size]
            batch_list = list(batch_qs)
            if not batch_list:
                break

            batch_processed = 0
            batch_failed = 0

            if not dry_run:
                try:
                    with transaction.atomic():
                        for user in batch_list:
                            try:
                                new_email_hash = None
                                new_phone_hash = None

                                if user.email:
                                    new_email_hash = compute_pii_hash(
                                        normalize_email(user.email), key
                                    )
                                if user.phone:
                                    new_phone_hash = compute_pii_hash(
                                        normalize_phone(user.phone), key
                                    )

                                User.objects.filter(pk=user.pk).update(
                                    email_hash=new_email_hash,
                                    phone_hash=new_phone_hash,
                                )
                                batch_processed += 1

                            except Exception as e:
                                batch_failed += 1
                                failed_ids.append(user.pk)
                                self.stderr.write(
                                    f"  {FAIL} user id={user.pk} email={user.email}: {e}"
                                )

                except Exception as batch_err:
                    self.stderr.write(f"  {FAIL} Batch at offset={offset} failed: {batch_err}")
                    failed += len(batch_list)
                    offset += batch_size
                    continue
            else:
                # Dry run: just count what would be processed
                for user in batch_list:
                    if user.email:
                        batch_processed += 1
                    else:
                        skipped += 1

            processed += batch_processed
            failed += batch_failed
            total += len(batch_list)
            offset += batch_size

            self.stdout.write(
                f"  Batch offset={offset - batch_size:6d} | "
                f"processed={batch_processed} | "
                f"failed={batch_failed} | "
                f"total_done={processed}"
            )

        # Capture AFTER state for sample row
        sample_after = None
        if sample_before and not dry_run:
            after_user = User.objects.filter(pk=sample_before['id']).first()
            if after_user:
                sample_after = {
                    'id': after_user.pk,
                    'email': after_user.email,
                    'email_hash_after': after_user.email_hash,
                    'phone': after_user.phone,
                    'phone_hash_after': after_user.phone_hash,
                }

        # Print sample before/after
        if sample_before:
            self.stdout.write(f"\n{'─'*60}")
            self.stdout.write("  SAMPLE ROW — BEFORE / AFTER")
            self.stdout.write(f"{'─'*60}")
            self.stdout.write(f"  id:              {sample_before['id']}")
            self.stdout.write(f"  email:           {sample_before['email']}")
            self.stdout.write(f"  email_hash BEFORE: {sample_before['email_hash_before'] or 'NULL'}")
            if sample_after:
                h = sample_after['email_hash_after']
                self.stdout.write(f"  email_hash AFTER:  {h[:32] + '...' if h else 'NULL'}")
            self.stdout.write(f"  phone:           {sample_before['phone'] or 'NULL'}")
            self.stdout.write(f"  phone_hash BEFORE: {sample_before['phone_hash_before'] or 'NULL'}")
            if sample_after:
                ph = sample_after['phone_hash_after']
                self.stdout.write(f"  phone_hash AFTER:  {ph[:32] + '...' if ph else 'NULL'}")

        self._print_summary(processed, skipped, failed, failed_ids, start_time, dry_run)

    def _print_summary(self, processed, skipped, failed, failed_ids, start_time, dry_run):
        elapsed = time.time() - start_time
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  PHASE 16B SUMMARY {'[DRY-RUN]' if dry_run else '[LIVE]'}")
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"  Rows processed:  {processed}")
        self.stdout.write(f"  Rows skipped:    {skipped}")
        self.stdout.write(f"  Rows failed:     {failed}")
        self.stdout.write(f"  Time elapsed:    {elapsed:.2f}s")

        if failed > 0:
            self.stdout.write(f"\n  {FAIL} Failed user IDs: {failed_ids[:20]}")
            self.stdout.write(f"  Action required: investigate and re-run with --user-id=<id>")
        elif dry_run:
            self.stdout.write(f"\n  {PASS} Dry run complete. Run without --dry-run to apply.")
        else:
            self.stdout.write(f"\n  {PASS} Backfill complete. All rows processed successfully.")
            self.stdout.write(f"  {PASS} Phase 16B DONE — plaintext email_hash shadow is populated.")
        self.stdout.write(f"{'='*60}\n")
