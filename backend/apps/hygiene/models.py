"""
Hygiene tracking models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone


class HygieneRecord(models.Model):
    """Hygiene and cleaning record for products"""
    CLEANING_TYPE_CHOICES = [
        ('standard', _('Standard Cleaning')),
        ('deep', _('Deep Cleaning')),
        ('sanitization', _('Sanitization')),
        ('sterilization', _('Sterilization')),
        ('dry_clean', _('Dry Cleaning')),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('verified', _('Verified')),
        ('failed', _('Failed Inspection')),
    ]
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='hygiene_records',
        verbose_name=_('product'))
    cleaning_type = models.CharField(
        _('cleaning type'),
        max_length=20,
        choices=CLEANING_TYPE_CHOICES,
        default='standard'
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Timing
    scheduled_date = models.DateTimeField(_('scheduled date'))
    started_at = models.DateTimeField(_('started at'), null=True, blank=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    verified_at = models.DateTimeField(_('verified at'), null=True, blank=True)
    
    # Personnel
    cleaned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cleaning_records',
        limit_choices_to={'role': 'staff'},
        verbose_name=_('cleaned_by'))
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_hygiene_records',
        limit_choices_to={'role__in': ['admin', 'staff']},
        verbose_name=_('verified_by'))
    
    # Related booking/return
    related_return = models.ForeignKey(
        'returns.Return',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hygiene_records',
        help_text=_('Return that triggered this cleaning',
        verbose_name=_('related_return'))
    )
    
    # Details
    cleaning_notes = models.TextField(_('cleaning notes'), blank=True)
    inspection_notes = models.TextField(_('inspection notes'), blank=True)
    chemicals_used = models.TextField(
        _('chemicals used'),
        blank=True,
        help_text=_('List of cleaning chemicals/products used')
    )
    temperature = models.DecimalField(
        _('temperature'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Washing temperature if applicable (°C)')
    )
    
    # Quality check
    passed_inspection = models.BooleanField(_('passed inspection'), default=False)
    quality_score = models.IntegerField(
        _('quality score'),
        null=True,
        blank=True,
        help_text=_('Quality score from 1-10')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('سجل النظافة')
        verbose_name_plural = _('سجلات النظافة')
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['scheduled_date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.get_cleaning_type_display()} ({self.get_status_display()})"
    
    def is_overdue(self):
        """Check if cleaning is overdue"""
        if self.status in ['completed', 'verified']:
            return False
        return timezone.now() > self.scheduled_date


class HygieneChecklist(models.Model):
    """Checklist items for hygiene verification"""
    hygiene_record = models.ForeignKey(
        HygieneRecord,
        on_delete=models.CASCADE,
        related_name='checklist_items',
        verbose_name=_('hygiene_record'))
    item_name = models.CharField(_('item name'), max_length=200)
    is_checked = models.BooleanField(_('checked'), default=False)
    notes = models.TextField(_('notes'), blank=True)
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('checked_by'))
    checked_at = models.DateTimeField(_('checked at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('عنصر قائمة النظافة')
        verbose_name_plural = _('عناصر قائمة النظافة')
        ordering = ['id']
    
    def __str__(self):
        return f"{self.hygiene_record.product.name} - {self.item_name}"


class HygieneCertificate(models.Model):
    """Certificate of hygiene/cleaning"""
    hygiene_record = models.OneToOneField(
        HygieneRecord,
        on_delete=models.CASCADE,
        related_name='certificate',
        verbose_name=_('hygiene_record'))
    certificate_number = models.CharField(
        _('certificate number'),
        max_length=50,
        unique=True,
        help_text=_('Unique certificate number')
    )
    issued_date = models.DateTimeField(_('issued date'), auto_now_add=True)
    expiry_date = models.DateTimeField(
        _('expiry date'),
        null=True,
        blank=True,
        help_text=_('Certificate expiry date if applicable')
    )
    qr_code = models.ImageField(
        _('QR code'),
        upload_to='hygiene_certificates/qr/',
        blank=True,
        null=True,
        help_text=_('QR code for certificate verification')
    )
    is_valid = models.BooleanField(_('valid'), default=True)
    
    class Meta:
        verbose_name = _('شهادة النظافة')
        verbose_name_plural = _('شهادات النظافة')
        ordering = ['-issued_date']
    
    def __str__(self):
        return f"Certificate {self.certificate_number} - {self.hygiene_record.product.name}"
    
    def is_expired(self):
        """Check if certificate is expired"""
        if not self.expiry_date:
            return False
        return timezone.now() > self.expiry_date

