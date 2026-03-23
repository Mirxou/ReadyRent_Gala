"""
Phase 16B→16C Checkpoint
Counts plaintext PII still in DB before Encryption Cutover.
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

print("\n" + "="*60)
print("  PHASE 16B→16C PLAINTEXT CHECKPOINT")
print("="*60)

with connection.cursor() as cursor:
    # Count plaintext emails still in DB
    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email LIKE '%@%'")
    plaintext_email = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_hash IS NOT NULL AND email_hash != ''")
    hashed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user WHERE phone IS NOT NULL AND phone != ''")
    plaintext_phone = cursor.fetchone()[0]

print(f"\n  Total users:            {total}")
print(f"  Plaintext email rows:   {plaintext_email}  ← target: 0 after 16C")
print(f"  email_hash populated:   {hashed}")
print(f"  Plaintext phone rows:   {plaintext_phone}  ← target: 0 after 16C")
print(f"\n  Status: {'🔴 Plaintext still present — 16C required' if plaintext_email > 0 else '🟢 No plaintext email'}")
print("="*60 + "\n")
