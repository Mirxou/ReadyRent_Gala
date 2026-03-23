"""
Phase 16C.4a — Logical Cutover Migration
=========================================
Two RenameField operations:
  1. email  → email_plaintext_backup   (plaintext kept as backup, not in model class)
  2. email_encrypted → email           (encrypted field becomes the canonical email)

The model class already reflects this state:
  - email = EncryptedCharField(...)     ← was email_encrypted
  - email_plaintext_backup: DB column only, no Python field (dropped in 16C.4b)

⚠ POINT OF PARTIAL NO RETURN:
  After this migration Django reads email from EncryptedCharField.
  Rollback is possible (reverse the RenameFields) until 16C.4b.
  16C.4b (RemoveField email_plaintext_backup) is irreversible.

Pre-cutover invariant (must be 0 before applying):
  SELECT COUNT(*) FROM users_user WHERE email_encrypted NOT LIKE 'enc:v%';
  → Confirmed 0 before this migration was written.
"""
from django.db import migrations
import apps.core.crypto.fields


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_add_email_encrypted_shadow'),
    ]

    operations = [
        # Step 1: Rename plaintext email column to backup
        # Django is now blind to this column (no Python field) — it stays in DB only.
        migrations.RenameField(
            model_name='user',
            old_name='email',
            new_name='email_plaintext_backup',
        ),

        # Step 2: Rename the encrypted shadow column to become the canonical email.
        # After this, user.email returns decrypted value transparently via from_db_value().
        migrations.RenameField(
            model_name='user',
            old_name='email_encrypted',
            new_name='email',
        ),
    ]
