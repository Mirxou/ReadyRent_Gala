"""
Phase 16C.4b — Physical Deletion Migration (POINT OF NO RETURN)
================================================================
Drops the email_plaintext_backup column permanently.

⚠ PRE-MIGRATION CHECKLIST (run in Supabase SQL Editor first):

  -- 1. All emails encrypted?
  SELECT COUNT(*) FROM users_user WHERE email NOT LIKE 'enc:v%';
  -- Expected: 0

  -- 2. Backup column not contaminated?
  SELECT COUNT(*) FROM users_user WHERE email_plaintext_backup LIKE 'enc:%';
  -- Expected: 0

  -- 3. Wipe the plaintext (IRREVERSIBLE):
  UPDATE users_user SET email_plaintext_backup = NULL
  WHERE email_plaintext_backup IS NOT NULL;

  -- 4. Verify wipe:
  SELECT COUNT(*) FROM users_user WHERE email_plaintext_backup IS NOT NULL;
  -- Expected: 0

Only apply this migration after all 4 checks pass.
After this migration: key loss = permanent data loss for all users.
"""
from django.db import migrations


def drop_plaintext_backup(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('ALTER TABLE users_user DROP COLUMN IF EXISTS email_plaintext_backup;')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_email_plaintext_backup_nullable'),
    ]

    operations = [
        migrations.RunPython(drop_plaintext_backup, reverse_code=migrations.RunPython.noop),
    ]
