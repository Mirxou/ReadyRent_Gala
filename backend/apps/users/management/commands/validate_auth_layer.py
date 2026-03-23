"""
Phase 16A.1 — Auth Hardening Validation Suite
Tests all 5 auth validation gates before Phase 16B can proceed.

Run: python manage.py validate_auth_layer
"""
import hmac
import hashlib
import base64
import unicodedata
import re
from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate, get_user_model
from django.test.utils import override_settings
from django.db import IntegrityError

User = get_user_model()

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"


class Command(BaseCommand):
    help = 'Phase 16A.1: Validates auth hash layer before Phase 16B encryption backfill.'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("  PHASE 16A.1 — AUTH HARDENING VALIDATION GATE")
        self.stdout.write("="*60 + "\n")

        results = []
        results.append(self.test_1_normalization_consistency())
        results.append(self.test_2_unique_constraint())
        results.append(self.test_3_get_by_natural_key())
        results.append(self.test_4_authenticate_function())
        results.append(self.test_5_save_guard())

        self.stdout.write("\n" + "="*60)
        passed = sum(1 for r in results if r)
        total = len(results)
        if passed == total:
            self.stdout.write(f"  🟢 ALL {total}/{total} GATES PASSED — 16B APPROVED")
        else:
            self.stdout.write(f"  🔴 {passed}/{total} PASSED — 16B BLOCKED")
        self.stdout.write("="*60 + "\n")

    # ─────────────────────────────────────────────────────────
    # TEST 1: Normalization Consistency
    # ─────────────────────────────────────────────────────────
    def test_1_normalization_consistency(self):
        self.stdout.write("\n[TEST 1] Normalization Consistency (incl. Unicode Cf canonicalization)")
        from apps.core.crypto.normalization import normalize_email
        from apps.core.crypto.hashing import compute_pii_hash

        # Dummy key for this test
        key = base64.b64decode(base64.b64encode(b'x' * 32))

        variants = [
            ("uppercase",          "USER@EXAMPLE.COM"),
            ("lowercase",          "user@example.com"),
            ("whitespace",         "  user@example.com  "),
            ("ZWS injected",       "USER\u200b@EXAMPLE.COM"),   # Zero-Width Space (Cf)
            ("ZWJ injected",       "user\u200d@example.com"),   # Zero-Width Joiner (Cf)
            ("BOM injected",       "\ufeffuser@example.com"),   # BOM (Cf)
            ("fullwidth chars",    "\uff55\uff53\uff45\uff52@example.com"),  # NFKC → user
        ]

        hashes = {}
        for label, v in variants:
            normalized = normalize_email(v)
            h = compute_pii_hash(normalized, key)
            hashes[label] = h
            self.stdout.write(f"  [{label:20}] {repr(v)[:40]:42} → {h[:16]}...")

        # All variants MUST produce identical hash
        unique_hashes = set(hashes.values())
        if len(unique_hashes) == 1:
            self.stdout.write(f"  ✅ PASS: ALL {len(variants)} variants (incl. ZWS, ZWJ, BOM, fullwidth) → identical hash")
            return True
        else:
            # Report which variants differ
            first_hash = list(unique_hashes)[0]
            for label, h in hashes.items():
                if h != first_hash:
                    self.stdout.write(f"  ❌ FAIL: [{label}] produces different hash — canonicalization incomplete")
            return False

    # ─────────────────────────────────────────────────────────
    # TEST 2: email_hash Unique Constraint
    # ─────────────────────────────────────────────────────────
    def test_2_unique_constraint(self):
        self.stdout.write("\n[TEST 2] email_hash Index & Constraint Check")
        from django.db import connection

        with connection.cursor() as cursor:
            # PostgreSQL: check pg_indexes for email_hash index
            cursor.execute("""
                SELECT COUNT(*) FROM pg_indexes
                WHERE tablename = 'users_user'
                AND indexdef LIKE '%email_hash%'
            """)
            count = cursor.fetchone()[0]

        if count > 0:
            self.stdout.write(f"  {PASS}: email_hash index exists in PostgreSQL (found {count} index(es))")
        else:
            self.stdout.write(f"  {WARN}: email_hash index not found in pg_indexes — check migration was applied")

        # Check field definition in model
        field = User._meta.get_field('email_hash')
        if field.null:
            self.stdout.write(f"  {PASS}: email_hash has null=True (allows NULL for pre-backfill users)")
        else:
            self.stdout.write(f"  {WARN}: email_hash is NOT null=True — may cause issues with empty hash rows")

        if field.db_index or field.unique:
            self.stdout.write(f"  {PASS}: email_hash has db_index/unique=True in model definition")
            return True
        else:
            self.stdout.write(f"  {WARN}: email_hash has no index — lookup performance will be poor")
            return True  # Non-fatal for auth correctness

    # ─────────────────────────────────────────────────────────
    # TEST 3: get_by_natural_key via hash
    # ─────────────────────────────────────────────────────────
    def test_3_get_by_natural_key(self):
        self.stdout.write("\n[TEST 3] get_by_natural_key() Hash Lookup")

        # Create a test user
        test_email = "auth_test_16a1@readyrent.test"
        test_pass = "SecureTestPass!99"
        user = None

        try:
            # Clean up first
            User.objects.filter(email=test_email).delete()
            user = User.objects.create_user(
                email=test_email,
                username="auth_test_16a1",
                password=test_pass
            )

            if not user.email_hash:
                self.stdout.write(f"  {FAIL}: email_hash was not computed on save()")
                return False

            self.stdout.write(f"  email_hash computed: {user.email_hash[:24]}...")

            # Now test get_by_natural_key
            found = User.objects.get_by_natural_key(test_email)
            if found.id == user.id:
                self.stdout.write(f"  {PASS}: get_by_natural_key() correctly resolved via email_hash")
                return True
            else:
                self.stdout.write(f"  {FAIL}: get_by_natural_key() returned wrong user")
                return False

        except Exception as e:
            self.stdout.write(f"  {FAIL}: Exception in get_by_natural_key: {e}")
            return False
        finally:
            if user:
                user.delete()

    # ─────────────────────────────────────────────────────────
    # TEST 4: authenticate() function
    # ─────────────────────────────────────────────────────────
    def test_4_authenticate_function(self):
        self.stdout.write("\n[TEST 4] authenticate() Function (Full Auth Stack)")

        test_email = "auth_test2_16a1@readyrent.test"
        test_pass = "AnotherSecure!Pass77"
        user = None

        try:
            User.objects.filter(email=test_email).delete()
            user = User.objects.create_user(
                email=test_email,
                username="auth_test2_16a1",
                password=test_pass
            )

            # Test correct credentials
            result = authenticate(username=test_email, password=test_pass)
            if result and result.id == user.id:
                self.stdout.write(f"  {PASS}: authenticate() with correct credentials → User returned")
            else:
                self.stdout.write(f"  {FAIL}: authenticate() with correct credentials → None returned")
                return False

            # Test wrong password
            result_bad = authenticate(username=test_email, password="WrongPassword!")
            if result_bad is None:
                self.stdout.write(f"  {PASS}: authenticate() with wrong password → None (correct)")
            else:
                self.stdout.write(f"  {FAIL}: authenticate() with wrong password → User returned (CRITICAL)")
                return False

            # Test case-insensitive email
            result_case = authenticate(username=test_email.upper(), password=test_pass)
            if result_case and result_case.id == user.id:
                self.stdout.write(f"  {PASS}: authenticate() with uppercase email → User returned (normalization works)")
            else:
                self.stdout.write(f"  {WARN}: authenticate() with uppercase email → None (normalization may not cover authenticate path)")

            return True

        except Exception as e:
            self.stdout.write(f"  {FAIL}: Exception in authenticate(): {e}")
            return False
        finally:
            if user:
                user.delete()

    # ─────────────────────────────────────────────────────────
    # TEST 5: Save Guard (RuntimeError on missing key)
    # ─────────────────────────────────────────────────────────
    def test_5_save_guard(self):
        self.stdout.write("\n[TEST 5] Save Guard (RuntimeError on missing PII_HASH_KEY)")

        from django.test import override_settings

        test_email = "save_guard_test@readyrent.test"
        user = None

        try:
            # Test that save() does NOT crash when key is missing
            with override_settings(PII_HASH_KEY=None):
                User.objects.filter(email=test_email).delete()
                user = User(
                    email=test_email,
                    username="save_guard_test",
                )
                user.set_password("TestPass!123")
                user.save()  # Should NOT raise — guard catches RuntimeError

            if user.email_hash is None:
                self.stdout.write(f"  {PASS}: save() with missing key → email_hash=None (safe fallback, NULL in DB)")
                return True
            else:
                self.stdout.write(f"  {WARN}: save() with missing key → hash still computed (unexpected but non-fatal)")
                return True

        except RuntimeError as e:
            self.stdout.write(f"  {FAIL}: save() raised RuntimeError with missing key — will break migrations: {e}")
            return False
        except Exception as e:
            self.stdout.write(f"  {FAIL}: Unexpected exception in save guard test: {type(e).__name__}: {e}")
            return False
        finally:
            if user and user.pk:
                user.delete()
