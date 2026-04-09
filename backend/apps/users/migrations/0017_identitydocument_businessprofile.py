from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from apps.core.crypto.fields import EncryptedCharField


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0016_user_is_2fa_enabled_user_totp_secret'),
    ]

    operations = [
        migrations.CreateModel(
            name='IdentityDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('national_id', 'National ID'), ('passport', 'Passport'), ('driver_license', 'Driver License'), ('residence_permit', 'Residence Permit')], default='national_id', max_length=30, verbose_name='document type')),
                ('document_number', EncryptedCharField(blank=True, max_length=120, verbose_name='document number')),
                ('issuing_country', models.CharField(default='DZ', max_length=2, verbose_name='issuing country')),
                ('issue_date', models.DateField(blank=True, null=True, verbose_name='issue date')),
                ('expiry_date', models.DateField(blank=True, null=True, verbose_name='expiry date')),
                ('front_image', models.ImageField(blank=True, null=True, upload_to='kyc/documents/front/', verbose_name='front image')),
                ('back_image', models.ImageField(blank=True, null=True, upload_to='kyc/documents/back/', verbose_name='back image')),
                ('ocr_confidence', models.DecimalField(blank=True, decimal_places=4, max_digits=5, null=True, verbose_name='ocr confidence')),
                ('age_verified', models.BooleanField(default=False, verbose_name='age verified')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('submitted', 'Submitted'), ('verified', 'Verified'), ('rejected', 'Rejected'), ('expired', 'Expired')], default='pending', max_length=20, verbose_name='status')),
                ('verified_at', models.DateTimeField(blank=True, null=True, verbose_name='verified at')),
                ('rejection_reason', models.TextField(blank=True, verbose_name='rejection reason')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='identity_document', to=settings.AUTH_USER_MODEL, verbose_name='user')),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='identity_documents_verified', to=settings.AUTH_USER_MODEL, verbose_name='verified by')),
            ],
            options={
                'verbose_name': 'وثيقة هوية',
                'verbose_name_plural': 'وثائق الهوية',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BusinessProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business_name', models.CharField(blank=True, max_length=255, verbose_name='business name')),
                ('commercial_register_number', EncryptedCharField(blank=True, max_length=120, verbose_name='commercial register number')),
                ('tax_id', EncryptedCharField(blank=True, max_length=120, verbose_name='tax id')),
                ('nis_number', EncryptedCharField(blank=True, max_length=120, verbose_name='nis number')),
                ('legal_representative_name', models.CharField(blank=True, max_length=255, verbose_name='legal representative name')),
                ('legal_representative_id', EncryptedCharField(blank=True, max_length=120, verbose_name='legal representative id')),
                ('beneficial_owners', models.JSONField(blank=True, default=list, verbose_name='beneficial owners')),
                ('address', models.TextField(blank=True, verbose_name='address')),
                ('city', models.CharField(blank=True, max_length=100, verbose_name='city')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('under_review', 'Under Review'), ('verified', 'Verified'), ('rejected', 'Rejected')], default='pending', max_length=20, verbose_name='status')),
                ('verified_at', models.DateTimeField(blank=True, null=True, verbose_name='verified at')),
                ('notes', models.TextField(blank=True, verbose_name='notes')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='business_profile', to=settings.AUTH_USER_MODEL, verbose_name='user')),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='business_profiles_verified', to=settings.AUTH_USER_MODEL, verbose_name='verified by')),
            ],
            options={
                'verbose_name': 'ملف تجاري',
                'verbose_name_plural': 'الملفات التجارية',
                'ordering': ['-created_at'],
            },
        ),
    ]
