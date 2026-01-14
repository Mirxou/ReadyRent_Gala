"""
Unit tests for artisans Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.artisans.serializers import (
    ArtisanSerializer, ArtisanPortfolioSerializer, ArtisanReviewSerializer
)
from apps.artisans.models import Artisan, ArtisanPortfolio, ArtisanReview

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisanSerializer:
    """Test Artisan serializer"""
    
    def test_artisan_serialization(self, regular_user, api_client):
        """Test artisan serialization"""
        artisan = Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            bio='Test bio',
            bio_ar='سيرة تجريبية',
            phone='+213123456789',
            city='Constantine',
            is_active=True
        )
        
        serializer = ArtisanSerializer(artisan)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'specialty' in data
        assert 'portfolio_items' in data
        assert 'reviews' in data
        assert data['name_ar'] == 'حرفي تجريبي'
    
    def test_artisan_with_portfolio(self, regular_user, api_client):
        """Test artisan serialization with portfolio"""
        artisan = Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        ArtisanPortfolio.objects.create(
            artisan=artisan,
            title='Portfolio Item',
            title_ar='عنصر محفظة',
            order=1
        )
        
        serializer = ArtisanSerializer(artisan)
        data = serializer.data
        
        assert len(data['portfolio_items']) == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisanPortfolioSerializer:
    """Test ArtisanPortfolio serializer"""
    
    def test_portfolio_serialization(self, regular_user, api_client):
        """Test portfolio serialization"""
        artisan = Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        portfolio = ArtisanPortfolio.objects.create(
            artisan=artisan,
            title='Portfolio Item',
            title_ar='عنصر محفظة',
            order=1
        )
        
        serializer = ArtisanPortfolioSerializer(portfolio)
        data = serializer.data
        
        assert 'id' in data
        assert 'artisan' in data
        assert 'title' in data
        assert 'title_ar' in data
        assert 'order' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisanReviewSerializer:
    """Test ArtisanReview serializer"""
    
    def test_review_serialization(self, regular_user, api_client):
        """Test review serialization"""
        artisan = Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        review = ArtisanReview.objects.create(
            artisan=artisan,
            user=regular_user,
            rating=5,
            comment='Great work!'
        )
        
        serializer = ArtisanReviewSerializer(review)
        data = serializer.data
        
        assert 'id' in data
        assert 'artisan' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'rating' in data
        assert 'comment' in data
        assert data['rating'] == 5
