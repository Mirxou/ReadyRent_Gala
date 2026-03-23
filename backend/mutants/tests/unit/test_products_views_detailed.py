import pytest
from rest_framework import status
from decimal import Decimal
from django.contrib.auth import get_user_model

from apps.products.models import Category, Product, Wishlist

User = get_user_model()

@pytest.fixture
def product_factory(db):
    def create_product(name, name_ar, price, category, status='available', size='M', color='Red'):
        return Product.objects.create(
            name=name,
            name_ar=name_ar,
            price_per_day=Decimal(str(price)),
            category=category,
            status=status,
            size=size,
            color=color,
            slug=name.lower().replace(' ', '-')
        )
    return create_product

@pytest.mark.unit
@pytest.mark.django_db
class TestProductAdvancedViews:
    """Test advanced Product views and filtering"""
    
    def test_product_list_filtering(self, api_client, product_factory):
        category = Category.objects.create(name='Dresses', slug='dresses')
        product_factory('Red Dress', 'فستان أحمر', 1000, category, color='Red', size='L')
        product_factory('Blue Dress', 'فستان أزرق', 2000, category, color='Blue', size='M')
        
        # Filter by color
        response = api_client.get('/api/products/?color=Red')
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if isinstance(response.data, dict) else response.data
        assert len(results) == 1
        assert results[0]['color'] == 'Red'
        
        # Filter by price range
        response = api_client.get('/api/products/?price_min=1500&price_max=2500')
        results = response.data['results'] if isinstance(response.data, dict) else response.data
        assert len(results) == 1
        assert Decimal(results[0]['price_per_day']) == Decimal('2000.00')

    def test_search_suggestions(self, api_client, product_factory):
        category = Category.objects.create(name='Dresses', slug='dresses')
        product_factory('Evening Gown', 'ثوب سهرة', 5000, category)
        
        response = api_client.get('/api/products/search-suggestions/?q=Even')
        assert response.status_code == status.HTTP_200_OK
        assert 'suggestions' in response.data
        assert any(s['type'] == 'product' for s in response.data['suggestions'])

    def test_product_metadata(self, api_client):
        response = api_client.get('/api/products/metadata/')
        assert response.status_code == status.HTTP_200_OK
        assert 'sizes' in response.data
        assert 'colors' in response.data
        assert 'price_range' in response.data

@pytest.mark.unit
@pytest.mark.django_db
class TestWishlistActions:
    """Test Wishlist management"""
    
    def test_wishlist_toggle(self, api_client, product_factory):
        user = User.objects.create_user(username='wuser', email='w@example.com', password='pass')
        category = Category.objects.create(name='Accessories', slug='acc')
        product = product_factory('Gold Ring', 'خاتم ذهب', 100, category)
        api_client.force_authenticate(user=user)
        
        # Add to wishlist
        response = api_client.post(f'/api/products/wishlist/toggle/{product.id}/')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['in_wishlist'] is True
        assert Wishlist.objects.filter(user=user, product=product).exists()
        
        # Remove from wishlist
        response = api_client.post(f'/api/products/wishlist/toggle/{product.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['in_wishlist'] is False
        assert not Wishlist.objects.filter(user=user, product=product).exists()

    def test_wishlist_check(self, api_client, product_factory):
        user = User.objects.create_user(username='cuser', email='c@example.com', password='pass')
        category = Category.objects.create(name='Accessories', slug='acc2')
        product = product_factory('Silver Ring', 'خاتم فضة', 50, category)
        api_client.force_authenticate(user=user)
        
        response = api_client.get(f'/api/products/wishlist/check/{product.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['in_wishlist'] is False
        
        Wishlist.objects.create(user=user, product=product)
        response = api_client.get(f'/api/products/wishlist/check/{product.id}/')
        assert response.data['in_wishlist'] is True

@pytest.mark.unit
@pytest.mark.django_db
class TestProductRecommendations:
    """Test matching and recommendations"""
    
    def test_matching_accessories(self, api_client, product_factory):
        category = Category.objects.create(name='Dresses', slug='dr')
        acc_category = Category.objects.create(name='Jewelry', slug='jw')
        product = product_factory('Main Dress', 'فستان', 1000, category, color='Red')
        product_factory('Matching Necklace', 'قلادة', 500, acc_category, color='Gold')
        
        response = api_client.get(f'/api/products/{product.id}/matching-accessories/')
        assert response.status_code == status.HTTP_200_OK
        assert 'accessories' in response.data

    def test_product_recommendations(self, api_client, product_factory):
        category = Category.objects.create(name='Dresses', slug='dr2')
        product = product_factory('Product 1', 'منتج 1', 1000, category)
        product_factory('Product 2', 'منتج 2', 1200, category)
        
        response = api_client.get(f'/api/products/{product.id}/recommendations/')
        assert response.status_code == status.HTTP_200_OK
        assert 'recommendations' in response.data
