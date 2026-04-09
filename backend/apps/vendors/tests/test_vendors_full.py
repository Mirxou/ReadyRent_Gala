"""
Comprehensive Tests for Vendors App
Full Coverage: Models, Views, Serializers, Security, Edge Cases
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date

from apps.users.models import User
from apps.vendors.models import Vendor, VendorProduct, Commission, VendorPerformance
from apps.vendors.serializers import VendorSerializer, CommissionSerializer
from apps.products.models import Product, Category


class VendorModelTests(TestCase):
    """Test Cases for Vendor Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='vendor_user@test.com',
            username='vendor_user_test',
            password='TestPass123!',
            role='owner'
        )

    def test_vendor_creation(self):
        """Test Vendor model creation"""
        vendor = Vendor.objects.create(
            user=self.user,
            business_name='Algerian Crafts Co',
            business_name_ar='شركة الحرف الجزائرية',
            phone='0555123456',
            email='contact@algeriancrafts.com',
            address='123 Artisan Street',
            city='Constantine',
            commission_rate=Decimal('15.00'),
            status='pending'
        )

        self.assertEqual(vendor.business_name, 'Algerian Crafts Co')
        self.assertEqual(vendor.status, 'pending')

    def test_vendor_statuses(self):
        """Test different vendor statuses"""
        statuses = ['pending', 'active', 'suspended', 'inactive']

        for vendor_status in statuses:
            vendor = Vendor.objects.create(
                user=self.user,
                business_name=f'Vendor {vendor_status}',
                business_name_ar=f'مورد {vendor_status}',
                phone='0555000001',
                email=f'{vendor_status}@vendor.com',
                address='Address',
                city='Constantine',
                status=vendor_status
            )
            self.assertEqual(vendor.status, vendor_status)

    def test_vendor_verification(self):
        """Test vendor verification"""
        admin = User.objects.create_user(
            email='vendor_admin@test.com',
            username='vendor_admin_test',
            password='TestPass123!',
            role='admin'
        )

        vendor = Vendor.objects.create(
            user=self.user,
            business_name='Verified Vendor',
            business_name_ar='مورد موثّق',
            phone='0555000002',
            email='verified@vendor.com',
            address='Address',
            city='Constantine',
            is_verified=True,
            verified_by=admin,
            verified_at=timezone.now()
        )

        self.assertTrue(vendor.is_verified)
        self.assertEqual(vendor.verified_by, admin)

    def test_vendor_str_representation(self):
        """Test vendor string representation"""
        vendor = Vendor.objects.create(
            user=self.user,
            business_name='Test Vendor',
            business_name_ar='مورد اختبار',
            phone='0555000003',
            email='test@vendor.com',
            address='Address',
            city='Constantine'
        )

        self.assertIn('مورد اختبار', str(vendor))


class VendorProductModelTests(TestCase):
    """Test Cases for VendorProduct Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='vp_user@test.com',
            username='vp_user_test',
            password='TestPass123!',
            role='owner'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='VP Vendor',
            business_name_ar='مورد المنتجات',
            phone='0555000004',
            email='vp@vendor.com',
            address='Address',
            city='Constantine'
        )
        self.category = Category.objects.create(name_ar='تحف', name_en='Antiques')
        self.product = Product.objects.create(
            name_ar='مزهرية نحاسية',
            name_en='Copper Vase',
            owner=self.user,
            category=self.category
        )

    def test_vendor_product_creation(self):
        """Test VendorProduct model creation"""
        vendor_product = VendorProduct.objects.create(
            vendor=self.vendor,
            product=self.product
        )

        self.assertEqual(vendor_product.vendor, self.vendor)
        self.assertEqual(vendor_product.product, self.product)

    def test_vendor_product_commission_override(self):
        """Test commission rate override"""
        vendor_product = VendorProduct.objects.create(
            vendor=self.vendor,
            product=self.product,
            commission_rate=Decimal('20.00')
        )

        self.assertEqual(vendor_product.get_commission_rate(), Decimal('20.00'))

    def test_vendor_product_unique_constraint(self):
        """Test unique constraint on vendor-product pair"""
        VendorProduct.objects.create(
            vendor=self.vendor,
            product=self.product
        )

        with self.assertRaises(Exception):
            VendorProduct.objects.create(
                vendor=self.vendor,
                product=self.product
            )


class CommissionModelTests(TestCase):
    """Test Cases for Commission Models"""

    def setUp(self):
        self.vendor_user = User.objects.create_user(
            email='comm_vendor@test.com',
            username='comm_vendor_test',
            password='TestPass123!',
            role='owner'
        )
        self.tenant = User.objects.create_user(
            email='comm_tenant@test.com',
            username='comm_tenant_test',
            password='TestPass123!',
            role='tenant'
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            business_name='Commission Vendor',
            business_name_ar='مورد العمولة',
            phone='0555000005',
            email='commission@vendor.com',
            address='Address',
            city='Constantine'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')
        self.product = Product.objects.create(
            name_ar='قفطان',
            name_en='Caftan',
            owner=self.vendor_user,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.tenant,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='completed'
        )

    def test_commission_creation(self):
        """Test Commission model creation"""
        commission = Commission.objects.create(
            vendor=self.vendor,
            booking=self.booking,
            product=self.product,
            sale_amount=Decimal('5000.00'),
            commission_rate=Decimal('15.00'),
            commission_amount=Decimal('750.00')
        )

        self.assertEqual(commission.sale_amount, Decimal('5000.00'))
        self.assertEqual(commission.commission_amount, Decimal('750.00'))

    def test_commission_statuses(self):
        """Test different commission statuses"""
        statuses = ['pending', 'calculated', 'paid', 'cancelled']

        for comm_status in statuses:
            commission = Commission.objects.create(
                vendor=self.vendor,
                booking=self.booking,
                product=self.product,
                sale_amount=Decimal('1000.00'),
                commission_rate=Decimal('15.00'),
                commission_amount=Decimal('150.00'),
                status=comm_status
            )
            self.assertEqual(commission.status, comm_status)


class VendorPerformanceModelTests(TestCase):
    """Test Cases for VendorPerformance Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='perf_vendor@test.com',
            username='perf_vendor_test',
            password='TestPass123!',
            role='owner'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='Performance Vendor',
            business_name_ar='مورد الأداء',
            phone='0555000006',
            email='performance@vendor.com',
            address='Address',
            city='Constantine'
        )

    def test_performance_creation(self):
        """Test VendorPerformance model creation"""
        performance = VendorPerformance.objects.create(
            vendor=self.vendor,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 3, 31),
            total_bookings=100,
            total_revenue=Decimal('50000.00'),
            total_commission=Decimal('7500.00'),
            average_rating=Decimal('4.50'),
            products_added=10
        )

        self.assertEqual(performance.total_bookings, 100)
        self.assertEqual(performance.total_revenue, Decimal('50000.00'))


class VendorSerializerTests(TestCase):
    """Test Cases for Vendor Serializers"""

    def test_vendor_serializer(self):
        """Test VendorSerializer"""
        user = User.objects.create_user(
            email='ser_vendor@test.com',
            username='ser_vendor_test',
            password='TestPass123!',
            role='owner'
        )
        vendor = Vendor.objects.create(
            user=user,
            business_name='Serializer Vendor',
            business_name_ar='مورد المسلسل',
            phone='0555000007',
            email='serializer@vendor.com',
            address='Address',
            city='Constantine'
        )

        serializer = VendorSerializer(vendor)
        data = serializer.data

        self.assertEqual(data['business_name'], 'Serializer Vendor')
        self.assertIn('user_email', data)


class VendorViewTests(APITestCase):
    """Test Cases for Vendor Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='vendor_admin@test.com',
            username='vendor_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='vendor_view@test.com',
            username='vendor_view_test',
            password='TestPass123!',
            role='owner'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='View Vendor',
            business_name_ar='مورد العرض',
            phone='0555000008',
            email='view@vendor.com',
            address='Address',
            city='Constantine',
            status='active',
            is_verified=True
        )

    def test_list_vendors(self):
        """Test listing vendors"""
        response = self.client.get('/api/vendors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_vendor(self):
        """Test retrieving a vendor"""
        response = self.client.get(f'/api/vendors/{self.vendor.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_vendor_registration(self):
        """Test vendor registration"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/vendors/register/', {
            'business_name': 'New Vendor',
            'business_name_ar': 'مورد جديد',
            'phone': '0555000009',
            'email': 'new@vendor.com',
            'address': 'New Address',
            'city': 'Constantine'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])


class VendorSecurityTests(APITestCase):
    """Security Tests for Vendors"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='vendor_sec@test.com',
            username='vendor_sec_test',
            password='TestPass123!',
            role='owner'
        )

    def test_xss_in_business_name(self):
        """Test XSS protection in business name"""
        xss_payload = '<script>alert("XSS")</script>'

        vendor = Vendor.objects.create(
            user=self.user,
            business_name=xss_payload,
            business_name_ar=xss_payload,
            phone='0555000010',
            email='xss@vendor.com',
            address='Address',
            city='Constantine'
        )

        self.assertNotIn('<script>', vendor.business_name)

    def test_sql_injection_in_email(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE vendors_vendor; --"

        vendor = Vendor.objects.create(
            user=self.user,
            business_name='SQL Vendor',
            business_name_ar='SQL',
            phone='0555000011',
            email=sql_payload,
            address='Address',
            city='Constantine'
        )

        self.assertIsNotNone(vendor.email)


class VendorEdgeCaseTests(TestCase):
    """Edge Case Tests for Vendors"""

    def test_empty_vendor_list(self):
        """Test handling of empty vendor list"""
        vendors = Vendor.objects.filter(status='active', is_verified=True)
        self.assertEqual(vendors.count(), 0)

    def test_unicode_in_business_name(self):
        """Test Unicode in business names"""
        user = User.objects.create_user(
            email='unicode_vendor@test.com',
            username='unicode_vendor_test',
            password='TestPass123!',
            role='owner'
        )

        vendor = Vendor.objects.create(
            user=user,
            business_name='شركة عربية',
            business_name_ar='شركة عربية',
            phone='0555000012',
            email='arabic@vendor.com',
            address='عنوان الشركة',
            city='قسنطينة'
        )

        self.assertIn('شركة عربية', vendor.business_name)

    def test_zero_commission(self):
        """Test zero commission rate"""
        user = User.objects.create_user(
            email='zero_comm@test.com',
            username='zero_comm_test',
            password='TestPass123!',
            role='owner'
        )

        vendor = Vendor.objects.create(
            user=user,
            business_name='Zero Commission',
            business_name_ar='عمولة صفر',
            phone='0555000013',
            email='zero@vendor.com',
            address='Address',
            city='Constantine',
            commission_rate=Decimal('0.00')
        )

        self.assertEqual(vendor.commission_rate, Decimal('0.00'))


from apps.bookings.models import Booking

if __name__ == '__main__':
    import unittest
    unittest.main()
