# Generated for GAP-02 FIX (2026-03-31)
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import apps.core.crypto.fields

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_remove_user_email_plaintext_backup_alter_user_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='VerificationLevel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('level', models.CharField(choices=[('basic', 'Basic — Phone Only'), ('standard', 'Standard — ID + Selfie'), ('premium', 'Premium — Biometric / KYB')], default='basic', max_length=20, verbose_name='verification level')),
                ('upgraded_at', models.DateTimeField(blank=True, null=True, verbose_name='upgraded at')),
                ('notes', models.TextField(blank=True, verbose_name='notes')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('upgraded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='kyc_level_upgrades', to=settings.AUTH_USER_MODEL, verbose_name='upgraded by')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='verification_level', to=settings.AUTH_USER_MODEL, verbose_name='user')),
            ],
            options={
                'verbose_name': 'مستوى التحقق',
                'verbose_name_plural': 'مستويات التحقق',
            },
        ),
        migrations.CreateModel(
            name='FaceVerification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('matched', 'Face Matched ✅'), ('mismatch', 'Face Mismatch ❌'), ('low_quality', 'Low Quality Image'), ('error', 'Processing Error')], default='pending', max_length=20, verbose_name='status')),
                ('face_id', apps.core.crypto.fields.EncryptedCharField(blank=True, help_text='Encrypted AI face descriptor token. Raw biometrics are never stored.', max_length=512, verbose_name='face ID token')),
                ('confidence_score', models.DecimalField(blank=True, decimal_places=4, help_text='AI match confidence: 0.0000 → 1.0000. Threshold: 0.8500', max_digits=5, null=True, verbose_name='confidence score')),
                ('liveness_passed', models.BooleanField(default=False, verbose_name='liveness check passed')),
                ('model_version', models.CharField(blank=True, help_text='e.g. deepface-v2.1 — for drift tracking', max_length=50, verbose_name='AI model version')),
                ('processed_at', models.DateTimeField(blank=True, null=True, verbose_name='processed at')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('verification', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='face_verification', to='users.verificationstatus', verbose_name='verification record')),
            ],
            options={
                'verbose_name': 'التحقق البيومتري',
                'verbose_name_plural': 'التحققات البيومترية',
            },
        ),
    ]
