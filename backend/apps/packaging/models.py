"""
Packaging models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator


class PackagingType(models.Model):
    """Types of packaging"""
    PACKAGE_SIZE_CHOICES = [
        ('small', _('Small')),
        ('medium', _('Medium')),
        ('large', _('Large')),
        ('xlarge', _('Extra Large')),
        ('custom', _('Custom')),
    ]
    
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    size = models.CharField(_('size'), max_length=20, choices=PACKAGE_SIZE_CHOICES)
    dimensions_length = models.DecimalField(_('length (cm)'), max_digits=6, decimal_places=2, null=True, blank=True)
    dimensions_width = models.DecimalField(_('width (cm)'), max_digits=6, decimal_places=2, null=True, blank=True)
    dimensions_height = models.DecimalField(_('height (cm)'), max_digits=6, decimal_places=2, null=True, blank=True)
    weight_capacity = models.DecimalField(_('weight capacity (kg)'), max_digits=6, decimal_places=2, null=True, blank=True)
    description = models.TextField(_('description'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    
    class Meta:
        verbose_name = _('نوع التغليف')
        verbose_name_plural = _('أنواع التغليف')
        ordering = ['size', 'name']
    
    def __str__(self):
        return f"{self.name_ar or self.name} ({self.get_size_display()})"


class PackagingMaterial(models.Model):
    """Packaging materials"""
    MATERIAL_TYPE_CHOICES = [
        ('box', _('Box')),
        ('bag', _('Bag')),
        ('wrap', _('Wrap')),
        ('bubble_wrap', _('Bubble Wrap')),
        ('protective_sheet', _('Protective Sheet')),
        ('hanger', _('Hanger')),
        ('other', _('Other')),
    ]
    
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    material_type = models.CharField(_('material type'), max_length=30, choices=MATERIAL_TYPE_CHOICES)
    cost_per_unit = models.DecimalField(_('cost per unit'), max_digits=10, decimal_places=2, default=0)
    is_reusable = models.BooleanField(_('reusable'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    
    class Meta:
        verbose_name = _('مادة التغليف')
        verbose_name_plural = _('مواد التغليف')
        ordering = ['material_type', 'name']
    
    def __str__(self):
        return f"{self.name_ar or self.name} ({self.get_material_type_display()})"


class PackagingRule(models.Model):
    """Rules for automatic packaging selection"""
    product_category = models.ForeignKey(
        'products.Category',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='packaging_rules',
        verbose_name=_('product_category'))
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='packaging_rules',
        verbose_name=_('product'))
    packaging_type = models.ForeignKey(
        PackagingType,
        on_delete=models.CASCADE,
        related_name='rules',
        verbose_name=_('packaging_type'))
    
    # Conditions
    min_rental_days = models.IntegerField(_('minimum rental days'), null=True, blank=True)
    max_rental_days = models.IntegerField(_('maximum rental days'), null=True, blank=True)
    requires_protection = models.BooleanField(_('requires extra protection'), default=False)
    
    priority = models.IntegerField(_('priority'), default=0, help_text=_('Higher priority = selected first'))
    is_active = models.BooleanField(_('active'), default=True)
    
    class Meta:
        verbose_name = _('قاعدة التغليف')
        verbose_name_plural = _('قواعد التغليف')
        ordering = ['-priority', 'packaging_type']
    
    def __str__(self):
        if self.product:
            return f"{self.product.name_ar} → {self.packaging_type.name_ar}"
        if self.product_category:
            return f"{self.product_category.name_ar} → {self.packaging_type.name_ar}"
        return f"Rule → {self.packaging_type.name_ar}"


class PackagingInstance(models.Model):
    """Instance of packaging for a specific booking"""
    STATUS_CHOICES = [
        ('prepared', _('Prepared')),
        ('used', _('In Use')),
        ('returned', _('Returned')),
        ('damaged', _('Damaged')),
        ('disposed', _('Disposed')),
    ]
    
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='packaging',
        verbose_name=_('booking'))
    packaging_type = models.ForeignKey(
        PackagingType,
        on_delete=models.CASCADE,
        related_name='instances',
        verbose_name=_('packaging_type'))
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='prepared')
    
    # Materials used
    materials_used = models.ManyToManyField(
        PackagingMaterial,
        through='PackagingMaterialUsage',
        related_name='packaging_instances'
    )
    
    # Cost
    packaging_cost = models.DecimalField(_('packaging cost'), max_digits=10, decimal_places=2, default=0)
    
    # Dates
    prepared_at = models.DateTimeField(_('prepared at'), auto_now_add=True)
    used_at = models.DateTimeField(_('used at'), null=True, blank=True)
    returned_at = models.DateTimeField(_('returned at'), null=True, blank=True)
    
    notes = models.TextField(_('notes'), blank=True)
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prepared_packaging',
        limit_choices_to={'role': 'staff'},
        verbose_name=_('prepared_by'))
    
    class Meta:
        verbose_name = _('مثيل التغليف')
        verbose_name_plural = _('مثيلات التغليف')
        ordering = ['-prepared_at']
        indexes = [
            models.Index(fields=['booking', 'status']),
        ]
    
    def __str__(self):
        return f"{self.booking.product.name_ar} - {self.packaging_type.name_ar} ({self.get_status_display()})"


class PackagingMaterialUsage(models.Model):
    """Materials used in a packaging instance"""
    packaging_instance = models.ForeignKey(PackagingInstance, on_delete=models.CASCADE,
        verbose_name=_('packaging_instance'))
    material = models.ForeignKey(PackagingMaterial, on_delete=models.CASCADE,
        verbose_name=_('material'))
    quantity = models.IntegerField(_('quantity'), default=1, validators=[MinValueValidator(1)])
    unit_cost = models.DecimalField(_('unit cost'), max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(_('total cost'), max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = _('استخدام مادة التغليف')
        verbose_name_plural = _('استخدامات مواد التغليف')
        unique_together = ['packaging_instance', 'material']
    
    def __str__(self):
        return f"{self.packaging_instance} - {self.material.name_ar} (x{self.quantity})"
    
    def save(self, *args, **kwargs):
        self.total_cost = self.unit_cost * self.quantity
        super().save(*args, **kwargs)

