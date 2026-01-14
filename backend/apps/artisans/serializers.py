from rest_framework import serializers
from .models import Artisan, ArtisanPortfolio, ArtisanReview


class ArtisanPortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtisanPortfolio
        fields = [
            'id', 'artisan', 'title', 'title_ar',
            'description', 'image', 'order', 'is_featured', 'created_at'
        ]
        read_only_fields = ['created_at']


class ArtisanReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = ArtisanReview
        fields = [
            'id', 'artisan', 'user', 'user_email',
            'rating', 'comment', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ArtisanSerializer(serializers.ModelSerializer):
    portfolio_items = ArtisanPortfolioSerializer(many=True, read_only=True)
    reviews = ArtisanReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Artisan
        fields = [
            'id', 'user', 'name', 'name_ar', 'specialty',
            'bio', 'bio_ar',
            'phone', 'email', 'whatsapp', 'instagram', 'facebook',
            'address', 'city', 'latitude', 'longitude',
            'profile_image', 'cover_image', 'portfolio_description',
            'rating', 'review_count', 'project_count',
            'is_featured', 'is_verified', 'is_active',
            'portfolio_items', 'reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'review_count', 'project_count', 'created_at', 'updated_at']

