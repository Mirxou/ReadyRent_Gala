from django.db import migrations, models
from django.utils.translation import gettext_lazy as _


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0008_baridimobtransaction'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paymentwebhook',
            name='event_id',
            field=models.CharField(
                _('event ID'),
                max_length=150,
                db_index=True,
                null=False,
                blank=False,
                default='legacy_event',
                help_text=_('Gateway event ID for idempotency protection'),
            ),
        ),
    ]
