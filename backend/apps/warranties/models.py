"""
Warranty models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class WarrantyPlan(models.Model):
    """Warranty/Insurance plans"""
    PLAN_TYPE_CHOICES = [
        ('basic', _('Basic')),
        ('standard', _('Standard')),
        ('premium', _('Premium')),
        ('full_coverage', _('Full Coverage')),
    ]
    
    COVERAGE_TYPE_CHOICES = [
        ('damage', _('Damage Protection')),
        ('theft', _('Theft Protection')),
        ('loss', _('Loss Protection')),
        ('full', _('Full Coverage')),
    ]
    
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    plan_type = models.CharField(_('plan type'), max_length=20, choices=PLAN_TYPE_CHOICES)
    coverage_type = models.CharField(_('coverage type'), max_length=20, choices=COVERAGE_TYPE_CHOICES)
    
    description = models.TextField(_('description'), blank=True)
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    
    # Pricing
    price = models.DecimalField(
        _('price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Warranty price per rental')
    )
    price_percentage = models.DecimalField(
        _('price percentage'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Percentage of rental price (alternative to fixed price)')
    )
    
    # Coverage details
    max_coverage_amount = models.DecimalField(
        _('maximum coverage amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Maximum amount covered by warranty')
    )
    deductible = models.DecimalField(
        _('deductible'),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Amount customer pays before warranty kicks in')
    )
    
    # Terms
    covers_normal_wear = models.BooleanField(_('covers normal wear'), default=False)
    covers_accidental_damage = models.BooleanField(_('covers accidental damage'), default=True)
    covers_theft = models.BooleanField(_('covers theft'), default=False)
    covers_loss = models.BooleanField(_('covers loss'), default=False)
    
    is_active = models.BooleanField(_('active'), default=True)
    is_featured = models.BooleanField(_('featured'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('خطة الضمان')
        verbose_name_plural = _('خطط الضمان')
        ordering = ['plan_type', 'price']
        indexes = [
            models.Index(fields=['is_active', 'is_featured']),
        ]
    
    def __str__(self):
        return f"{self.name_ar or self.name} - {self.get_plan_type_display()}"
    
    def calculate_price(self, rental_price):
        """Calculate warranty price based on rental price"""
        if self.price_percentage:
            return (rental_price * self.price_percentage) / 100
        return self.price


class WarrantyPurchase(models.Model):
    """Warranty purchased for a booking"""
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('claimed', _('Claimed')),
        ('expired', _('Expired')),
        ('void', _('Void')),
    ]
    
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='warranty',
        verbose_name=_('booking'))
    warranty_plan = models.ForeignKey(
        WarrantyPlan,
        on_delete=models.PROTECT,
        related_name='purchases',
        verbose_name=_('warranty_plan'))
    
    # Pricing
    warranty_price = models.DecimalField(_('warranty price'), max_digits=10, decimal_places=2)
    coverage_amount = models.DecimalField(_('coverage amount'), max_digits=10, decimal_places=2)
    deductible = models.DecimalField(_('deductible'), max_digits=10, decimal_places=2)
    
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Dates
    purchased_at = models.DateTimeField(_('purchased at'), auto_now_add=True)
    activated_at = models.DateTimeField(_('activated at'), auto_now_add=True)
    expires_at = models.DateTimeField(_('expires at'))
    claimed_at = models.DateTimeField(_('claimed at'), null=True, blank=True)
    
    # Claim info
    claim_amount = models.DecimalField(
        _('claim amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    claim_description = models.TextField(_('claim description'), blank=True)
    
    class Meta:
        verbose_name = _('شراء الضمان')
        verbose_name_plural = _('مشتريات الضمان')
        ordering = ['-purchased_at']
        indexes = [
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['status', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.booking.product.name_ar} - {self.warranty_plan.name_ar} ({self.get_status_display()})"


class WarrantyClaim(models.Model):
    """Warranty claim"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('reviewing', _('Under Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('paid', _('Paid')),
    ]
    
    CLAIM_TYPE_CHOICES = [
        ('damage', _('Damage')),
        ('theft', _('Theft')),
        ('loss', _('Loss')),
        ('other', _('Other')),
    ]
    
    warranty_purchase = models.ForeignKey(
        WarrantyPurchase,
        on_delete=models.CASCADE,
        related_name='claims',
        verbose_name=_('warranty_purchase'))
    claim_type = models.CharField(_('claim type'), max_length=20, choices=CLAIM_TYPE_CHOICES)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Claim details
    claim_amount = models.DecimalField(_('claim amount'), max_digits=10, decimal_places=2)
    description = models.TextField(_('description'))
    evidence_files = models.JSONField(
        _('evidence files'),
        default=list,
        blank=True,
        help_text=_('List of file URLs or paths')
    )
    
    # Processing
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_warranty_claims',
        limit_choices_to={'role__in': ['admin', 'staff']},
        verbose_name=_('reviewed_by'))
    review_notes = models.TextField(_('review notes'), blank=True)
    approved_amount = models.DecimalField(
        _('approved amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Dates
    submitted_at = models.DateTimeField(_('submitted at'), auto_now_add=True)
    reviewed_at = models.DateTimeField(_('reviewed at'), null=True, blank=True)
    paid_at = models.DateTimeField(_('paid at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('مطالبة الضمان')
        verbose_name_plural = _('مطالبات الضمان')
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status', 'submitted_at']),
        ]
    
    def __str__(self):
        return f"Claim for {self.warranty_purchase.booking.product.name_ar} - {self.claim_amount}"


class InsurancePlan(models.Model):
    """Advanced insurance plans with multiple coverage options"""
    PLAN_TYPE_CHOICES = [
        ('basic', _('Basic Insurance')),
        ('premium', _('Premium Insurance')),
        ('full_coverage', _('Full Coverage Insurance')),
    ]
    
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    plan_type = models.CharField(_('plan type'), max_length=20, choices=PLAN_TYPE_CHOICES)
    
    description = models.TextField(_('description'), blank=True)
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    
    # Pricing
    base_price = models.DecimalField(_('base price'), max_digits=10, decimal_places=2, default=0)
    price_percentage = models.DecimalField(
        _('price percentage'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Percentage of product value')
    )
    
    # Coverage
    max_coverage_percentage = models.DecimalField(
        _('max coverage percentage'),
        max_digits=5,
        decimal_places=2,
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Maximum coverage as percentage of product value')
    )
    deductible_percentage = models.DecimalField(
        _('deductible percentage'),
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Deductible as percentage of claim amount')
    )
    
    # Coverage options
    covers_damage = models.BooleanField(_('covers damage'), default=True)
    covers_theft = models.BooleanField(_('covers theft'), default=False)
    covers_loss = models.BooleanField(_('covers loss'), default=False)
    covers_accidental_damage = models.BooleanField(_('covers accidental damage'), default=True)
    covers_normal_wear = models.BooleanField(_('covers normal wear'), default=False)
    
    # Product type restrictions
    applicable_product_types = models.JSONField(
        _('applicable product types'),
        default=list,
        blank=True,
        help_text=_('List of product category IDs this plan applies to (empty = all)')
    )
    
    is_active = models.BooleanField(_('active'), default=True)
    is_featured = models.BooleanField(_('featured'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('خطة التأمين')
        verbose_name_plural = _('خطط التأمين')
        ordering = ['plan_type', 'base_price']
    
    def __str__(self):
        return f"{self.name_ar or self.name} - {self.get_plan_type_display()}"
    
    def calculate_price(self, product_value):
        """Calculate insurance price based on product value"""
        if self.price_percentage:
            return (product_value * self.price_percentage) / 100
        return self.base_price
    
    def calculate_coverage(self, product_value):
        """Calculate maximum coverage amount"""
        max_coverage = (product_value * self.max_coverage_percentage) / 100
        return max_coverage
    
    def calculate_deductible(self, claim_amount):
        """Calculate deductible amount"""
        return (claim_amount * self.deductible_percentage) / 100
    
    def is_applicable_to_product(self, product):
        """Check if plan is applicable to product"""
        if not self.applicable_product_types:
            return True
        return product.category.id in self.applicable_product_types
