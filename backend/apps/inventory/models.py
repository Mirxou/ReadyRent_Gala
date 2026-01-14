"""
Inventory models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver


class InventoryItem(models.Model):
    """Inventory tracking for products"""
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory_item',
        verbose_name=_('product'))
    quantity_total = models.IntegerField(
        _('total quantity'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Total quantity available in inventory')
    )
    quantity_available = models.IntegerField(
        _('available quantity'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity currently available for rent')
    )
    quantity_rented = models.IntegerField(
        _('rented quantity'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity currently rented')
    )
    quantity_maintenance = models.IntegerField(
        _('maintenance quantity'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity under maintenance')
    )
    low_stock_threshold = models.IntegerField(
        _('low stock threshold'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Alert when available quantity falls below this')
    )
    last_restocked = models.DateTimeField(_('last restocked'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('عنصر المخزون')
        verbose_name_plural = _('عناصر المخزون')
        indexes = [
            models.Index(fields=['quantity_available']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - Available: {self.quantity_available}/{self.quantity_total}"
    
    def is_low_stock(self):
        """Check if stock is low"""
        return self.quantity_available <= self.low_stock_threshold
    
    def is_in_stock(self):
        """Check if product is in stock"""
        return self.quantity_available > 0
    
    def get_availability_status(self):
        """Get availability status"""
        if not self.is_in_stock():
            return 'out_of_stock'
        elif self.is_low_stock():
            return 'low_stock'
        else:
            return 'in_stock'


class StockAlert(models.Model):
    """Stock alerts for low inventory"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('acknowledged', _('Acknowledged')),
        ('resolved', _('Resolved')),
    ]
    
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name=_('inventory_item'))
    alert_type = models.CharField(
        _('alert type'),
        max_length=20,
        choices=[
            ('low_stock', _('Low Stock')),
            ('out_of_stock', _('Out of Stock')),
        ]
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    message = models.TextField(_('message'))
    acknowledged_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts',
        verbose_name=_('acknowledged_by'))
    acknowledged_at = models.DateTimeField(_('acknowledged at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('تنبيه المخزون')
        verbose_name_plural = _('تنبيهات المخزون')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.inventory_item.product.name} - {self.alert_type}"


class StockMovement(models.Model):
    """Track stock movements (in/out)"""
    MOVEMENT_TYPE_CHOICES = [
        ('in', _('Stock In')),
        ('out', _('Stock Out')),
        ('adjustment', _('Adjustment')),
        ('return', _('Return')),
        ('maintenance', _('Maintenance')),
    ]
    
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='movements',
        verbose_name=_('inventory_item'))
    movement_type = models.CharField(
        _('movement type'),
        max_length=20,
        choices=MOVEMENT_TYPE_CHOICES
    )
    quantity = models.IntegerField(
        _('quantity'),
        validators=[MinValueValidator(1)]
    )
    previous_quantity = models.IntegerField(_('previous quantity'))
    new_quantity = models.IntegerField(_('new quantity'))
    reference_type = models.CharField(
        _('reference type'),
        max_length=50,
        blank=True,
        help_text=_('Related model name (e.g., Booking, Return)')
    )
    reference_id = models.IntegerField(
        _('reference ID'),
        null=True,
        blank=True,
        help_text=_('Related object ID')
    )
    notes = models.TextField(_('notes'), blank=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('created_by'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('حركة المخزون')
        verbose_name_plural = _('حركات المخزون')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['inventory_item', 'created_at']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]
    
    def __str__(self):
        return f"{self.inventory_item.product.name} - {self.movement_type} ({self.quantity})"


@receiver(post_save, sender=InventoryItem)
def check_stock_alerts(sender, instance, created, **kwargs):
    """Create stock alerts when needed"""
    if not created:
        if instance.is_low_stock() and instance.quantity_available > 0:
            # Check if there's already a pending low_stock alert
            existing_alert = StockAlert.objects.filter(
                inventory_item=instance,
                alert_type='low_stock',
                status='pending'
            ).exists()
            
            if not existing_alert:
                StockAlert.objects.create(
                    inventory_item=instance,
                    alert_type='low_stock',
                    message=f"Low stock alert: {instance.product.name} has {instance.quantity_available} items available (threshold: {instance.low_stock_threshold})"
                )
        
        if instance.quantity_available == 0:
            # Check if there's already a pending out_of_stock alert
            existing_alert = StockAlert.objects.filter(
                inventory_item=instance,
                alert_type='out_of_stock',
                status='pending'
            ).exists()
            
            if not existing_alert:
                StockAlert.objects.create(
                    inventory_item=instance,
                    alert_type='out_of_stock',
                    message=f"Out of stock: {instance.product.name} is no longer available"
                )


class VariantInventory(models.Model):
    """Inventory tracking for product variants"""
    variant = models.OneToOneField(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        related_name='inventory',
        verbose_name=_('variant'))
    quantity_total = models.IntegerField(
        _('total quantity'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Total quantity available in inventory')
    )
    quantity_available = models.IntegerField(
        _('available quantity'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity currently available for rent')
    )
    quantity_rented = models.IntegerField(
        _('rented quantity'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity currently rented')
    )
    quantity_maintenance = models.IntegerField(
        _('maintenance quantity'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Quantity under maintenance')
    )
    low_stock_threshold = models.IntegerField(
        _('low stock threshold'),
        default=1,
        validators=[MinValueValidator(0)],
        help_text=_('Alert when available quantity falls below this')
    )
    last_restocked = models.DateTimeField(_('last restocked'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('مخزون المتغير')
        verbose_name_plural = _('مخزونات المتغيرات')
        indexes = [
            models.Index(fields=['quantity_available']),
            models.Index(fields=['variant', 'quantity_available']),
        ]
    
    def __str__(self):
        return f"{self.variant.name} - Available: {self.quantity_available}/{self.quantity_total}"
    
    def is_low_stock(self):
        """Check if stock is low"""
        return self.quantity_available <= self.low_stock_threshold
    
    def is_in_stock(self):
        """Check if variant is in stock"""
        return self.quantity_available > 0
    
    def get_availability_status(self):
        """Get availability status"""
        if not self.is_in_stock():
            return 'out_of_stock'
        elif self.is_low_stock():
            return 'low_stock'
        else:
            return 'in_stock'


@receiver(post_save, sender='products.ProductVariant')
def create_variant_inventory(sender, instance, created, **kwargs):
    """Create inventory item when variant is created"""
    if created:
        VariantInventory.objects.get_or_create(
            variant=instance,
            defaults={
                'quantity_total': 1,
                'quantity_available': 1,
            }
        )
