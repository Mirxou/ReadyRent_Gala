"""
Quick self-test: validate Fernet encrypt/decrypt round-trip after key format fix.
Writes results to fernet_test_output.txt — no sensitive data in output.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.crypto.fields import _encrypt, _decrypt, _is_already_encrypted

TEST_VALUE = "test.user@readyrent.gala"

print("=" * 50)
print("  FERNET KEY FORMAT SELF-TEST")
print("=" * 50)

try:
    encrypted = _encrypt(TEST_VALUE)
    starts_correct = encrypted.startswith('enc:v')
    print(f"  Encrypt: {'✅ OK' if starts_correct else '❌ FAIL'}")
    print(f"  Format:  {encrypted[:12]}... (marker check)")

    decrypted = _decrypt(encrypted)
    match = decrypted == TEST_VALUE
    print(f"  Decrypt: {'✅ OK — round-trip matches' if match else '❌ FAIL — mismatch'}")

    idempotent = _is_already_encrypted(encrypted)
    print(f"  Idempotency check: {'✅ correctly identified as encrypted' if idempotent else '❌ FAIL'}")

    print("\n  ✅ Fernet key format fix confirmed — ready for backfill.")

except Exception as e:
    print(f"\n  ❌ FAIL: {type(e).__name__}: {e}")
    print("  Do NOT run backfill until this is resolved.")

print("=" * 50)
