"""
Serializers for Review app
"""
from rest_framework import serializers
from .models import Review, ReviewImage
from apps.products.serializers import ProductListSerializer


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer for ReviewImage"""
    class Meta:
        model = ReviewImage
        fields = ['id', 'image', 'alt_text', 'order']


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    booking_id = serializers.IntegerField(write_only=True, required=False)
    images = ReviewImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_email', 'user_username',
            'product', 'product_id', 'booking', 'booking_id',
            'rating', 'title', 'comment', 'status',
            'is_verified_purchase', 'helpful_count',
            'sentiment_score', 'sentiment_label',
            'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'helpful_count', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate review"""
        # Check if user has completed booking for this product
        booking_id = data.get('booking_id')
        if booking_id:
            from apps.bookings.models import Booking
            try:
                booking = Booking.objects.get(
                    pk=booking_id,
                    user=self.context['request'].user,
                    product_id=data['product_id'],
                    status='completed'
                )
                data['booking'] = booking
                data['is_verified_purchase'] = True
            except Booking.DoesNotExist:
                raise serializers.ValidationError({
                    'booking_id': 'Invalid booking or booking not completed'
                })
        
        return data


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""
    product_id = serializers.IntegerField()
    booking_id = serializers.IntegerField(required=False)
    
    class Meta:
        model = Review
        fields = [
            'product_id', 'booking_id', 'rating',
            'title', 'comment'
        ]

