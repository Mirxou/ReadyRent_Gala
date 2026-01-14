"""
Maintenance models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone


class MaintenanceSchedule(models.Model):
    """Maintenance schedule configuration"""
    MAINTENANCE_TYPE_CHOICES = [
        ('cleaning', _('Cleaning')),
        ('repair', _('Repair')),
        ('inspection', _('Inspection')),
        ('deep_clean', _('Deep Cleaning')),
    ]
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='maintenance_schedules',
        verbose_name=_('product'))
    maintenance_type = models.CharField(
        _('maintenance type'),
        max_length=20,
        choices=MAINTENANCE_TYPE_CHOICES,
        default='cleaning'
    )
    duration_hours = models.IntegerField(
        _('duration (hours)'),
        default=2,
        help_text=_('Duration in hours needed for maintenance')
    )
    required_between_rentals = models.BooleanField(
        _('required between rentals'),
        default=True,
        help_text=_('Whether this maintenance is required between each rental')
    )
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('جدول الصيانة')
        verbose_name_plural = _('جداول الصيانة')
        ordering = ['product', 'maintenance_type']
    
    def __str__(self):
        return f"{self.product.name} - {self.get_maintenance_type_display()}"


class MaintenanceRecord(models.Model):
    """Record of maintenance performed"""
    STATUS_CHOICES = [
        ('scheduled', _('Scheduled')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='maintenance_records',
        verbose_name=_('product'))
    maintenance_type = models.CharField(
        _('maintenance type'),
        max_length=20,
        choices=MaintenanceSchedule.MAINTENANCE_TYPE_CHOICES
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    scheduled_start = models.DateTimeField(_('scheduled start'))
    scheduled_end = models.DateTimeField(_('scheduled end'))
    actual_start = models.DateTimeField(_('actual start'), null=True, blank=True)
    actual_end = models.DateTimeField(_('actual end'), null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_maintenances',
        limit_choices_to={'role': 'staff'},
        verbose_name=_('assigned_to'))
    notes = models.TextField(_('notes'), blank=True)
    cost = models.DecimalField(
        _('cost'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Maintenance cost if any')
    )
    related_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='maintenance_records',
        help_text=_('Booking that triggered this maintenance',
        verbose_name=_('related_booking'))
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('سجل الصيانة')
        verbose_name_plural = _('سجلات الصيانة')
        ordering = ['-scheduled_start']
        indexes = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['scheduled_start', 'scheduled_end']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.get_maintenance_type_display()} ({self.get_status_display()})"
    
    def is_overdue(self):
        """Check if maintenance is overdue"""
        if self.status in ['completed', 'cancelled']:
            return False
        return timezone.now() > self.scheduled_end
    
    def duration_minutes(self):
        """Calculate actual duration in minutes"""
        if self.actual_start and self.actual_end:
            delta = self.actual_end - self.actual_start
            return int(delta.total_seconds() / 60)
        return None


class MaintenancePeriod(models.Model):
    """Period when product is unavailable due to maintenance"""
    maintenance_record = models.OneToOneField(
        MaintenanceRecord,
        on_delete=models.CASCADE,
        related_name='period',
        verbose_name=_('maintenance_record'))
    start_datetime = models.DateTimeField(_('start datetime'))
    end_datetime = models.DateTimeField(_('end datetime'))
    blocks_bookings = models.BooleanField(_('blocks bookings'), default=True)
    
    class Meta:
        verbose_name = _('فترة الصيانة')
        verbose_name_plural = _('فترات الصيانة')
        indexes = [
            models.Index(fields=['start_datetime', 'end_datetime']),
        ]
    
    def __str__(self):
        return f"Maintenance Period: {self.start_datetime} to {self.end_datetime}"
    
    def overlaps_with(self, start_date, end_date):
        """Check if maintenance period overlaps with date range"""
        return not (self.end_datetime.date() < start_date or self.start_datetime.date() > end_date)

