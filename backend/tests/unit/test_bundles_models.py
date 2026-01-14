"""
Unit tests for Bundles models
"""
import pytest
from decimal import Decimal
from apps.bundles.models import BundleCategory, Bundle, BundleItem
from apps.products.models import Category, Product


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleCategoryModel:
    """Test BundleCategory model"""
    
    def test_create_bundle_category(self):
        """Test creating bundle category"""
        category = BundleCategory.objects.create(
            name='Wedding Packages',
            name_ar='باقات الأعراس',
            slug='wedding-packages',
            description='Wedding packages',
            description_ar='باقات أعراس',
            is_active=True
        )
        
        assert category.name == 'Wedding Packages'
        assert category.slug == 'wedding-packages'
        assert category.is_active


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleModel:
    """Test Bundle model"""
    
    def test_create_bundle(self, category):
        """Test creating a bundle"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        bundle = Bundle.objects.create(
            name='Complete Package',
            name_ar='باقة كاملة',
            slug='complete-package',
            description='Complete wedding package',
            description_ar='باقة عرس كاملة',
            category=bundle_category,
            discount_type='percentage',
            discount_value=Decimal('15.00'),
            is_active=True
        )
        
        assert bundle.name == 'Complete Package'
        assert bundle.discount_type == 'percentage'
        assert bundle.discount_value == Decimal('15.00')
        assert bundle.is_active


@pytest.mark.unit
@pytest.mark.django_db
class TestBundleItemModel:
    """Test BundleItem model"""
    
    def test_create_bundle_item(self, category):
        """Test creating bundle item"""
        bundle_category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة تجريبية',
            slug='test-category'
        )
        
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='باقة تجريبية',
            slug='test-bundle',
            description='Test',
            description_ar='تجريبي',
            category=bundle_category
        )
        
        product = Product.objects.create(
            name='Test Product',
            name_ar='منتج تجريبي',
            slug='test-product',
            category=category,
            price_per_day=Decimal('1000.00'),
            status='available'
        )
        
        bundle_item = BundleItem.objects.create(
            bundle=bundle,
            product=product,
            quantity=1
        )
        
        assert bundle_item.bundle == bundle
        assert bundle_item.product == product
        assert bundle_item.quantity == 1

