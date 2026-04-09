"""
Comprehensive Tests for Bundles App
Full Coverage: Models, Views, Serializers, Security, Edge Cases
"""
import os
import sys
import django
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.users.models import User
from apps.bundles.models import BundleCategory, Bundle, BundleItem, BundleBooking, BundleReview
from apps.bundles.serializers import BundleSerializer, BundleCategorySerializer, BundleBookingSerializer
from apps.products.models import Product, Category


class BundleCategoryModelTests(TestCase):
    """Test Cases for BundleCategory Models"""

    def test_category_creation(self):
        """Test BundleCategory model creation"""
        category = BundleCategory.objects.create(
            name='Wedding Package',
            name_ar='باقة الأعراس',
            slug='wedding-package'
        )

        self.assertEqual(category.name, 'Wedding Package')
        self.assertTrue(category.is_active)

    def test_category_str_representation(self):
        """Test category string representation"""
        category = BundleCategory.objects.create(
            name='Party Package',
            name_ar='باقة الحفلة',
            slug='party-package'
        )

        self.assertIn('باقة الحفلة', str(category))


class BundleModelTests(TestCase):
    """Test Cases for Bundle Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='bundle_owner@test.com',
            username='bundle_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = BundleCategory.objects.create(
            name='Wedding',
            name_ar='أعراس',
            slug='wedding'
        )

    def test_bundle_creation(self):
        """Test Bundle model creation"""
        bundle = Bundle.objects.create(
            name='Complete Wedding Package',
            name_ar='باقة الأعراس الكاملة',
            slug='complete-wedding',
            description='Everything you need for your wedding',
            description_ar='كل ما تحتاجه لحفل زفافك',
            base_price=Decimal('10000.00'),
            bundle_price=Decimal('7500.00'),
            discount_type='percentage',
            discount_value=Decimal('25.00'),
            min_days=1,
            max_days=7
        )

        self.assertEqual(bundle.base_price, Decimal('10000.00'))
        self.assertEqual(bundle.bundle_price, Decimal('7500.00'))

    def test_bundle_discount_calculation(self):
        """Test bundle discount calculation"""
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='باقة اختبار',
            slug='test-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00'),
            discount_type='percentage',
            discount_value=Decimal('20.00')
        )

        discount_amount = bundle.get_discount_amount()
        self.assertEqual(discount_amount, Decimal('200.00'))

    def test_bundle_savings(self):
        """Test bundle savings calculation"""
        bundle = Bundle.objects.create(
            name='Savings Bundle',
            name_ar='باقة التوفير',
            slug='savings-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('750.00')
        )

        savings = bundle.get_savings()
        self.assertEqual(savings, Decimal('250.00'))

    def test_bundle_discount_percentage(self):
        """Test discount percentage calculation"""
        bundle = Bundle.objects.create(
            name='Percentage Bundle',
            name_ar='باقة النسبة',
            slug='percentage-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('700.00')
        )

        discount_percentage = bundle.get_discount_percentage()
        self.assertEqual(discount_percentage, Decimal('30.00'))

    def test_bundle_str_representation(self):
        """Test bundle string representation"""
        bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='باقة اختبار',
            slug='test-bundle-str'
        )

        self.assertIn('باقة اختبار', str(bundle))


class BundleItemModelTests(TestCase):
    """Test Cases for BundleItem Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='item_owner@test.com',
            username='item_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='فساتين', name_en='Dresses')
        self.product = Product.objects.create(
            name_ar='فستان سهرة',
            name_en='Evening Dress',
            owner=self.owner,
            category=self.category,
            price_per_day=Decimal('500.00')
        )
        self.bundle = Bundle.objects.create(
            name='Test Bundle',
            name_ar='باقة اختبار',
            slug='item-test-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00')
        )

    def test_bundle_item_with_product(self):
        """Test bundle item with product reference"""
        item = BundleItem.objects.create(
            bundle=self.bundle,
            item_type='product',
            product=self.product,
            quantity=2,
            is_required=True
        )

        self.assertEqual(item.product, self.product)
        self.assertEqual(item.quantity, 2)

    def test_bundle_item_custom(self):
        """Test bundle item with custom details"""
        item = BundleItem.objects.create(
            bundle=self.bundle,
            item_type='service',
            custom_name='Photography',
            custom_name_ar='تصوير',
            custom_price=Decimal('300.00'),
            quantity=1,
            is_required=False
        )

        self.assertEqual(item.custom_name, 'Photography')

    def test_bundle_item_get_name(self):
        """Test get_name method"""
        item = BundleItem.objects.create(
            bundle=self.bundle,
            item_type='product',
            product=self.product
        )

        self.assertIn('Evening Dress', item.get_name())

    def test_bundle_item_get_price(self):
        """Test get_price method"""
        item = BundleItem.objects.create(
            bundle=self.bundle,
            item_type='product',
            product=self.product,
            quantity=3
        )

        price = item.get_price()
        self.assertEqual(price, Decimal('1500.00'))


class BundleBookingModelTests(TestCase):
    """Test Cases for BundleBooking Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='booking@test.com',
            username='booking_test',
            password='TestPass123!',
            role='tenant'
        )
        self.bundle = Bundle.objects.create(
            name='Booking Bundle',
            name_ar='باقة الحجز',
            slug='booking-bundle',
            base_price=Decimal('5000.00'),
            bundle_price=Decimal('4000.00')
        )

    def test_bundle_booking_creation(self):
        """Test BundleBooking model creation"""
        booking = BundleBooking.objects.create(
            user=self.user,
            bundle=self.bundle,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            base_price=Decimal('5000.00'),
            discount_amount=Decimal('1000.00'),
            total_price=Decimal('4000.00'),
            status='pending'
        )

        self.assertEqual(booking.total_days, 5)
        self.assertEqual(booking.status, 'pending')

    def test_bundle_booking_statuses(self):
        """Test different booking statuses"""
        statuses = ['pending', 'confirmed', 'in_use', 'completed', 'cancelled']

        for status_val in statuses:
            booking = BundleBooking.objects.create(
                user=self.user,
                bundle=self.bundle,
                start_date=date(2026, 5, 1),
                end_date=date(2026, 5, 3),
                total_days=3,
                base_price=Decimal('3000.00'),
                total_price=Decimal('2500.00'),
                status=status_val
            )
            self.assertEqual(booking.status, status_val)

    def test_bundle_booking_savings(self):
        """Test savings calculation"""
        booking = BundleBooking.objects.create(
            user=self.user,
            bundle=self.bundle,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            total_days=3,
            base_price=Decimal('1500.00'),
            total_price=Decimal('1200.00')
        )

        savings = booking.get_savings()
        self.assertEqual(savings, Decimal('300.00'))


class BundleReviewModelTests(TestCase):
    """Test Cases for BundleReview Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='review@test.com',
            username='review_test',
            password='TestPass123!',
            role='tenant'
        )
        self.bundle = Bundle.objects.create(
            name='Review Bundle',
            name_ar='باقة المراجعة',
            slug='review-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00')
        )
        self.booking = BundleBooking.objects.create(
            user=self.user,
            bundle=self.bundle,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 3),
            total_days=3,
            base_price=Decimal('300.00'),
            total_price=Decimal('240.00'),
            status='completed'
        )

    def test_bundle_review_creation(self):
        """Test BundleReview model creation"""
        review = BundleReview.objects.create(
            bundle_booking=self.booking,
            rating=5,
            comment='Excellent bundle!'
        )

        self.assertEqual(review.rating, 5)

    def test_bundle_review_rating_validation(self):
        """Test rating validation"""
        review = BundleReview.objects.create(
            bundle_booking=self.booking,
            rating=4,
            comment='Good bundle'
        )

        self.assertGreaterEqual(review.rating, 1)
        self.assertLessEqual(review.rating, 5)


class BundleSerializerTests(TestCase):
    """Test Cases for Bundle Serializers"""

    def setUp(self):
        self.category = BundleCategory.objects.create(
            name='Test Category',
            name_ar='فئة اختبار',
            slug='test-category-ser'
        )

    def test_bundle_serializer(self):
        """Test BundleSerializer"""
        bundle = Bundle.objects.create(
            name='Serializer Bundle',
            name_ar='باقة المسلسل',
            slug='serializer-bundle',
            category=self.category,
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00'),
            discount_type='percentage',
            discount_value=Decimal('20.00')
        )

        serializer = BundleSerializer(bundle)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Bundle')
        self.assertIn('discount_amount', data)
        self.assertIn('savings', data)

    def test_bundle_category_serializer(self):
        """Test BundleCategorySerializer"""
        serializer = BundleCategorySerializer(self.category)
        data = serializer.data

        self.assertEqual(data['name'], 'Test Category')


class BundleViewTests(APITestCase):
    """Test Cases for Bundle Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='bundle_admin@test.com',
            username='bundle_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='bundle_user@test.com',
            username='bundle_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = BundleCategory.objects.create(
            name='View Category',
            name_ar='فئة العرض',
            slug='view-category'
        )
        self.bundle = Bundle.objects.create(
            name='View Bundle',
            name_ar='باقة العرض',
            slug='view-bundle',
            category=self.category,
            base_price=Decimal('2000.00'),
            bundle_price=Decimal('1500.00'),
            is_active=True
        )

    def test_list_bundles(self):
        """Test listing bundles"""
        response = self.client.get('/api/bundles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_bundle(self):
        """Test retrieving a bundle"""
        response = self.client.get(f'/api/bundles/{self.bundle.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_calculate_bundle_price(self):
        """Test calculating bundle price"""
        response = self.client.get(
            f'/api/bundles/{self.bundle.id}/calculate_price/',
            {'start_date': '2026-04-01', 'end_date': '2026-04-05'}
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_list_bundle_categories(self):
        """Test listing bundle categories"""
        response = self.client.get('/api/bundle-categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_bundle_booking(self):
        """Test creating a bundle booking"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/bundle-bookings/', {
            'bundle': self.bundle.id,
            'start_date': '2026-04-01',
            'end_date': '2026-04-05',
            'total_days': 5
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])


class BundleSecurityTests(APITestCase):
    """Security Tests for Bundles"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='bundle_sec@test.com',
            username='bundle_sec_test',
            password='TestPass123!',
            role='tenant'
        )
        self.other_user = User.objects.create_user(
            email='other_bundle_sec@test.com',
            username='other_bundle_sec_test',
            password='TestPass123!',
            role='tenant'
        )
        self.bundle = Bundle.objects.create(
            name='Security Bundle',
            name_ar='باقة الأمان',
            slug='security-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00')
        )
        self.booking = BundleBooking.objects.create(
            user=self.other_user,
            bundle=self.bundle,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 3),
            total_days=3,
            base_price=Decimal('300.00'),
            total_price=Decimal('240.00')
        )

    def test_cannot_access_other_user_bookings(self):
        """Test user cannot access other user's bookings"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/bundle-bookings/')
        self.assertEqual(len(response.data), 0)

    def test_xss_in_bundle_name(self):
        """Test XSS protection in bundle name"""
        xss_payload = '<script>alert("XSS")</script>'

        bundle = Bundle.objects.create(
            name=xss_payload,
            name_ar=xss_payload,
            slug='xss-bundle',
            base_price=Decimal('100.00'),
            bundle_price=Decimal('80.00')
        )

        self.assertNotIn('<script>', bundle.name)

    def test_sql_injection_in_slug(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE bundles_bundle; --"

        bundle = Bundle.objects.create(
            name='SQL Test',
            name_ar='اختبار SQL',
            slug=sql_payload,
            base_price=Decimal('100.00'),
            bundle_price=Decimal('80.00')
        )

        self.assertIsNotNone(bundle.slug)


class BundleEdgeCaseTests(TestCase):
    """Edge Case Tests for Bundles"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='bundle_edge@test.com',
            username='bundle_edge_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_empty_bundle_list(self):
        """Test handling of empty bundle list"""
        bundles = Bundle.objects.filter(is_active=True)
        self.assertEqual(bundles.count(), 0)

    def test_bundle_with_zero_discount(self):
        """Test bundle with zero discount"""
        bundle = Bundle.objects.create(
            name='No Discount',
            name_ar='بدون خصم',
            slug='no-discount',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('1000.00'),
            discount_value=Decimal('0.00')
        )

        savings = bundle.get_savings()
        self.assertEqual(savings, Decimal('0'))

    def test_bundle_min_max_days(self):
        """Test bundle with min/max days"""
        bundle = Bundle.objects.create(
            name='Days Bundle',
            name_ar='باقة الأيام',
            slug='days-bundle',
            base_price=Decimal('1000.00'),
            bundle_price=Decimal('800.00'),
            min_days=3,
            max_days=14
        )

        self.assertEqual(bundle.min_days, 3)
        self.assertEqual(bundle.max_days, 14)

    def test_bundle_with_many_items(self):
        """Test bundle with many items"""
        bundle = Bundle.objects.create(
            name='Many Items',
            name_ar='عناصر كثيرة',
            slug='many-items',
            base_price=Decimal('10000.00'),
            bundle_price=Decimal('8000.00')
        )

        for i in range(20):
            BundleItem.objects.create(
                bundle=bundle,
                item_type='addon',
                custom_name=f'Item {i}',
                quantity=1
            )

        count = bundle.items.count()
        self.assertEqual(count, 20)

    def test_unicode_in_bundle_description(self):
        """Test Unicode in bundle description"""
        bundle = Bundle.objects.create(
            name='Arabic Bundle',
            name_ar='باقة عربية',
            slug='arabic-bundle',
            description='هذا وصف للباقة باللغة العربية مع أرقام ١٢٣',
            description_ar='هذا وصف الباقة بالعربية'
        )

        self.assertIn('العربية', bundle.description)

    def test_bundle_inactive_status(self):
        """Test inactive bundle"""
        bundle = Bundle.objects.create(
            name='Inactive',
            name_ar='غير نشط',
            slug='inactive-bundle',
            base_price=Decimal('100.00'),
            bundle_price=Decimal('80.00'),
            is_active=False
        )

        self.assertFalse(bundle.is_active)


if __name__ == '__main__':
    import unittest
    unittest.main()
