"""
Serializers for Product app
"""
from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_ar', 'slug', 'description', 'image', 'is_active']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage"""
    thumbnail_url = serializers.SerializerMethodField()
    small_url = serializers.SerializerMethodField()
    medium_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'image_url', 'thumbnail_url', 'small_url', 'medium_url',
            'alt_text', 'is_primary', 'order'
        ]
        read_only_fields = ['thumbnail_url', 'small_url', 'medium_url', 'image_url']
    
    def get_image_url(self, obj):
        """Get full image URL with CDN"""
        from core.image_optimization import ImageOptimizationService
        request = self.context.get('request')
        if obj.image:
            url = ImageOptimizationService.get_image_url(obj.image)
            if request:
                return request.build_absolute_uri(url) if not url.startswith('http') else url
            return url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        from core.image_optimization import ImageOptimizationService
        request = self.context.get('request')
        if obj.thumbnail:
            url = ImageOptimizationService.get_image_url(obj.thumbnail)
        elif obj.image:
            url = ImageOptimizationService.get_image_url(obj.image)
        else:
            return None
        
        if request:
            return request.build_absolute_uri(url) if not url.startswith('http') else url
        return url
    
    def get_small_url(self, obj):
        """Get small size URL"""
        from core.image_optimization import ImageOptimizationService
        request = self.context.get('request')
        if obj.small:
            url = ImageOptimizationService.get_image_url(obj.small)
        elif obj.image:
            url = ImageOptimizationService.get_image_url(obj.image)
        else:
            return None
        
        if request:
            return request.build_absolute_uri(url) if not url.startswith('http') else url
        return url
    
    def get_medium_url(self, obj):
        """Get medium size URL"""
        from core.image_optimization import ImageOptimizationService
        request = self.context.get('request')
        if obj.medium:
            url = ImageOptimizationService.get_image_url(obj.medium)
        elif obj.image:
            url = ImageOptimizationService.get_image_url(obj.image)
        else:
            return None
        
        if request:
            return request.build_absolute_uri(url) if not url.startswith('http') else url
        return url


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'name_ar', 'slug', 'description', 'description_ar',
            'category', 'category_id', 'price_per_day', 'size', 'color', 'color_hex',
            'status', 'is_featured', 'rating', 'total_rentals', 'images',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'rating', 'total_rentals', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists"""
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'name_ar', 'slug', 'category', 'price_per_day',
            'size', 'color', 'status', 'is_featured', 'rating', 'primary_image'
        ]
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for Product Variant"""
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    availability_status = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'product_name', 'name', 'size', 'color', 'color_hex',
            'style', 'sku', 'price_per_day', 'price', 'is_active',
            'availability_status', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sku', 'created_at', 'updated_at']
    
    def get_availability_status(self, obj):
        """Get availability status from inventory"""
        if hasattr(obj, 'inventory'):
            return obj.inventory.get_availability_status()
        return 'unknown'
    
    def get_is_available(self, obj):
        """Check if variant is available"""
        if hasattr(obj, 'inventory'):
            return obj.inventory.is_in_stock()
        return False
    
    def get_price(self, obj):
        """Get price (variant or product price)"""
        return float(obj.get_price())


class ProductVariantListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for variant lists"""
    availability_status = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'size', 'color', 'color_hex', 'style',
            'sku', 'price', 'is_active', 'availability_status', 'is_available'
        ]
    
    def get_availability_status(self, obj):
        if hasattr(obj, 'inventory'):
            return obj.inventory.get_availability_status()
        return 'unknown'
    
    def get_is_available(self, obj):
        if hasattr(obj, 'inventory'):
            return obj.inventory.is_in_stock()
        return False
    
    def get_price(self, obj):
        return float(obj.get_price())


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for Wishlist"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'created_at']

