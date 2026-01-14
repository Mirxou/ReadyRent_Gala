"""
Unit tests for artisans Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.artisans.models import Artisan, ArtisanPortfolio, ArtisanReview

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisanViewSet:
    """Test Artisan ViewSet"""
    
    def test_list_artisans(self, api_client):
        """Test listing artisans (public endpoint)"""
        Artisan.objects.create(
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        response = api_client.get('/api/artisans/artisans/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_retrieve_artisan(self, api_client):
        """Test retrieving artisan"""
        artisan = Artisan.objects.create(
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        response = api_client.get(f'/api/artisans/artisans/{artisan.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == artisan.id
    
    def test_filter_by_specialty(self, api_client):
        """Test filtering artisans by specialty"""
        Artisan.objects.create(
            name='Designer',
            name_ar='مصمم',
            specialty='dress_designer',
            is_active=True
        )
        
        response = api_client.get('/api/artisans/artisans/?specialty=dress_designer')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisanReviewViewSet:
    """Test ArtisanReview ViewSet"""
    
    def test_list_reviews_requires_auth(self, api_client):
        """Test listing reviews requires authentication"""
        response = api_client.get('/api/artisans/reviews/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_review(self, api_client, regular_user):
        """Test creating review"""
        artisan = Artisan.objects.create(
            name='Test Artisan',
            name_ar='حرفي تجريبي',
            specialty='dress_designer',
            is_active=True
        )
        
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/artisans/reviews/', {
            'artisan': artisan.id,
            'rating': 5,
            'comment': 'Great work!'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 5
        
        # Verify artisan rating was updated
        artisan.refresh_from_db()
        assert artisan.rating > 0
