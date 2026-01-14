"""
Booking models for ReadyRent.Gala
"""
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.conf import settings


class Booking(models.Model):
    """Booking model"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('confirmed', _('Confirmed')),
        ('in_use', _('In Use')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings',
        verbose_name=_('user'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='bookings',
        verbose_name=_('product'))
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))
    total_days = models.IntegerField(_('total days'), validators=[MinValueValidator(1)])
    total_price = models.DecimalField(_('total price'), max_digits=10, decimal_places=2)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الحجز')
        verbose_name_plural = _('الحجوزات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['product', 'start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.start_date} to {self.end_date})"


@receiver(post_save, sender=Booking)
def send_booking_notifications(sender, instance, created, **kwargs):
    """Send notifications when booking status changes"""
    # Check waitlist when booking is cancelled or completed (product becomes available)
    if instance.status in ['cancelled', 'completed']:
        from apps.notifications.tasks import check_waitlist_availability
        check_waitlist_availability.delay(instance.product.id)
    from apps.notifications.services import send_booking_confirmation_email
    
    # Send confirmation email when status changes to confirmed
    if instance.status == 'confirmed' and not created:
        # Check if status actually changed (by comparing with previous state)
        # For now, we'll send on every status change to confirmed
        try:
            send_booking_confirmation_email(instance)
        except Exception as e:
            # Log error but don't fail the save
            print(f"Error sending booking confirmation: {e}")


class Cart(models.Model):
    """Shopping cart model"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart',
        verbose_name=_('user'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('عربة التسوق')
        verbose_name_plural = _('عربات التسوق')
    
    def __str__(self):
        return f"Cart for {self.user.email}"


class Waitlist(models.Model):
    """Waitlist for unavailable products"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='waitlist_items',
        verbose_name=_('user'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='waitlist_items',
        verbose_name=_('product'))
    preferred_start_date = models.DateField(_('preferred start date'), null=True, blank=True)
    preferred_end_date = models.DateField(_('preferred end date'), null=True, blank=True)
    notified = models.BooleanField(_('notified'), default=False)
    notified_at = models.DateTimeField(_('notified at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('قائمة الانتظار')
        verbose_name_plural = _('قوائم الانتظار')
        unique_together = ['user', 'product']
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['product', 'notified']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name}"


class CartItem(models.Model):
    """Cart item model"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items',
        verbose_name=_('cart'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE,
        verbose_name=_('product'))
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))
    quantity = models.IntegerField(_('quantity'), default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('عنصر العربة')
        verbose_name_plural = _('عناصر العربة')
        unique_together = ['cart', 'product', 'start_date', 'end_date']
    
    def __str__(self):
        return f"{self.cart.user.email} - {self.product.name}"


class DamageAssessment(models.Model):
    """Damage assessment for rental products"""
    SEVERITY_CHOICES = [
        ('none', _('No Damage')),
        ('minor', _('Minor Damage')),
        ('moderate', _('Moderate Damage')),
        ('severe', _('Severe Damage')),
        ('total', _('Total Loss')),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pending Review')),
        ('reviewed', _('Reviewed')),
        ('disputed', _('Disputed')),
        ('resolved', _('Resolved')),
    ]
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='damage_assessment',
        verbose_name=_('booking'))
    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments_made',
        verbose_name=_('assessed_by'))
    severity = models.CharField(_('severity'), max_length=20, choices=SEVERITY_CHOICES, default='none')
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    damage_description = models.TextField(_('damage description'), blank=True)
    repair_cost = models.DecimalField(_('repair cost'), max_digits=10, decimal_places=2, default=0)
    replacement_cost = models.DecimalField(_('replacement cost'), max_digits=10, decimal_places=2, default=0)
    assessed_at = models.DateTimeField(_('assessed at'), auto_now_add=True)
    reviewed_at = models.DateTimeField(_('reviewed at'), null=True, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    
    class Meta:
        verbose_name = _('تقييم الأضرار')
        verbose_name_plural = _('تقييمات الأضرار')
        ordering = ['-assessed_at']
    
    def __str__(self):
        return f"Assessment for {self.booking} - {self.get_severity_display()}"


class DamagePhoto(models.Model):
    """Photos documenting damage"""
    PHOTO_TYPE_CHOICES = [
        ('pre_rental', _('Pre-Rental')),
        ('post_rental', _('Post-Rental')),
        ('damage', _('Damage Detail')),
        ('repair', _('Repair Documentation')),
    ]
    
    assessment = models.ForeignKey(DamageAssessment, on_delete=models.CASCADE, related_name='photos',
        verbose_name=_('assessment'))
    photo = models.ImageField(_('photo'), upload_to='damage_photos/')
    photo_type = models.CharField(_('photo type'), max_length=20, choices=PHOTO_TYPE_CHOICES)
    description = models.CharField(_('description'), max_length=255, blank=True)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('صورة الضرر')
        verbose_name_plural = _('صور الأضرار')
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.get_photo_type_display()} - {self.assessment.booking}"


class InspectionChecklist(models.Model):
    """Inspection checklist items"""
    assessment = models.ForeignKey(DamageAssessment, on_delete=models.CASCADE, related_name='checklist_items',
        verbose_name=_('assessment'))
    item_name = models.CharField(_('item name'), max_length=200)
    item_description = models.TextField(_('item description'), blank=True)
    is_checked = models.BooleanField(_('checked'), default=False)
    condition = models.CharField(_('condition'), max_length=50, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    checked_at = models.DateTimeField(_('checked at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('عنصر قائمة الفحص')
        verbose_name_plural = _('عناصر قائمة الفحص')
        ordering = ['item_name']
    
    def __str__(self):
        return f"{self.item_name} - {self.assessment.booking}"


class DamageClaim(models.Model):
    """Damage claims for compensation"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('under_review', _('Under Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('paid', _('Paid')),
    ]
    
    assessment = models.OneToOneField(DamageAssessment, on_delete=models.CASCADE, related_name='claim',
        verbose_name=_('assessment'))
    claimed_amount = models.DecimalField(_('claimed amount'), max_digits=10, decimal_places=2)
    approved_amount = models.DecimalField(_('approved amount'), max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    claim_description = models.TextField(_('claim description'))
    admin_notes = models.TextField(_('admin notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('مطالبة الضرر')
        verbose_name_plural = _('مطالبات الأضرار')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Claim {self.id} - {self.assessment.booking} - {self.get_status_display()}"


class Refund(models.Model):
    """Refund model"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds',
        verbose_name=_('booking'))
    amount = models.DecimalField(_('amount'), max_digits=10, decimal_places=2)
    reason = models.CharField(_('reason'), max_length=200)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    processing_days = models.IntegerField(_('processing days'), default=3)
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)
    transaction_id = models.CharField(_('transaction id'), max_length=100, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الاسترداد')
        verbose_name_plural = _('الاستردادات')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund {self.id} - {self.booking} - {self.amount}"


class Cancellation(models.Model):
    """Cancellation record"""
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='cancellation',
        verbose_name=_('booking'))
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cancellations_made',
        verbose_name=_('cancelled_by'))
    reason = models.TextField(_('reason'), blank=True)
    cancellation_fee = models.DecimalField(_('cancellation fee'), max_digits=10, decimal_places=2, default=0)
    refund_amount = models.DecimalField(_('refund amount'), max_digits=10, decimal_places=2, default=0)
    refund = models.OneToOneField(Refund, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancellation',
        verbose_name=_('refund'))
    cancelled_at = models.DateTimeField(_('cancelled at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('الإلغاء')
        verbose_name_plural = _('الإلغاءات')
        ordering = ['-cancelled_at']
    
    def __str__(self):
        return f"Cancellation {self.id} - {self.booking}"