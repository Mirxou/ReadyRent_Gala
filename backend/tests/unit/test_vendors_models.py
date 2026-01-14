"""
Unit tests for Vendors models
"""
import pytest
from decimal import Decimal
from apps.vendors.models import Vendor, VendorProduct, Commission
from apps.products.models import Category, Product


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorModel:
    """Test Vendor model"""
    
    def test_create_vendor(self, regular_user):
        """Test creating a vendor"""
        vendor = Vendor.objects.create(
            user=regular_user,
            business_name='Test Vendor',
            business_name_ar='مورد تجريبي',
            phone='+213123456789',
            email='vendor@test.com',
            address='123 Vendor St',
            city='Constantine',
            commission_rate=Decimal('15.00'),
            status='active'
        )
        
        assert vendor.business_name == 'Test Vendor'
        assert vendor.commission_rate == Decimal('15.00')
        assert vendor.status == 'active'
        assert vendor.total_products == 0
        assert vendor.total_sales == Decimal('0.00')
    
    def test_vendor_str(self, regular_user):
        """Test vendor string representation"""
        vendor = Vendor.objects.create(
            user=regular_user,
            business_name='Test Vendor',
            business_name_ar='مورد تجريبي',
            phone='+213123456789',
            email='vendor@test.com',
            address='123 St',
            city='Constantine'
        )
        assert str(vendor) == 'مورد تجريبي'


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorProductModel:
    """Test VendorProduct model"""
    
    def test_create_vendor_product(self, vendor, product):
        """Test creating vendor product"""
        vendor_product = VendorProduct.objects.create(
            vendor=vendor,
            product=product,
            commission_rate=Decimal('20.00')
        )
        
        assert vendor_product.vendor == vendor
        assert vendor_product.product == product
        assert vendor_product.commission_rate == Decimal('20.00')
    
    def test_vendor_product_get_commission_rate(self, vendor, product):
        """Test getting commission rate"""
        # Without product-specific rate
        vendor_product = VendorProduct.objects.create(
            vendor=vendor,
            product=product
        )
        assert vendor_product.get_commission_rate() == vendor.commission_rate
        
        # With product-specific rate
        vendor_product.commission_rate = Decimal('25.00')
        vendor_product.save()
        assert vendor_product.get_commission_rate() == Decimal('25.00')


@pytest.mark.unit
@pytest.mark.django_db
class TestCommissionModel:
    """Test Commission model"""
    
    def test_create_commission(self, vendor, product, booking):
        """Test creating commission"""
        commission = Commission.objects.create(
            vendor=vendor,
            booking=booking,
            product=product,
            sale_amount=Decimal('5000.00'),
            commission_rate=Decimal('15.00'),
            commission_amount=Decimal('750.00'),
            status='pending'
        )
        
        assert commission.vendor == vendor
        assert commission.sale_amount == Decimal('5000.00')
        assert commission.commission_amount == Decimal('750.00')
        assert commission.status == 'pending'

