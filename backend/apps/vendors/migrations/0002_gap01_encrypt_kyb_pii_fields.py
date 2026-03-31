# Generated for GAP-01 FIX (2026-03-31)
from django.db import migrations
import apps.core.crypto.fields

class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vendor',
            name='tax_id',
            field=apps.core.crypto.fields.EncryptedCharField(blank=True, max_length=50, verbose_name='tax ID'),
        ),
        migrations.AlterField(
            model_name='vendor',
            name='registration_number',
            field=apps.core.crypto.fields.EncryptedCharField(blank=True, max_length=50, verbose_name='registration number'),
        ),
    ]
