"""
Unit tests for Reviews models
"""
import pytest
from apps.reviews.models import Review
from apps.products.models import Category, Product


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewModel:
    """Test Review model"""
    
    def test_create_review(self, regular_user, product):
        """Test creating a review"""
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Great dress!',
            title_ar='فسستان رائع!',
            comment='Very satisfied',
            comment_ar='راضية جداً',
            status='approved'
        )
        
        assert review.user == regular_user
        assert review.product == product
        assert review.rating == 5
        assert review.status == 'approved'
    
    def test_review_rating_range(self, regular_user, product):
        """Test review rating is within valid range"""
        # Valid ratings: 1-5
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            title_ar='تجريبي',
            comment='Test',
            comment_ar='تجريبي'
        )
        
        assert 1 <= review.rating <= 5
    
    def test_review_moderation(self, regular_user, product):
        """Test review moderation workflow"""
        # Create pending review
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            title='Test',
            title_ar='تجريبي',
            comment='Test',
            comment_ar='تجريبي',
            status='pending'
        )
        
        assert review.status == 'pending'
        
        # Approve review
        review.status = 'approved'
        review.save()
        assert review.status == 'approved'
        
        # Reject review
        review.status = 'rejected'
        review.save()
        assert review.status == 'rejected'

