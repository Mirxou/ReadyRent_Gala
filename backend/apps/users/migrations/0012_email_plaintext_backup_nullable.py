"""
Phase 16C.4a fix — Make email_plaintext_backup nullable
=========================================================
After migration 0011, the renamed column `email_plaintext_backup` still
carries the original NOT NULL constraint from the EmailField.

New users created after the cutover have no value for this column
(it is not in the Python model), causing IntegrityError on insert.

Fix: DROP NOT NULL constraint so new rows can have NULL in the backup column.
The column is a safety net for rollback only — NULL for new users is correct.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_phase_16c4a_email_cutover'),
    ]

    operations = [
        # Drop the NOT NULL constraint on the backup column.
        # New users after 16C.4a will have NULL here (correct — they were created
        # with an encrypted email, no plaintext ever stored).
        migrations.RunSQL(
            sql="ALTER TABLE users_user ALTER COLUMN email_plaintext_backup DROP NOT NULL;",
            reverse_sql="ALTER TABLE users_user ALTER COLUMN email_plaintext_backup SET NOT NULL;",
        ),

        # Also drop the UNIQUE constraint on email_plaintext_backup — it is now
        # a dead backup column and the uniqueness is enforced via email (the
        # EncryptedCharField, which has unique=True via the email_hash shadow index).
        # Note: unique constraint name in SQLite is embedded in the index; in
        # PostgreSQL it is a named constraint. Use RunSQL for compatibility.
        # We accept that in SQLite this is a no-op (SQLite cannot DROP CONSTRAINT).
        migrations.RunSQL(
            sql="""
                DO $$
                BEGIN
                    -- PostgreSQL: drop the old unique constraint on backup column
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname LIKE '%email_plaintext_backup%'
                        AND conrelid = 'users_user'::regclass
                    ) THEN
                        ALTER TABLE users_user DROP CONSTRAINT IF EXISTS users_user_email_plaintext_backup_key;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    NULL; -- SQLite: silently ignore
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
