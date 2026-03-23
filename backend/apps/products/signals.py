from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Product, ProductImage
from core.image_optimization import ImageOptimizationService

@receiver(pre_save, sender=ProductImage)
def optimize_product_image(sender, instance, **kwargs):
    """
    Sanitize and optimize product images before saving.
    Acts as an Image Firewall:
    1. Strips Metadata (EXIF)
    2. Resizes to max dimensions
    3. Converts to safe WebP/JPEG format
    """
    if instance.image:
        # Check if this is a new upload (no pk) or if image changed
        if not instance.pk:
            is_new_image = True
        else:
            try:
                old_img = ProductImage.objects.get(pk=instance.pk).image
                is_new_image = old_img != instance.image
            except ProductImage.DoesNotExist:
                is_new_image = True

        if is_new_image:
            optimized_image = ImageOptimizationService.optimize_image(
                instance.image,
                max_size=(1920, 1920),
                quality=85
            )
            instance.image = optimized_image
