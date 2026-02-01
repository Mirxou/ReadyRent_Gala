"""
Unit tests for reviews Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

from apps.reviews.models import Review
from apps.products.models import Product
from apps.bookings.models import Booking

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewCreateView:
    """Test ReviewCreateView"""
    
    @patch('apps.reviews.views.SentimentAnalysisService')
    def test_create_review_authenticated(self, mock_sentiment, api_client, regular_user, product):
        """Test creating a review as authenticated user"""
        # Mock sentiment analysis
        mock_sentiment_instance = MagicMock()
        mock_sentiment_instance.analyze_sentiment.return_value = {
            'score': 0.8,
            'label': 'positive'
        }
        mock_sentiment.return_value = mock_sentiment_instance
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/reviews/create/', {
            'product_id': product.id,
            'rating': 5,
            'title': 'Great product',
            'comment': 'Really enjoyed using this'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Review.objects.filter(user=regular_user, product=product).exists()
        
        review = Review.objects.get(user=regular_user, product=product)
        assert review.rating == 5
        assert review.title == 'Great product'
        assert review.sentiment_label == 'positive'
    
    def test_create_review_unauthenticated(self, api_client, product):
        """Test that unauthenticated users cannot create reviews"""
        response = api_client.post('/api/reviews/create/', {
            'product_id': product.id,
            'rating': 5,
            'title': 'Test',
            'comment': 'Test'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @patch('apps.reviews.views.SentimentAnalysisService')
    def test_create_review_with_booking(self, mock_sentiment, api_client, regular_user, product, booking):
        """Test creating verified review with booking"""
        # Mock sentiment
        mock_sentiment_instance = MagicMock()
        mock_sentiment_instance.analyze_sentiment.return_value = {
            'score': 0.5,
            'label': 'neutral'
        }
        mock_sentiment.return_value = mock_sentiment_instance
        
        # Update booking to completed
        booking.status = 'completed'
        booking.save()
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/reviews/create/', {
            'product_id': product.id,
            'booking_id': booking.id,
            'rating': 4,
            'title': 'Good',
            'comment': 'Nice product'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        review = Review.objects.get(user=regular_user, product=product)
        assert review.is_verified_purchase
        assert review.booking == booking
    
    @patch('apps.reviews.views.SentimentAnalysisService')
    def test_create_review_invalid_data(self, mock_sentiment, api_client, regular_user):
        """Test creating review with invalid data"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/reviews/create/', {
            'product_id': 9999,  # Non-existent
            'rating': 10,  # Invalid rating
            'title': '',
            'comment': ''
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewListView:
    """Test ReviewListView"""
    
    def test_list_approved_reviews(self, api_client, regular_user, product):
        """Test listing approved reviews"""
        # Create approved and pending reviews
        Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Approved',
            comment='Good',
            status='approved'
        )
        Review.objects.create(
            user=regular_user,
            product=product,
            rating=3,
            title='Pending',
            comment='Okay',
            status='pending'
        )
        
        response = api_client.get('/api/reviews/')
        
        assert response.status_code == status.HTTP_200_OK
        # Only approved reviews should be listed
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'Approved'
    
    def test_list_reviews_filter_by_product(self, api_client, regular_user, product, category):
        """Test filtering reviews by product"""
        # Create another product
        other_product = Product.objects.create(
            name='Other Product',
            category=category,
            price_per_day=1000,
            status='available'
        )
        
        # Create reviews for different products
        Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Review 1',
            comment='For product 1',
            status='approved'
        )
        Review.objects.create(
            user=regular_user,
            product=other_product,
            rating=4,
            title='Review 2',
            comment='For product 2',
            status='approved'
        )
        
        response = api_client.get(f'/api/reviews/?product={product.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'Review 1'
    
    def test_list_reviews_no_auth_required(self, api_client, regular_user, product):
        """Test that listing reviews doesn't require authentication"""
        Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Public review',
            comment='Anyone can see this',
            status='approved'
        )
        
        # No authentication
        response = api_client.get('/api/reviews/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewModerationView:
    """Test ReviewModerationView"""
    
    def test_moderate_review_as_admin(self, api_client, admin_user, regular_user, product):
        """Test moderating review as admin"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            comment='Test',
            status='pending'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(f'/api/reviews/{review.id}/moderate/', {
            'status': 'approved'
        })
        
        assert response.status_code == status.HTTP_200_OK
        review.refresh_from_db()
        assert review.status == 'approved'
    
    def test_moderate_review_non_admin(self, api_client, regular_user, product):
        """Test that non-admin users cannot moderate"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            comment='Test',
            status='pending'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.patch(f'/api/reviews/{review.id}/moderate/', {
            'status': 'approved'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_moderate_review_unauthenticated(self, api_client, regular_user, product):
        """Test that unauthenticated users cannot moderate"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            comment='Test',
            status='pending'
        )
        
        response = api_client.patch(f'/api/reviews/{review.id}/moderate/', {
            'status': 'approved'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_moderate_review_invalid_status(self, api_client, admin_user, regular_user, product):
        """Test moderating with invalid status"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            comment='Test',
            status='pending'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(f'/api/reviews/{review.id}/moderate/', {
            'status': 'invalid_status'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_moderate_review_reject(self, api_client, admin_user, regular_user, product):
        """Test rejecting a review"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=1,
            title='Bad',
            comment='Spam',
            status='pending'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(f'/api/reviews/{review.id}/moderate/', {
            'status': 'rejected'
        })
        
        assert response.status_code == status.HTTP_200_OK
        review.refresh_from_db()
        assert review.status == 'rejected'
