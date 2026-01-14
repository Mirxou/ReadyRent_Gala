"""
Payment models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.conf import settings


class PaymentMethod(models.Model):
    """Payment method configuration"""
    METHOD_CHOICES = [
        ('baridimob', _('BaridiMob')),
        ('bank_card', _('Bank Card')),
    ]
    
    name = models.CharField(_('name'), max_length=50, choices=METHOD_CHOICES, unique=True)
    is_active = models.BooleanField(_('active'), default=True)
    display_name = models.CharField(_('display name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    icon = models.CharField(_('icon'), max_length=100, blank=True, help_text=_('Icon class or URL'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('طريقة الدفع')
        verbose_name_plural = _('طرق الدفع')
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class Payment(models.Model):
    """Payment model"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('user'))
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True,
        verbose_name=_('booking'))
    payment_method = models.CharField(
        _('payment method'),
        max_length=20,
        choices=PaymentMethod.METHOD_CHOICES
    )
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(_('currency'), max_length=3, default='DZD')
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Payment method specific data
    # For BaridiMob
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True)
    otp_code = models.CharField(_('OTP code'), max_length=10, blank=True)
    
    # For Bank Card
    card_last_four = models.CharField(_('card last four'), max_length=4, blank=True)
    card_brand = models.CharField(_('card brand'), max_length=20, blank=True)
    
    # Transaction details
    transaction_id = models.CharField(_('transaction ID'), max_length=100, blank=True, unique=True, null=True)
    gateway_response = models.JSONField(_('gateway response'), default=dict, blank=True)
    failure_reason = models.TextField(_('failure reason'), blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('الدفع')
        verbose_name_plural = _('المدفوعات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['payment_method', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency} - {self.get_status_display()}"


class PaymentWebhook(models.Model):
    """Webhook logs for payment gateways"""
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='webhooks',
        null=True,
        blank=True,
        verbose_name=_('payment'))
    payment_method = models.CharField(_('payment method'), max_length=20)
    event_type = models.CharField(_('event type'), max_length=50)
    payload = models.JSONField(_('payload'), default=dict)
    headers = models.JSONField(_('headers'), default=dict, blank=True)
    processed = models.BooleanField(_('processed'), default=False)
    error_message = models.TextField(_('error message'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Webhook الدفع')
        verbose_name_plural = _('Webhooks الدفع')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Webhook {self.id} - {self.event_type} - {self.payment_method}"
