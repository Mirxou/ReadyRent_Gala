"""
Review models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class Review(models.Model):
    """Product review model"""
    RATING_CHOICES = [
        (1, '1'),
        (2, '2'),
        (3, '3'),
        (4, '4'),
        (5, '5'),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pending Moderation')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('user'))
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('product'))
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='review',
        verbose_name=_('booking'))
    rating = models.IntegerField(
        _('rating'),
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(_('title'), max_length=200)
    comment = models.TextField(_('comment'))
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    is_verified_purchase = models.BooleanField(_('verified purchase'), default=False)
    helpful_count = models.IntegerField(_('helpful count'), default=0)
    sentiment_score = models.DecimalField(
        _('sentiment score'),
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Sentiment score from -1 (negative) to 1 (positive)')
    )
    sentiment_label = models.CharField(
        _('sentiment label'),
        max_length=20,
        choices=[
            ('positive', _('Positive')),
            ('neutral', _('Neutral')),
            ('negative', _('Negative')),
        ],
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('المراجعة')
        verbose_name_plural = _('المراجعات')
        ordering = ['-created_at']
        unique_together = ['user', 'product', 'booking']
        indexes = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} - {self.rating} stars"


class ReviewImage(models.Model):
    """Review images"""
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('review'))
    image = models.ImageField(_('image'), upload_to='reviews/')
    alt_text = models.CharField(_('alt text'), max_length=200, blank=True)
    order = models.IntegerField(_('order'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('صورة المراجعة')
        verbose_name_plural = _('صور المراجعات')
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"Image for {self.review}"

