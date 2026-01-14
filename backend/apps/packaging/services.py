"""
Packaging services for automatic packaging selection
"""
from .models import PackagingRule, PackagingType, PackagingMaterial, PackagingInstance


class PackagingService:
    """Service for packaging operations"""
    
    @staticmethod
    def get_packaging_for_product(product, rental_days):
        """
        Get recommended packaging for a product based on rules
        """
        # Try product-specific rule first
        rule = PackagingRule.objects.filter(
            product=product,
            is_active=True,
            min_rental_days__lte=rental_days,
        ).exclude(max_rental_days__lt=rental_days).order_by('-priority').first()
        
        if rule:
            return rule.packaging_type
        
        # Try category rule
        if product.category:
            rule = PackagingRule.objects.filter(
                product_category=product.category,
                product__isnull=True,
                is_active=True,
                min_rental_days__lte=rental_days,
            ).exclude(max_rental_days__lt=rental_days).order_by('-priority').first()
            
            if rule:
                return rule.packaging_type
        
        # Default to medium size
        return PackagingType.objects.filter(size='medium', is_active=True).first()
    
    @staticmethod
    def create_packaging_for_booking(booking):
        """
        Create packaging instance for a booking
        """
        rental_days = booking.total_days
        product = booking.product
        
        packaging_type = PackagingService.get_packaging_for_product(product, rental_days)
        
        if not packaging_type:
            return None
        
        # Create packaging instance
        packaging = PackagingInstance.objects.create(
            booking=booking,
            packaging_type=packaging_type,
            status='prepared'
        )
        
        # Add default materials based on packaging type and product
        # TODO: Add logic to select materials based on product type
        
        return packaging

