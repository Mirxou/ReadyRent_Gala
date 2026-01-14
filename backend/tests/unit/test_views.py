"""
Unit tests for Views
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestProductViews:
    """Test Product views"""
    
    def test_list_products(self, api_client):
        """Test listing products"""
        response = api_client.get('/api/products/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_product_detail(self, product, api_client):
        """Test product detail view"""
        response = api_client.get(f'/api/products/{product.id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_product_search(self, api_client):
        """Test product search"""
        response = api_client.get('/api/products/?search=test')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestBookingViews:
    """Test Booking views"""
    
    def test_list_bookings_requires_auth(self, api_client):
        """Test listing bookings requires authentication"""
        response = api_client.get('/api/bookings/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_booking_requires_auth(self, api_client):
        """Test creating booking requires authentication"""
        response = api_client.post('/api/bookings/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestCMSViews:
    """Test CMS views"""
    
    def test_list_pages(self, api_client):
        """Test listing pages"""
        response = api_client.get('/api/cms/pages/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_faqs(self, api_client):
        """Test listing FAQs"""
        response = api_client.get('/api/cms/faqs/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_health_check(self, api_client):
        """Test health check endpoint"""
        response = api_client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data

