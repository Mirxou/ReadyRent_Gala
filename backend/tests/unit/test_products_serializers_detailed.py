import pytest
from apps.products.serializers import (
    CategorySerializer, ProductImageSerializer, ProductSerializer, 
    ProductListSerializer, ProductVariantSerializer, WishlistSerializer
)
from apps.products.models import Category, Product, ProductImage, ProductVariant, Wishlist
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

@pytest.fixture
def product_setup(db):
    cat = Category.objects.create(name='Cat', slug='cat')
    prod = Product.objects.create(
        name='P', name_ar='ب', price_per_day=Decimal('100.00'), 
        category=cat, status='available', size='M', color='Red'
    )
    return cat, prod

@pytest.mark.unit
@pytest.mark.django_db
class TestProductSerializersDetailed:
    """Test Products Serializers with full coverage"""
    
    def test_product_image_serializer(self, product_setup):
        cat, prod = product_setup
        image_file = SimpleUploadedFile("test.jpg", b"content", content_type="image/jpeg")
        img = ProductImage.objects.create(product=prod, image=image_file, is_primary=True)
        
        serializer = ProductImageSerializer(img)
        # Methods
        assert serializer.data['image_url'] is not None
        assert serializer.data['thumbnail_url'] is not None
        assert serializer.data['small_url'] is not None
        assert serializer.data['medium_url'] is not None

    def test_product_list_serializer(self, product_setup):
        cat, prod = product_setup
        image_file = SimpleUploadedFile("test.jpg", b"content", content_type="image/jpeg")
        ProductImage.objects.create(product=prod, image=image_file, is_primary=True)
        
        serializer = ProductListSerializer(prod)
        assert serializer.data['primary_image'] is not None

    def test_product_variant_serializer(self, product_setup):
        cat, prod = product_setup
        variant = ProductVariant.objects.create(product=prod, size='L', color='Blue', name='V')
        
        serializer = ProductVariantSerializer(variant)
        assert serializer.data['price'] == 100.0
        assert serializer.data['availability_status'] == 'unknown'
        assert serializer.data['is_available'] is False

    def test_category_and_wishlist(self, product_setup):
        cat, prod = product_setup
        user = User.objects.create_user(username='u', email='u@ex.com', password='p')
        wish = Wishlist.objects.create(user=user, product=prod)
        
        c_ser = CategorySerializer(cat)
        assert c_ser.data['name'] == 'Cat'
        
        w_ser = WishlistSerializer(wish)
        assert w_ser.data['product']['name'] == 'P'
