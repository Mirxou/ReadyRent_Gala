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
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_phase_16c4a_email_cutover'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email_plaintext_backup',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='email address'),
        ),
    ]
