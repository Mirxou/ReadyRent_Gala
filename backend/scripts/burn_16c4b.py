"""
Phase 16C.4b — Final Burn Script
1. Verify ciphertext completeness
2. Wipe plaintext backup (UPDATE)
3. Verify wipe
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

print("=" * 60)
print("  PHASE 16C.4b — THE FINAL BURN")
print("=" * 60)

with connection.cursor() as cursor:
    # 1. Verify ciphertext completeness
    # After 16C.4a rename, 'email' is the encrypted column
    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email IS NULL OR email NOT LIKE 'enc:v%'")
    null_cipher = cursor.fetchone()[0]
    
    if null_cipher > 0:
        print(f"❌ STOP: Found {null_cipher} rows where email_ciphertext is missing or invalid.")
        sys.exit(1)
    print("✅ [1] Ciphertext completeness verified: 0 unencrypted rows.")

    # 2. Soft wipe
    cursor.execute("""
        UPDATE users_user 
        SET email_plaintext_backup = NULL 
        WHERE email_plaintext_backup IS NOT NULL
    """)
    wiped_count = cursor.rowcount
    print(f"✅ [2] Plaintext wiped. Rows updated: {wiped_count}")

    # 3. Verify wipe
    cursor.execute("SELECT COUNT(*) FROM users_user WHERE email_plaintext_backup IS NOT NULL")
    remaining = cursor.fetchone()[0]
    
    if remaining > 0:
        print(f"❌ STOP: Wipe failed! {remaining} rows still have plaintext.")
        sys.exit(1)
    print("✅ [3] Wipe verified: 0 rows have plaintext.")

print("=" * 60)
print("  Ready for final migration (RemoveField).")
