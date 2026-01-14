"""
Local Guide models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class ServiceCategory(models.Model):
    """Categories for local services"""
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    slug = models.SlugField(_('slug'), unique=True)
    icon = models.CharField(_('icon'), max_length=50, blank=True)
    description = models.TextField(_('description'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    
    class Meta:
        verbose_name = _('فئة الخدمة')
        verbose_name_plural = _('فئات الخدمات')
        ordering = ['name']
    
    def __str__(self):
        return self.name_ar or self.name


class LocalService(models.Model):
    """Local service provider (venue, photographer, MC, etc.)"""
    SERVICE_TYPE_CHOICES = [
        ('venue', _('Wedding Venue')),
        ('photographer', _('Photographer')),
        ('videographer', _('Videographer')),
        ('mc', _('MC / Presenter')),
        ('caterer', _('Caterer')),
        ('makeup_artist', _('Makeup Artist')),
        ('hair_stylist', _('Hair Stylist')),
        ('decorator', _('Decorator')),
        ('dj', _('DJ')),
        ('band', _('Band')),
        ('other', _('Other')),
    ]
    
    name = models.CharField(_('name'), max_length=200)
    name_ar = models.CharField(_('name (Arabic)'), max_length=200)
    service_type = models.CharField(_('service type'), max_length=30, choices=SERVICE_TYPE_CHOICES)
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='services',
        verbose_name=_('category'))
    
    description = models.TextField(_('description'), blank=True)
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    
    # Contact
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'), blank=True)
    website = models.URLField(_('website'), blank=True)
    whatsapp = models.CharField(_('whatsapp'), max_length=20, blank=True)
    
    # Location
    address = models.TextField(_('address'))
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Pricing
    price_range_min = models.DecimalField(_('min price'), max_digits=10, decimal_places=2, null=True, blank=True)
    price_range_max = models.DecimalField(_('max price'), max_digits=10, decimal_places=2, null=True, blank=True)
    price_note = models.TextField(_('price note'), blank=True)
    
    # Media
    logo = models.ImageField(_('logo'), upload_to='local_services/logos/', blank=True, null=True)
    cover_image = models.ImageField(_('cover image'), upload_to='local_services/covers/', blank=True, null=True)
    
    # Ratings
    rating = models.DecimalField(
        _('rating'),
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.IntegerField(_('review count'), default=0)
    
    # Status
    is_featured = models.BooleanField(_('featured'), default=False)
    is_verified = models.BooleanField(_('verified'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الخدمة المحلية')
        verbose_name_plural = _('الخدمات المحلية')
        ordering = ['-is_featured', '-rating', 'name']
        indexes = [
            models.Index(fields=['service_type', 'is_active']),
            models.Index(fields=['city', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name_ar or self.name} - {self.get_service_type_display()}"


class ServiceImage(models.Model):
    """Images for local services"""
    service = models.ForeignKey(
        LocalService,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('service'))
    image = models.ImageField(_('image'), upload_to='local_services/images/')
    alt_text = models.CharField(_('alt text'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('primary'), default=False)
    order = models.IntegerField(_('order'), default=0)
    
    class Meta:
        verbose_name = _('صورة الخدمة')
        verbose_name_plural = _('صور الخدمات')
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.service.name} - Image {self.order}"


class ServiceReview(models.Model):
    """Reviews for local services"""
    service = models.ForeignKey(
        LocalService,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('service'))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='service_reviews',
        verbose_name=_('user'))
    rating = models.IntegerField(
        _('rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(_('comment'), blank=True)
    is_verified = models.BooleanField(_('verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('مراجعة الخدمة')
        verbose_name_plural = _('مراجعات الخدمات')
        ordering = ['-created_at']
        unique_together = ['service', 'user']
    
    def __str__(self):
        return f"Review for {self.service.name} - {self.rating}/5"

