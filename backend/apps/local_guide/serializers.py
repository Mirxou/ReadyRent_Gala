from rest_framework import serializers
from .models import ServiceCategory, LocalService, ServiceImage, ServiceReview


class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ServiceReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = ServiceReview
        fields = [
            'id', 'service', 'user', 'user_email',
            'rating', 'comment', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LocalServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name_ar', read_only=True)
    images = ServiceImageSerializer(many=True, read_only=True)
    reviews = ServiceReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = LocalService
        fields = [
            'id', 'name', 'name_ar', 'service_type', 'category', 'category_name',
            'description', 'description_ar',
            'phone', 'email', 'website', 'whatsapp',
            'address', 'city', 'latitude', 'longitude',
            'price_range_min', 'price_range_max', 'price_note',
            'logo', 'cover_image',
            'rating', 'review_count',
            'is_featured', 'is_verified', 'is_active',
            'images', 'reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'review_count', 'created_at', 'updated_at']


class ServiceCategorySerializer(serializers.ModelSerializer):
    services_count = serializers.IntegerField(source='services.count', read_only=True)
    
    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'name_ar', 'slug',
            'icon', 'description', 'is_active',
            'services_count'
        ]

