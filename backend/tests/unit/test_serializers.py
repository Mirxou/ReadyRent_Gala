"""
Unit tests for Serializers
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from apps.products.models import Category, Product
from apps.cms.models import Page, FAQ


@pytest.mark.unit
@pytest.mark.django_db
class TestProductSerializer:
    """Test Product serializer"""
    
    def test_product_serialization(self, product, api_client):
        """Test product serialization"""
        response = api_client.get(f'/api/products/{product.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert 'name' in response.data
        assert 'name_ar' in response.data
        assert 'price_per_day' in response.data
    
    def test_product_list_serialization(self, api_client):
        """Test product list serialization"""
        response = api_client.get('/api/products/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict) or isinstance(response.data, list)


@pytest.mark.unit
@pytest.mark.django_db
class TestCMSSerializers:
    """Test CMS serializers"""
    
    def test_page_serialization(self, admin_user, api_client):
        """Test page serialization"""
        page = Page.objects.create(
            title='Test Page',
            title_ar='صفحة تجريبية',
            slug='test-page',
            content='Content',
            content_ar='محتوى',
            created_by=admin_user,
            status='published'
        )
        
        response = api_client.get(f'/api/cms/pages/{page.id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_faq_serialization(self, api_client):
        """Test FAQ serialization"""
        faq = FAQ.objects.create(
            question='Test Question',
            question_ar='سؤال تجريبي',
            answer='Answer',
            answer_ar='إجابة'
        )
        
        response = api_client.get(f'/api/cms/faqs/{faq.id}/')
        assert response.status_code == status.HTTP_200_OK

