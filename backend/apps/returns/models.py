"""
Returns models for ReadyRent.Gala
"""
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone


class Return(models.Model):
    """Return request and processing"""
    STATUS_CHOICES = [
        ('requested', _('Requested')),
        ('approved', _('Approved')),
        ('scheduled', _('Scheduled for Pickup')),
        ('in_transit', _('In Transit')),
        ('received', _('Received')),
        ('inspecting', _('Under Inspection')),
        ('accepted', _('Accepted')),
        ('damaged', _('Damaged')),
        ('rejected', _('Rejected')),
        ('completed', _('Completed')),
    ]
    
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='return_request',
        verbose_name=_('booking')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='requested'
    )
    requested_at = models.DateTimeField(_('requested at'), auto_now_add=True)
    scheduled_pickup_date = models.DateField(_('scheduled pickup date'), null=True, blank=True)
    actual_pickup_date = models.DateField(_('actual pickup date'), null=True, blank=True)
    received_at = models.DateTimeField(_('received at'), null=True, blank=True)
    inspection_date = models.DateTimeField(_('inspection date'), null=True, blank=True)
    inspection_notes = models.TextField(_('inspection notes'), blank=True)
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inspected_returns',
        limit_choices_to={'role__in': ['admin', 'staff']},
        verbose_name=_('inspector')
    )
    damage_assessment = models.TextField(_('damage assessment'), blank=True)
    damage_cost = models.DecimalField(
        _('damage cost'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Cost for any damages found')
    )
    return_notes = models.TextField(_('return notes'), blank=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الإرجاع')
        verbose_name_plural = _('الإرجاعات')
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', 'requested_at']),
            models.Index(fields=['booking']),
        ]
    
    def __str__(self):
        return f"Return for {self.booking.product.name} - {self.get_status_display()}"
    
    def is_late(self):
        """Check if return is late"""
        if self.booking.end_date and timezone.now().date() > self.booking.end_date:
            if self.status not in ['completed', 'accepted']:
                return True
        return False


@receiver(post_save, sender=Return)
def send_return_notifications(sender, instance, created, **kwargs):
    """Send notifications when return status changes"""
    from apps.notifications.services import send_return_confirmation_email
    
    # Send confirmation email when status changes to received
    if instance.status == 'received' and not created:
        try:
            send_return_confirmation_email(instance)
        except Exception as e:
            print(f"Error sending return confirmation: {e}")


class ReturnItem(models.Model):
    """Individual items in a return"""
    CONDITION_CHOICES = [
        ('excellent', _('Excellent')),
        ('good', _('Good')),
        ('fair', _('Fair')),
        ('damaged', _('Damaged')),
        ('lost', _('Lost')),
    ]
    
    return_request = models.ForeignKey(
        Return,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('return request')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='return_items',
        verbose_name=_('product')
    )
    quantity_returned = models.IntegerField(_('quantity returned'), default=1)
    condition = models.CharField(
        _('condition'),
        max_length=20,
        choices=CONDITION_CHOICES,
        blank=True
    )
    notes = models.TextField(_('notes'), blank=True)
    
    class Meta:
        verbose_name = _('عنصر الإرجاع')
        verbose_name_plural = _('عناصر الإرجاع')
    
    def __str__(self):
        return f"{self.product.name} - {self.condition} ({self.quantity_returned})"


class Refund(models.Model):
    """Refund record"""
    REFUND_TYPE_CHOICES = [
        ('full', _('Full Refund')),
        ('partial', _('Partial Refund')),
        ('damage_fee', _('Damage Fee Deduction')),
        ('late_fee', _('Late Fee Deduction')),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('processed', _('Processed')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    return_request = models.OneToOneField(
        Return,
        on_delete=models.CASCADE,
        related_name='refund',
        verbose_name=_('return request')
    )
    refund_type = models.CharField(
        _('refund type'),
        max_length=20,
        choices=REFUND_TYPE_CHOICES
    )
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        help_text=_('Refund amount (negative for charges)')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    reason = models.TextField(_('reason'))
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)
    transaction_reference = models.CharField(
        _('transaction reference'),
        max_length=100,
        blank=True,
        help_text=_('Payment gateway transaction reference')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الاسترداد')
        verbose_name_plural = _('الاستردادات')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund for {self.return_request.booking.product.name} - {self.amount}"

