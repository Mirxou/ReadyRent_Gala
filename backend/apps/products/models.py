"""
Product models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class Category(models.Model):
    """Product categories"""
    name = models.CharField(_('name'), max_length=100)
    name_ar = models.CharField(_('name (Arabic)'), max_length=100)
    slug = models.SlugField(_('slug'), unique=True)
    description = models.TextField(_('description'), blank=True)
    image = models.ImageField(_('image'), upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('الفئة')
        verbose_name_plural = _('الفئات')
        ordering = ['name']
    
    def __str__(self):
        return self.name_ar or self.name
    
    def save(self, *args, **kwargs):
        """Override save to invalidate cache"""
        super().save(*args, **kwargs)
        # Invalidate category cache when category is updated
        from core.cache_utils import invalidate_category_cache
        invalidate_category_cache()
    
    def delete(self, *args, **kwargs):
        """Override delete to invalidate cache"""
        from core.cache_utils import invalidate_category_cache
        invalidate_category_cache()
        super().delete(*args, **kwargs)


class Product(models.Model):
    """Product model"""
    SIZE_CHOICES = [
        ('XS', _('XS')),
        ('S', _('S')),
        ('M', _('M')),
        ('L', _('L')),
        ('XL', _('XL')),
        ('XXL', _('XXL')),
        ('XXXL', _('XXXL')),
    ]
    
    STATUS_CHOICES = [
        ('available', _('Available')),
        ('rented', _('Rented')),
        ('maintenance', _('Under Maintenance')),
        ('unavailable', _('Unavailable')),
    ]
    
    name = models.CharField(_('name'), max_length=200)
    name_ar = models.CharField(_('name (Arabic)'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True)
    description = models.TextField(_('description'))
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name=_('category')
    )
    price_per_day = models.DecimalField(_('price per day'), max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    size = models.CharField(_('size'), max_length=10, choices=SIZE_CHOICES)
    color = models.CharField(_('color'), max_length=50)
    color_hex = models.CharField(_('color hex'), max_length=7, blank=True, help_text=_('Hex color code (e.g., #FF5733)'))
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='available')
    is_featured = models.BooleanField(_('featured'), default=False)
    rating = models.DecimalField(_('rating'), max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_rentals = models.IntegerField(_('total rentals'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('المنتج')
        verbose_name_plural = _('المنتجات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['is_featured', 'status']),
            models.Index(fields=['name', 'name_ar']),  # For search performance
            models.Index(fields=['price_per_day', 'status']),  # For price filtering
            models.Index(fields=['rating', 'total_rentals']),  # For sorting
        ]
    
    def __str__(self):
        return self.name_ar or self.name


class ProductImage(models.Model):
    """Product images"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images',
        verbose_name=_('product'))
    image = models.ImageField(_('image'), upload_to='products/')
    thumbnail = models.ImageField(_('thumbnail'), upload_to='products/thumbnails/', blank=True, null=True)
    small = models.ImageField(_('small'), upload_to='products/small/', blank=True, null=True)
    medium = models.ImageField(_('medium'), upload_to='products/medium/', blank=True, null=True)
    alt_text = models.CharField(_('alt text'), max_length=200, blank=True)
    is_primary = models.BooleanField(_('primary'), default=False)
    order = models.IntegerField(_('order'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('صورة المنتج')
        verbose_name_plural = _('صور المنتجات')
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.product.name} - Image {self.order}"
    
    def save(self, *args, **kwargs):
        """Override save to generate thumbnails"""
        from core.image_optimization import ImageOptimizationService
        
        # Only optimize if image is new or changed
        if self.pk is None or self.image:
            # Optimize main image
            if self.image and hasattr(self.image, 'file'):
                optimized_image = ImageOptimizationService.optimize_image(
                    self.image.file,
                    max_size=(1920, 1920),
                    quality=85
                )
                if optimized_image:
                    self.image.file = optimized_image
                    
                    # Generate thumbnails
                    if not self.thumbnail:
                        self.thumbnail = ImageOptimizationService.generate_thumbnail(
                            optimized_image,
                            'thumbnail'
                        )
                    if not self.small:
                        self.small = ImageOptimizationService.generate_thumbnail(
                            optimized_image,
                            'small'
                        )
                    if not self.medium:
                        self.medium = ImageOptimizationService.generate_thumbnail(
                            optimized_image,
                            'medium'
                        )
        
        super().save(*args, **kwargs)
        
        # Invalidate product cache when image is added/updated
        if self.product:
            from core.cache_utils import invalidate_product_cache
            invalidate_product_cache(slug=self.product.slug)
    
    def get_thumbnail_url(self):
        """Get thumbnail URL with CDN if configured"""
        from core.image_optimization import ImageOptimizationService
        return ImageOptimizationService.get_image_url(self.thumbnail) or self.image.url if self.image else None
    
    def get_small_url(self):
        """Get small size URL"""
        from core.image_optimization import ImageOptimizationService
        return ImageOptimizationService.get_image_url(self.small) or self.image.url if self.image else None
    
    def get_medium_url(self):
        """Get medium size URL"""
        from core.image_optimization import ImageOptimizationService
        return ImageOptimizationService.get_image_url(self.medium) or self.image.url if self.image else None


class ProductVariant(models.Model):
    """Product variants (size, color, style)"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants',
        verbose_name=_('product'))
    name = models.CharField(_('name'), max_length=100, help_text=_('e.g., "Size M - Red"'))
    size = models.CharField(_('size'), max_length=10, choices=Product.SIZE_CHOICES, blank=True)
    color = models.CharField(_('color'), max_length=50, blank=True)
    color_hex = models.CharField(_('color hex'), max_length=7, blank=True)
    style = models.CharField(_('style'), max_length=50, blank=True)
    sku = models.CharField(_('SKU'), max_length=100, unique=True, blank=True)
    price_per_day = models.DecimalField(_('price per day'), max_digits=10, decimal_places=2, null=True, blank=True, help_text=_('Override product price if set'))
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('متغير المنتج')
        verbose_name_plural = _('متغيرات المنتجات')
        unique_together = ['product', 'size', 'color', 'style']
        ordering = ['size', 'color']
        indexes = [
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['sku']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    def get_price(self):
        """Get price (variant price or product price)"""
        return self.price_per_day if self.price_per_day else self.product.price_per_day
    
    def save(self, *args, **kwargs):
        """Generate SKU if not provided"""
        if not self.sku:
            base_sku = self.product.slug.upper()[:10]
            variant_part = f"{self.size or 'DEF'}-{self.color[:3].upper() or 'DEF'}"
            self.sku = f"{base_sku}-{variant_part}"
        super().save(*args, **kwargs)


class Wishlist(models.Model):
    """User wishlist/favorites"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        verbose_name=_('user'))
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        verbose_name=_('product'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('عنصر قائمة الأمنيات')
        verbose_name_plural = _('عناصر قائمة الأمنيات')
        unique_together = ['user', 'product']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['product']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name_ar}"

