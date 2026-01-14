"""
Locations models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Address(models.Model):
    """User address model"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses',
        verbose_name=_('user'))
    label = models.CharField(
        _('label'),
        max_length=50,
        help_text=_('Address label (e.g., Home, Office)')
    )
    full_address = models.TextField(_('full address'))
    street = models.CharField(_('street'), max_length=200, blank=True)
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    state = models.CharField(_('state'), max_length=100, default='Constantine', blank=True)
    postal_code = models.CharField(_('postal code'), max_length=10, blank=True)
    country = models.CharField(_('country'), max_length=100, default='Algeria')
    
    # GPS Coordinates
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    
    # Google Maps Place ID
    google_place_id = models.CharField(
        _('Google Place ID'),
        max_length=255,
        blank=True,
        help_text=_('Google Maps Place ID for this address')
    )
    
    is_default = models.BooleanField(_('default'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('العنوان')
        verbose_name_plural = _('العناوين')
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_default']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.label} ({self.city})"
    
    def save(self, *args, **kwargs):
        """Ensure only one default address per user"""
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class DeliveryZone(models.Model):
    """Delivery zones for the service area"""
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    
    # Polygon coordinates (stored as JSON or GeoJSON)
    # For simplicity, using center point and radius
    center_latitude = models.DecimalField(
        _('center latitude'),
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    center_longitude = models.DecimalField(
        _('center longitude'),
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    radius_km = models.DecimalField(
        _('radius (km)'),
        max_digits=5,
        decimal_places=2,
        default=10.0,
        validators=[MinValueValidator(0)]
    )
    
    delivery_fee = models.DecimalField(
        _('delivery fee'),
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Same-day delivery options
    same_day_delivery_available = models.BooleanField(
        _('same day delivery available'),
        default=False,
        help_text=_('Whether same-day delivery is available in this zone')
    )
    same_day_delivery_fee = models.DecimalField(
        _('same day delivery fee'),
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Additional fee for same-day delivery')
    )
    same_day_cutoff_time = models.TimeField(
        _('same day cutoff time'),
        null=True,
        blank=True,
        help_text=_('Last time to place order for same-day delivery (e.g., 14:00)')
    )
    
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('منطقة التوصيل')
        verbose_name_plural = _('مناطق التوصيل')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name_ar or self.name} - {self.city}"


class DeliveryRequest(models.Model):
    """Delivery request for a booking"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('assigned', _('Assigned')),
        ('picked_up', _('Picked Up')),
        ('in_transit', _('In Transit')),
        ('delivered', _('Delivered')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
    ]
    
    DELIVERY_TYPE_CHOICES = [
        ('delivery', _('Delivery')),
        ('pickup', _('Pickup')),
        ('both', _('Both Delivery and Pickup')),
    ]
    
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='delivery_request',
        verbose_name=_('booking'))
    delivery_type = models.CharField(
        _('delivery type'),
        max_length=20,
        choices=DELIVERY_TYPE_CHOICES,
        default='both'
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Delivery Address
    delivery_address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        related_name='delivery_requests',
        verbose_name=_('delivery_address'))
    
    # Pickup Address (if different)
    pickup_address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pickup_requests',
        verbose_name=_('pickup_address'))
    
    delivery_zone = models.ForeignKey(
        DeliveryZone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('delivery_zone'))
    
    # Delivery Dates
    delivery_date = models.DateField(_('delivery date'))
    delivery_time_slot = models.CharField(
        _('delivery time slot'),
        max_length=50,
        blank=True,
        help_text=_('Preferred time slot (e.g., Morning, Afternoon, Evening)')
    )
    
    pickup_date = models.DateField(_('pickup date'), null=True, blank=True)
    pickup_time_slot = models.CharField(
        _('pickup time slot'),
        max_length=50,
        blank=True
    )
    
    # Delivery Agent
    assigned_driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_assignments',
        limit_choices_to={'role': 'staff'},
        verbose_name=_('assigned_driver'))
    
    delivery_fee = models.DecimalField(
        _('delivery fee'),
        max_digits=10,
        decimal_places=2,
        default=0
    )
    
    # GPS Tracking
    current_latitude = models.DecimalField(
        _('current latitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    current_longitude = models.DecimalField(
        _('current longitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    last_tracking_update = models.DateTimeField(_('last tracking update'), null=True, blank=True)
    
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('طلب التوصيل')
        verbose_name_plural = _('طلبات التوصيل')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'delivery_date']),
            models.Index(fields=['assigned_driver', 'status']),
        ]
    
    def __str__(self):
        return f"Delivery for {self.booking.product.name} - {self.get_status_display()}"


class DeliveryTracking(models.Model):
    """GPS tracking history for deliveries"""
    delivery_request = models.ForeignKey(
        DeliveryRequest,
        on_delete=models.CASCADE,
        related_name='tracking_history',
        verbose_name=_('delivery_request'))
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    timestamp = models.DateTimeField(_('timestamp'), auto_now_add=True)
    status = models.CharField(
        _('status'),
        max_length=50,
        blank=True,
        help_text=_('Status at this tracking point')
    )
    
    class Meta:
        verbose_name = _('تتبع التوصيل')
        verbose_name_plural = _('تتبع التوصيلات')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['delivery_request', 'timestamp']),
        ]
    
    def __str__(self):
        return f"Tracking: {self.delivery_request.booking.product.name} at {self.timestamp}"

