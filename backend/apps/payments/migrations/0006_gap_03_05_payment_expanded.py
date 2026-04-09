# Generated for GAP-03 and GAP-05 FIX (2026-03-31)
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('payments', '0005_alter_escrowhold_state'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paymentmethod',
            name='name',
            field=models.CharField(choices=[('baridimob', 'BaridiMob'), ('bank_card', 'Bank Card'), ('edahabia', 'E-Dahabia (البطاقة الذهبية)'), ('cod', 'دفع عند الاستلام (COD)')], max_length=50, unique=True, verbose_name='name'),
        ),
        migrations.AlterField(
            model_name='payment',
            name='payment_method',
            field=models.CharField(choices=[('baridimob', 'BaridiMob'), ('bank_card', 'Bank Card'), ('edahabia', 'E-Dahabia (البطاقة الذهبية)'), ('cod', 'دفع عند الاستلام (COD)')], max_length=20, verbose_name='payment method'),
        ),
        migrations.AddField(
            model_name='payment',
            name='cod_confirmed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cod_confirmations', to=settings.AUTH_USER_MODEL, verbose_name='COD confirmed by staff'),
        ),
        migrations.AddField(
            model_name='payment',
            name='cod_delivery_address',
            field=models.TextField(blank=True, verbose_name='COD delivery address'),
        ),
        migrations.AddField(
            model_name='payment',
            name='edahabia_card_number_hash',
            field=models.CharField(blank=True, help_text='HMAC-SHA256 of card number for idempotency — never store plaintext', max_length=88, verbose_name='E-Dahabia card hash'),
        ),
        migrations.AlterField(
            model_name='wallettransaction',
            name='transaction_type',
            field=models.CharField(choices=[('deposit', 'Deposit'), ('withdrawal', 'Withdrawal'), ('payment', 'Payment'), ('refund', 'Refund'), ('escrow_lock', 'Escrow Lock'), ('escrow_release', 'Escrow Release'), ('escrow_refund', 'Escrow Refund'), ('penalty', 'Penalty')], max_length=20),
        ),
    ]
