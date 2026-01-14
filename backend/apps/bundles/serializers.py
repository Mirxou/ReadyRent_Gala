from rest_framework import serializers
from .models import BundleCategory, Bundle, BundleItem, BundleBooking, BundleReview


class BundleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    product_price = serializers.DecimalField(source='product.price_per_day', read_only=True, max_digits=10, decimal_places=2)
    item_name = serializers.CharField(read_only=True)
    item_price = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = BundleItem
        fields = [
            'id', 'item_type', 'product', 'product_name', 'product_price',
            'custom_name', 'custom_description', 'custom_price',
            'quantity', 'is_required', 'order',
            'item_name', 'item_price'
        ]


class BundleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name_ar', read_only=True)
    items = BundleItemSerializer(many=True, read_only=True)
    discount_amount = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    savings = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    discount_percentage = serializers.DecimalField(read_only=True, max_digits=5, decimal_places=2)
    
    class Meta:
        model = Bundle
        fields = [
            'id', 'name', 'name_ar', 'slug',
            'description', 'description_ar',
            'category', 'category_name',
            'base_price', 'bundle_price',
            'discount_type', 'discount_value',
            'discount_amount', 'savings', 'discount_percentage',
            'min_days', 'max_days',
            'is_featured', 'is_active',
            'total_bookings', 'rating',
            'image', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_bookings', 'rating', 'created_at', 'updated_at']


class BundleCategorySerializer(serializers.ModelSerializer):
    bundles_count = serializers.IntegerField(source='bundles.count', read_only=True)
    
    class Meta:
        model = BundleCategory
        fields = [
            'id', 'name', 'name_ar', 'slug',
            'description', 'icon', 'is_active',
            'bundles_count', 'created_at'
        ]


class BundleBookingSerializer(serializers.ModelSerializer):
    bundle_details = BundleSerializer(source='bundle', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    savings = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = BundleBooking
        fields = [
            'id', 'user', 'user_email',
            'bundle', 'bundle_details',
            'start_date', 'end_date', 'total_days',
            'base_price', 'discount_amount', 'total_price', 'savings',
            'status', 'individual_bookings', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class BundleReviewSerializer(serializers.ModelSerializer):
    bundle_name = serializers.CharField(source='bundle_booking.bundle.name_ar', read_only=True)
    
    class Meta:
        model = BundleReview
        fields = [
            'id', 'bundle_booking', 'bundle_name',
            'rating', 'comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

