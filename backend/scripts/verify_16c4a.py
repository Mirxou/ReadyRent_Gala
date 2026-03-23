"""
Phase 16C.4a — Post-Cutover Verification
Checks:
  1. SELECT email FROM users_user LIMIT 3 → must be enc:v1:...
  2. COUNT(*) WHERE email NOT LIKE 'enc:v%' → must be 0
  3. COUNT(*) WHERE email_plaintext_backup IS NOT NULL → backup column present
  4. Decrypt sample: user.email returns plaintext via ORM
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from apps.users.models import User

print("=" * 60)
print("  PHASE 16C.4a — POST-CUTOVER VERIFICATION")
print("=" * 60)

# 1. Raw SQL: confirm email column now stores enc:v1 blobs
with connection.cursor() as cursor:
    cursor.execute("SELECT id, email FROM users_user ORDER BY id LIMIT 3")
    rows = cursor.fetchall()

print("\n  [1] Raw DB email column (first 3 rows):")
all_encrypted = True
for row_id, raw_email in rows:
    is_enc = isinstance(raw_email, str) and raw_email.startswith('enc:v')
    if not is_enc:
        all_encrypted = False
    marker = raw_email[:12] + "..." if raw_email else "NULL"
    status = "✅" if is_enc else "❌ PLAINTEXT EXPOSED"
    print(f"    id={row_id}: {status}  raw={marker}")

if all_encrypted:
    print("  ✅ All sampled rows store enc:v1:... format — plaintext gone from column")
else:
    print("  ❌ FAIL: plaintext still visible in email column — cutover incomplete")

# 2. Invariant: no unencrypted emails in the email column
with connection.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email NOT LIKE 'enc:v%'")
    unencrypted = cursor.fetchone()[0]

status = "✅" if unencrypted == 0 else f"❌ {unencrypted} unencrypted rows remain"
print(f"\n  [2] COUNT WHERE email NOT LIKE 'enc:v%': {unencrypted}  {status}")

# 3. Backup column still present
with connection.cursor() as cursor:
    try:
        cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_plaintext_backup IS NOT NULL")
        backup_count = cursor.fetchone()[0]
        print(f"\n  [3] email_plaintext_backup rows (not null): {backup_count}  ✅ backup column present")
    except Exception as e:
        print(f"\n  [3] email_plaintext_backup: ❌ column missing — {e}")

# 4. ORM decrypt: user.email should return plaintext via from_db_value()
print("\n  [4] ORM decrypt verification (user.email via from_db_value):")
try:
    sample = User.objects.order_by('id').first()
    if sample:
        decrypted = sample.email
        looks_like_email = '@' in str(decrypted)
        status = "✅ returns decrypted plaintext" if looks_like_email else "❌ unexpected value"
        # Show only that it's a valid email format — never log actual value
        print(f"    id={sample.id}: {status} (contains '@': {looks_like_email})")
    else:
        print("    No users found")
except Exception as e:
    print(f"    ❌ Decrypt error: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
