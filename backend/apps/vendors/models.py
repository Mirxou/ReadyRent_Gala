"""
Vendor models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Vendor(models.Model):
    """Vendor/Supplier model"""
    STATUS_CHOICES = [
        ('pending', _('Pending Approval')),
        ('active', _('Active')),
        ('suspended', _('Suspended')),
        ('inactive', _('Inactive')),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile',
        verbose_name=_('user'))
    business_name = models.CharField(_('business name'), max_length=200)
    business_name_ar = models.CharField(_('business name (Arabic)'), max_length=200)
    tax_id = models.CharField(_('tax ID'), max_length=50, blank=True)
    registration_number = models.CharField(_('registration number'), max_length=50, blank=True)
    
    # Contact info
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'))
    address = models.TextField(_('address'))
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    
    # Business details
    description = models.TextField(_('description'), blank=True)
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    website = models.URLField(_('website'), blank=True)
    logo = models.ImageField(_('logo'), upload_to='vendors/logos/', blank=True, null=True)
    
    # Commission
    commission_rate = models.DecimalField(
        _('commission rate'),
        max_digits=5,
        decimal_places=2,
        default=15.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Commission percentage (0-100)')
    )
    
    # Status
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(_('verified'), default=False)
    verified_at = models.DateTimeField(_('verified at'), null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_vendors',
        verbose_name=_('verified_by'))
    
    # Stats
    total_products = models.IntegerField(_('total products'), default=0)
    total_sales = models.DecimalField(_('total sales'), max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(_('total commission'), max_digits=12, decimal_places=2, default=0)
    rating = models.DecimalField(_('rating'), max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('المورد')
        verbose_name_plural = _('الموردين')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_verified']),
            models.Index(fields=['business_name']),
        ]
    
    def __str__(self):
        return self.business_name_ar or self.business_name


class VendorProduct(models.Model):
    """Products associated with vendors"""
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products',
        verbose_name=_('vendor'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='vendor_products',
        verbose_name=_('product'))
    commission_rate = models.DecimalField(
        _('commission rate'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Override vendor commission rate for this product')
    )
    added_at = models.DateTimeField(_('added at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('منتج المورد')
        verbose_name_plural = _('منتجات الموردين')
        unique_together = ['vendor', 'product']
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.product.name_ar}"
    
    def get_commission_rate(self):
        """Get commission rate (product-specific or vendor default)"""
        return self.commission_rate if self.commission_rate is not None else self.vendor.commission_rate


class Commission(models.Model):
    """Commission records for vendor sales"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('calculated', _('Calculated')),
        ('paid', _('Paid')),
        ('cancelled', _('Cancelled')),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='commissions',
        verbose_name=_('vendor'))
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='vendor_commissions',
        verbose_name=_('booking'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='commissions',
        verbose_name=_('product'))
    
    # Amounts
    sale_amount = models.DecimalField(_('sale amount'), max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(_('commission rate'), max_digits=5, decimal_places=2)
    commission_amount = models.DecimalField(_('commission amount'), max_digits=10, decimal_places=2)
    
    # Status
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    calculated_at = models.DateTimeField(_('calculated at'), auto_now_add=True)
    paid_at = models.DateTimeField(_('paid at'), null=True, blank=True)
    payment_reference = models.CharField(_('payment reference'), max_length=100, blank=True)
    
    notes = models.TextField(_('notes'), blank=True)
    
    class Meta:
        verbose_name = _('العمولة')
        verbose_name_plural = _('العمولات')
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['status', 'calculated_at']),
        ]
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.commission_amount} ({self.get_status_display()})"


class VendorPerformance(models.Model):
    """Vendor performance metrics"""
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='performance_records',
        verbose_name=_('vendor'))
    period_start = models.DateField(_('period start'))
    period_end = models.DateField(_('period end'))
    
    # Metrics
    total_bookings = models.IntegerField(_('total bookings'), default=0)
    total_revenue = models.DecimalField(_('total revenue'), max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(_('total commission'), max_digits=12, decimal_places=2, default=0)
    average_rating = models.DecimalField(_('average rating'), max_digits=3, decimal_places=2, default=0)
    products_added = models.IntegerField(_('products added'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('أداء المورد')
        verbose_name_plural = _('أداءات الموردين')
        ordering = ['-period_end']
        unique_together = ['vendor', 'period_start', 'period_end']
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.period_start} to {self.period_end}"


