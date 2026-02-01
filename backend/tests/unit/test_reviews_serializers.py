"""
Unit tests for reviews Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.reviews.serializers import ReviewSerializer, ReviewCreateSerializer, ReviewImageSerializer
from apps.reviews.models import Review, ReviewImage
from apps.products.models import Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewSerializer:
    """Test ReviewSerializer"""
    
    def test_serializer_read_fields(self, regular_user, product):
        """Test serializer output includes all expected fields"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Great product!',
            comment='Really enjoyed this',
            status='approved'
        )
        
        serializer = ReviewSerializer(review)
        data = serializer.data
        
        # Check all fields are present
        assert 'id' in data
        assert 'user_email' in data
        assert 'user_username' in data
        assert 'product' in data
        assert 'rating' in data
        assert 'title' in data
        assert 'comment' in data
        assert 'status' in data
        assert 'helpful_count' in data
        assert 'created_at' in data
        assert 'updated_at' in data
        
        assert data['user_email'] == regular_user.email
        assert data['rating'] == 5
        assert data['title'] == 'Great product!'
    
    def test_serializer_with_images(self, regular_user, product):
        """Test serializer includes review images"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=4,
            title='Good',
            comment='Test comment'
        )
        
        # Note: In tests we can't actually upload files, but we can check the field exists
        serializer = ReviewSerializer(review)
        data = serializer.data
        
        assert 'images' in data
        assert isinstance(data['images'], list)
    
    def test_serializer_read_only_fields(self, regular_user, product):
        """Test that certain fields are read-only"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=3,
            title='Okay',
            comment='Average'
        )
        
        # Try to modify read-only fields
        data = {
            'rating': 5,
            'status': 'approved',  # Read-only
            'helpful_count': 100,   # Read-only
        }
        
        serializer = ReviewSerializer(review, data=data, partial=True)
        assert serializer.is_valid()
        
        updated = serializer.save()
        # Rating should update, but status and helpful_count should not
        assert updated.rating == 5
        assert updated.status != 'approved'  # Should still be pending or original
        assert updated.helpful_count == 0


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewCreateSerializer:
    """Test ReviewCreateSerializer"""
    
    def test_create_serializer_valid_data(self, product):
        """Test serializer with valid review data"""
        data = {
            'product_id': product.id,
            'rating': 5,
            'title': 'Excellent!',
            'comment': 'Amazing product, highly recommend'
        }
        
        serializer = ReviewCreateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data['rating'] == 5
        assert serializer.validated_data['product_id'] == product.id
    
    def test_create_serializer_required_fields(self):
        """Test that required fields are validated"""
        data = {}
        serializer = ReviewCreateSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'product_id' in serializer.errors
        assert 'rating' in serializer.errors
        assert 'title' in serializer.errors
        assert 'comment' in serializer.errors
    
    def test_create_serializer_with_booking(self, product, booking):
        """Test serializer with booking_id"""
        data = {
            'product_id': product.id,
            'booking_id': booking.id,
            'rating': 4,
            'title': 'Good',
            'comment': 'Nice product'
        }
        
        serializer = ReviewCreateSerializer(data=data)
        assert serializer.is_valid()
        assert 'booking_id' in serializer.validated_data
    
    def test_create_serializer_invalid_rating(self, product):
        """Test that rating must be between 1 and 5"""
        data = {
            'product_id': product.id,
            'rating': 6,  # Invalid
            'title': 'Test',
            'comment': 'Test comment'
        }
        
        serializer = ReviewCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'rating' in serializer.errors


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewImageSerializer:
    """Test ReviewImageSerializer"""
    
    def test_image_serializer_fields(self):
        """Test that image serializer has correct fields"""
        serializer = ReviewImageSerializer()
        fields = serializer.fields.keys()
        
        assert 'id' in fields
        assert 'image' in fields
        assert 'alt_text' in fields
        assert 'order' in fields
