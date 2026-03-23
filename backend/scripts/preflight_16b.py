"""
Phase 16B Pre-Flight Checks
Run before executing encrypt_pii_fields.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

print("\n" + "="*60)
print("  PHASE 16B PRE-FLIGHT CHECKS")
print("="*60)

# CHECK 1: Total users and hash state
with connection.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) FROM users_user")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_hash IS NOT NULL AND email_hash != ''")
    hashed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_hash IS NULL OR email_hash = ''")
    unhashed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users_user WHERE phone_hash IS NOT NULL AND phone_hash != ''")
    phone_hashed = cursor.fetchone()[0]

print(f"\n[CHECK 1] Existing User Hash State")
print(f"  Total users:          {total}")
print(f"  email_hash computed:  {hashed} ({hashed/total*100:.1f}%)" if total else "  No users.")
print(f"  email_hash missing:   {unhashed}")
print(f"  phone_hash computed:  {phone_hashed}")

# CHECK 2: Duplicate email_hash detection
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT email_hash, COUNT(*)
        FROM users_user
        WHERE email_hash IS NOT NULL AND email_hash != ''
        GROUP BY email_hash
        HAVING COUNT(*) > 1
    """)
    dupes = cursor.fetchall()

print(f"\n[CHECK 2] Duplicate email_hash Detection")
if dupes:
    print(f"  ❌ FOUND {len(dupes)} duplicate hash(es) — RESOLVE BEFORE 16B:")
    for h, count in dupes:
        print(f"     hash={h[:20]}... appears {count} times")
else:
    print(f"  ✅ No duplicate email_hash values — canonicalization is clean")

# CHECK 3: Sample row (before state)
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT id, email, email_hash, phone, phone_hash, created_at
        FROM users_user
        ORDER BY created_at
        LIMIT 1
    """)
    row = cursor.fetchone()

print(f"\n[CHECK 3] Sample Row (Before State)")
if row:
    uid, email, email_hash, phone, phone_hash, created_at = row
    print(f"  id:         {uid}")
    print(f"  email:      {email}")
    print(f"  email_hash: {email_hash[:24] + '...' if email_hash else 'NULL'}")
    print(f"  phone:      {phone}")
    print(f"  phone_hash: {phone_hash[:24] + '...' if phone_hash else 'NULL'}")
    print(f"  created_at: {created_at}")
else:
    print("  No users in database.")

print("\n" + "="*60)
print("  PRE-FLIGHT COMPLETE")
print("="*60 + "\n")
