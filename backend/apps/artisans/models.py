"""
Artisans models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Artisan(models.Model):
    """Local artisan/designer"""
    SPECIALTY_CHOICES = [
        ('dress_designer', _('Dress Designer')),
        ('accessories_designer', _('Accessories Designer')),
        ('embroidery', _('Embroidery Specialist')),
        ('beading', _('Beading Specialist')),
        ('tailor', _('Tailor')),
        ('other', _('Other')),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='artisan_profile',
        null=True,
        blank=True,
        verbose_name=_('user'))
    
    # Basic info
    name = models.CharField(_('name'), max_length=200)
    name_ar = models.CharField(_('name (Arabic)'), max_length=200)
    specialty = models.CharField(_('specialty'), max_length=30, choices=SPECIALTY_CHOICES)
    
    bio = models.TextField(_('bio'), blank=True)
    bio_ar = models.TextField(_('bio (Arabic)'), blank=True)
    
    # Contact
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'), blank=True)
    whatsapp = models.CharField(_('whatsapp'), max_length=20, blank=True)
    instagram = models.CharField(_('instagram'), max_length=100, blank=True)
    facebook = models.CharField(_('facebook'), max_length=100, blank=True)
    
    # Location
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Media
    profile_image = models.ImageField(_('profile image'), upload_to='artisans/profiles/', blank=True, null=True)
    cover_image = models.ImageField(_('cover image'), upload_to='artisans/covers/', blank=True, null=True)
    
    # Portfolio
    portfolio_description = models.TextField(_('portfolio description'), blank=True)
    
    # Ratings
    rating = models.DecimalField(
        _('rating'),
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.IntegerField(_('review count'), default=0)
    project_count = models.IntegerField(_('project count'), default=0)
    
    # Status
    is_featured = models.BooleanField(_('featured'), default=False)
    is_verified = models.BooleanField(_('verified'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الحرفي')
        verbose_name_plural = _('الحرفيين')
        ordering = ['-is_featured', '-rating', 'name']
        indexes = [
            models.Index(fields=['specialty', 'is_active']),
            models.Index(fields=['city', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name_ar or self.name} - {self.get_specialty_display()}"


class ArtisanPortfolio(models.Model):
    """Portfolio items for artisans"""
    artisan = models.ForeignKey(
        Artisan,
        on_delete=models.CASCADE,
        related_name='portfolio_items',
        verbose_name=_('artisan'))
    title = models.CharField(_('title'), max_length=200)
    title_ar = models.CharField(_('title (Arabic)'), max_length=200, blank=True)
    description = models.TextField(_('description'), blank=True)
    image = models.ImageField(_('image'), upload_to='artisans/portfolio/')
    order = models.IntegerField(_('order'), default=0)
    is_featured = models.BooleanField(_('featured'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('معرض الحرفي')
        verbose_name_plural = _('معارض الحرفيين')
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.artisan.name} - {self.title_ar or self.title}"


class ArtisanReview(models.Model):
    """Reviews for artisans"""
    artisan = models.ForeignKey(
        Artisan,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('artisan'))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='artisan_reviews',
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
        verbose_name = _('مراجعة الحرفي')
        verbose_name_plural = _('مراجعات الحرفيين')
        ordering = ['-created_at']
        unique_together = ['artisan', 'user']
    
    def __str__(self):
        return f"Review for {self.artisan.name} - {self.rating}/5"

