"""
Branch models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator


class Branch(models.Model):
    """Branch/Location model"""
    name = models.CharField(_('name'), max_length=200)
    name_ar = models.CharField(_('name (Arabic)'), max_length=200)
    code = models.CharField(_('code'), max_length=20, unique=True)
    
    # Location
    address = models.TextField(_('address'))
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    postal_code = models.CharField(_('postal code'), max_length=10, blank=True)
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Contact
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'), blank=True)
    
    # Management
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branches',
        limit_choices_to={'role__in': ['admin', 'staff']},
        verbose_name=_('manager'))
    
    # Status
    is_active = models.BooleanField(_('active'), default=True)
    opening_hours = models.JSONField(
        _('opening hours'),
        default=dict,
        blank=True,
        help_text=_('Opening hours by day of week')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الفرع')
        verbose_name_plural = _('الفروع')
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'city']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return self.name_ar or self.name


class BranchInventory(models.Model):
    """Inventory for each branch"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_items',
        verbose_name=_('branch'))
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='branch_inventory',
        verbose_name=_('product'))
    
    quantity_total = models.IntegerField(_('total quantity'), default=0, validators=[MinValueValidator(0)])
    quantity_available = models.IntegerField(_('available quantity'), default=0, validators=[MinValueValidator(0)])
    quantity_rented = models.IntegerField(_('rented quantity'), default=0, validators=[MinValueValidator(0)])
    quantity_maintenance = models.IntegerField(_('maintenance quantity'), default=0, validators=[MinValueValidator(0)])
    
    low_stock_threshold = models.IntegerField(_('low stock threshold'), default=1, validators=[MinValueValidator(0)])
    last_restocked = models.DateTimeField(_('last restocked'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('مخزون الفرع')
        verbose_name_plural = _('مخزونات الفروع')
        unique_together = ['branch', 'product']
        indexes = [
            models.Index(fields=['branch', 'quantity_available']),
        ]
    
    def __str__(self):
        return f"{self.branch.name_ar} - {self.product.name_ar} ({self.quantity_available}/{self.quantity_total})"
    
    def is_low_stock(self):
        """Check if stock is low"""
        return self.quantity_available <= self.low_stock_threshold
    
    def is_in_stock(self):
        """Check if product is in stock"""
        return self.quantity_available > 0


class BranchStaff(models.Model):
    """Staff assigned to branches"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='staff_members',
        verbose_name=_('branch'))
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='branch_assignments',
        limit_choices_to={'role__in': ['staff', 'admin']},
        verbose_name=_('staff'))
    role = models.CharField(_('role'), max_length=50, default='staff')
    is_active = models.BooleanField(_('active'), default=True)
    assigned_at = models.DateTimeField(_('assigned at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('موظف الفرع')
        verbose_name_plural = _('موظفو الفروع')
        unique_together = ['branch', 'staff']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.staff.email} - {self.branch.name_ar}"


class BranchPerformance(models.Model):
    """Branch performance metrics"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='performance_records',
        verbose_name=_('branch'))
    period_start = models.DateField(_('period start'))
    period_end = models.DateField(_('period end'))
    
    # Metrics
    total_bookings = models.IntegerField(_('total bookings'), default=0)
    total_revenue = models.DecimalField(_('total revenue'), max_digits=12, decimal_places=2, default=0)
    total_products = models.IntegerField(_('total products'), default=0)
    average_rating = models.DecimalField(_('average rating'), max_digits=3, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('أداء الفرع')
        verbose_name_plural = _('أداءات الفروع')
        ordering = ['-period_end']
        unique_together = ['branch', 'period_start', 'period_end']
    
    def __str__(self):
        return f"{self.branch.name_ar} - {self.period_start} to {self.period_end}"


