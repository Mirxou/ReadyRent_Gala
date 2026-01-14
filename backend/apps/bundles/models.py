"""
Bundle models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class BundleCategory(models.Model):
    """Categories for bundles"""
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    slug = models.SlugField(_('slug'), unique=True)
    description = models.TextField(_('description'), blank=True)
    icon = models.CharField(_('icon'), max_length=50, blank=True, help_text=_('Icon name or emoji'))
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('فئة الحزمة')
        verbose_name_plural = _('فئات الحزم')
        ordering = ['name']
    
    def __str__(self):
        return self.name_ar or self.name


class Bundle(models.Model):
    """Bundle/package deals (e.g., Dress + Accessories + Makeup)"""
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', _('Percentage')),
        ('fixed', _('Fixed Amount')),
        ('free_item', _('Free Item')),
    ]
    
    name = models.CharField(_('name'), max_length=200)
    name_ar = models.CharField(_('name (Arabic)'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True)
    description = models.TextField(_('description'))
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    category = models.ForeignKey(
        BundleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bundles',
        verbose_name=_('category'))
    
    # Pricing
    base_price = models.DecimalField(
        _('base price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Total price of all items separately')
    )
    bundle_price = models.DecimalField(
        _('bundle price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Price when purchased as bundle')
    )
    discount_type = models.CharField(
        _('discount type'),
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percentage'
    )
    discount_value = models.DecimalField(
        _('discount value'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Discount amount or percentage')
    )
    
    # Conditions
    min_days = models.IntegerField(
        _('minimum days'),
        default=1,
        validators=[MinValueValidator(1)],
        help_text=_('Minimum rental days required')
    )
    max_days = models.IntegerField(
        _('maximum days'),
        null=True,
        blank=True,
        help_text=_('Maximum rental days (null for unlimited)')
    )
    
    # Status
    is_featured = models.BooleanField(_('featured'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    
    # Usage stats
    total_bookings = models.IntegerField(_('total bookings'), default=0)
    rating = models.DecimalField(
        _('rating'),
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    
    image = models.ImageField(_('image'), upload_to='bundles/', blank=True, null=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الحزمة')
        verbose_name_plural = _('الحزم')
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_featured', 'is_active']),
        ]
    
    def __str__(self):
        return self.name_ar or self.name
    
    def get_discount_amount(self):
        """Calculate discount amount"""
        if self.discount_type == 'percentage':
            return (self.base_price * self.discount_value) / 100
        elif self.discount_type == 'fixed':
            return self.discount_value
        return Decimal('0')
    
    def get_savings(self):
        """Calculate total savings"""
        return self.base_price - self.bundle_price
    
    def get_discount_percentage(self):
        """Calculate discount percentage"""
        if self.base_price > 0:
            return (self.get_savings() / self.base_price) * 100
        return Decimal('0')


class BundleItem(models.Model):
    """Items included in a bundle"""
    ITEM_TYPE_CHOICES = [
        ('product', _('Product')),
        ('service', _('Service')),
        ('addon', _('Add-on')),
    ]
    
    bundle = models.ForeignKey(
        Bundle,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('bundle'))
    item_type = models.CharField(
        _('item type'),
        max_length=20,
        choices=ITEM_TYPE_CHOICES,
        default='product'
    )
    
    # Reference to product
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='bundle_items',
        verbose_name=_('product'))
    
    # Or custom item details
    custom_name = models.CharField(_('custom name'), max_length=200, blank=True)
    custom_description = models.TextField(_('custom description'), blank=True)
    custom_price = models.DecimalField(
        _('custom price'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    quantity = models.IntegerField(_('quantity'), default=1, validators=[MinValueValidator(1)])
    is_required = models.BooleanField(_('required'), default=True, help_text=_('Must be included in bundle'))
    order = models.IntegerField(_('order'), default=0, help_text=_('Display order'))
    
    class Meta:
        verbose_name = _('عنصر الحزمة')
        verbose_name_plural = _('عناصر الحزم')
        ordering = ['order', 'id']
    
    def __str__(self):
        if self.product:
            return f"{self.bundle.name} - {self.product.name_ar} (x{self.quantity})"
        return f"{self.bundle.name} - {self.custom_name} (x{self.quantity})"
    
    def get_name(self):
        """Get item name"""
        return self.product.name_ar if self.product else self.custom_name
    
    def get_price(self):
        """Get item price"""
        if self.product:
            return self.product.price_per_day * self.quantity
        return (self.custom_price or 0) * self.quantity


class BundleBooking(models.Model):
    """Booking for a bundle"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('confirmed', _('Confirmed')),
        ('in_use', _('In Use')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bundle_bookings',
        verbose_name=_('user'))
    bundle = models.ForeignKey(
        Bundle,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('bundle'))
    
    # Rental period
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'))
    total_days = models.IntegerField(_('total days'), validators=[MinValueValidator(1)])
    
    # Pricing
    base_price = models.DecimalField(_('base price'), max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(_('discount amount'), max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(_('total price'), max_digits=10, decimal_places=2)
    
    # Status
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Individual bookings created from this bundle
    individual_bookings = models.ManyToManyField(
        'bookings.Booking',
        related_name='bundle_booking',
        blank=True,
        help_text=_('Individual product bookings created from this bundle')
    )
    
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('حجز الحزمة')
        verbose_name_plural = _('حجوزات الحزم')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['bundle', 'start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.bundle.name_ar} ({self.start_date} to {self.end_date})"
    
    def get_savings(self):
        """Get total savings from bundle"""
        return self.base_price - self.total_price


class BundleReview(models.Model):
    """Reviews for bundles"""
    bundle_booking = models.OneToOneField(
        BundleBooking,
        on_delete=models.CASCADE,
        related_name='review',
        verbose_name=_('bundle_booking'))
    rating = models.IntegerField(
        _('rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(_('comment'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('مراجعة الحزمة')
        verbose_name_plural = _('مراجعات الحزم')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review for {self.bundle_booking.bundle.name_ar} - {self.rating}/5"

