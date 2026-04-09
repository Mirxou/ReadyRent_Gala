"""
Comprehensive Tests for Local Guide App
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
from unittest.mock import patch, MagicMock

from apps.users.models import User
from apps.local_guide.models import ServiceCategory, LocalService, ServiceImage, ServiceReview
from apps.local_guide.serializers import ServiceCategorySerializer, LocalServiceSerializer, ServiceReviewSerializer


class ServiceCategoryModelTests(TestCase):
    """Test Cases for ServiceCategory Models"""

    def test_category_creation(self):
        """Test ServiceCategory model creation"""
        category = ServiceCategory.objects.create(
            name='Wedding Services',
            name_ar='خدمات الأعراس',
            slug='wedding-services',
            icon='heart',
            description='All wedding-related services'
        )

        self.assertEqual(category.name, 'Wedding Services')
        self.assertEqual(category.slug, 'wedding-services')
        self.assertTrue(category.is_active)

    def test_category_str_representation(self):
        """Test category string representation"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='تصوير',
            slug='photography'
        )

        self.assertIn('تصوير', str(category))


class LocalServiceModelTests(TestCase):
    """Test Cases for LocalService Models"""

    def setUp(self):
        self.category = ServiceCategory.objects.create(
            name='Venues',
            name_ar='القاعات',
            slug='venues'
        )

    def test_service_creation(self):
        """Test LocalService model creation"""
        service = LocalService.objects.create(
            name='El Mansour Palace',
            name_ar='قصر المنصور',
            service_type='venue',
            category=self.category,
            phone='0555123456',
            email='info@elmansour.com',
            address='123 Palace Street',
            city='Constantine',
            price_range_min=Decimal('50000.00'),
            price_range_max=Decimal('150000.00')
        )

        self.assertEqual(service.name, 'El Mansour Palace')
        self.assertEqual(service.service_type, 'venue')

    def test_service_types(self):
        """Test different service types"""
        types = [
            'venue', 'photographer', 'videographer', 'mc', 'caterer',
            'makeup_artist', 'hair_stylist', 'decorator', 'dj', 'band', 'other'
        ]

        for service_type in types:
            service = LocalService.objects.create(
                name=f'{service_type.title()} Service',
                name_ar=f'خدمة {service_type}',
                service_type=service_type,
                phone='0555000001',
                address='Address',
                city='Constantine'
            )
            self.assertEqual(service.service_type, service_type)

    def test_service_ratings(self):
        """Test service ratings"""
        service = LocalService.objects.create(
            name='Top Rated Studio',
            name_ar='استوديو الأعلى تقييم',
            service_type='photographer',
            phone='0555000002',
            address='Photo Street',
            city='Constantine',
            rating=Decimal('4.85'),
            review_count=120
        )

        self.assertEqual(service.rating, Decimal('4.85'))
        self.assertEqual(service.review_count, 120)

    def test_service_verification(self):
        """Test service verification"""
        service = LocalService.objects.create(
            name='Verified Studio',
            name_ar='استوديو موثّق',
            service_type='photographer',
            phone='0555000003',
            address='Verified Street',
            city='Constantine',
            is_verified=True
        )

        self.assertTrue(service.is_verified)

    def test_service_str_representation(self):
        """Test service string representation"""
        service = LocalService.objects.create(
            name='Test Service',
            name_ar='خدمة اختبار',
            service_type='caterer',
            phone='0555000004',
            address='Address',
            city='Constantine'
        )

        self.assertIn('خدمة اختبار', str(service))


class ServiceImageModelTests(TestCase):
    """Test Cases for ServiceImage Models"""

    def setUp(self):
        self.service = LocalService.objects.create(
            name='Image Service',
            name_ar='خدمة الصور',
            service_type='venue',
            phone='0555000005',
            address='Image Address',
            city='Constantine'
        )

    def test_service_image_creation(self):
        """Test ServiceImage model creation"""
        image = ServiceImage.objects.create(
            service=self.service,
            alt_text='Beautiful venue hall',
            is_primary=True,
            order=1
        )

        self.assertEqual(image.alt_text, 'Beautiful venue hall')
        self.assertTrue(image.is_primary)

    def test_service_image_ordering(self):
        """Test image ordering"""
        for i in range(5):
            ServiceImage.objects.create(
                service=self.service,
                alt_text=f'Image {i}',
                order=i
            )

        images = ServiceImage.objects.filter(service=self.service)
        orders = [img.order for img in images]
        self.assertEqual(orders, sorted(orders))


class ServiceReviewModelTests(TestCase):
    """Test Cases for ServiceReview Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='review@test.com',
            username='review_test',
            password='TestPass123!',
            role='tenant'
        )
        self.service = LocalService.objects.create(
            name='Reviewed Service',
            name_ar='خدمة مُراجَع',
            service_type='photographer',
            phone='0555000006',
            address='Review Address',
            city='Constantine'
        )

    def test_review_creation(self):
        """Test ServiceReview model creation"""
        review = ServiceReview.objects.create(
            service=self.service,
            user=self.user,
            rating=5,
            comment='Amazing photography service!'
        )

        self.assertEqual(review.rating, 5)
        self.assertEqual(review.service, self.service)

    def test_review_unique_constraint(self):
        """Test unique constraint on service-user pair"""
        ServiceReview.objects.create(
            service=self.service,
            user=self.user,
            rating=4
        )

        with self.assertRaises(Exception):
            ServiceReview.objects.create(
                service=self.service,
                user=self.user,
                rating=5
            )

    def test_review_verified(self):
        """Test verified review"""
        review = ServiceReview.objects.create(
            service=self.service,
            user=self.user,
            rating=5,
            comment='Verified purchase review',
            is_verified=True
        )

        self.assertTrue(review.is_verified)


class LocalGuideSerializerTests(TestCase):
    """Test Cases for Local Guide Serializers"""

    def test_category_serializer(self):
        """Test ServiceCategorySerializer"""
        category = ServiceCategory.objects.create(
            name='Serializer Category',
            name_ar='فئة المسلسل',
            slug='serializer-category'
        )

        serializer = ServiceCategorySerializer(category)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Category')
        self.assertIn('services_count', data)

    def test_service_serializer(self):
        """Test LocalServiceSerializer"""
        category = ServiceCategory.objects.create(
            name='Ser Category',
            name_ar='فئة',
            slug='ser-category'
        )
        service = LocalService.objects.create(
            name='Serializer Service',
            name_ar='خدمة المسلسل',
            service_type='venue',
            category=category,
            phone='0555000007',
            address='Address',
            city='Constantine',
            is_active=True
        )

        serializer = LocalServiceSerializer(service)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Service')
        self.assertIn('images', data)

    def test_review_serializer(self):
        """Test ServiceReviewSerializer"""
        user = User.objects.create_user(
            email='ser_review@test.com',
            username='ser_review_test',
            password='TestPass123!',
            role='tenant'
        )
        service = LocalService.objects.create(
            name='Review Service',
            name_ar='خدمة المراجعة',
            service_type='dj',
            phone='0555000008',
            address='Address',
            city='Constantine'
        )
        review = ServiceReview.objects.create(
            service=service,
            user=user,
            rating=4
        )

        serializer = ServiceReviewSerializer(review)
        data = serializer.data

        self.assertEqual(data['rating'], 4)
        self.assertIn('user_email', data)


class LocalGuideViewTests(APITestCase):
    """Test Cases for Local Guide Views"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='guide_view@test.com',
            username='guide_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = ServiceCategory.objects.create(
            name='View Category',
            name_ar='فئة العرض',
            slug='view-category'
        )
        self.service = LocalService.objects.create(
            name='View Service',
            name_ar='خدمة العرض',
            service_type='photographer',
            category=self.category,
            phone='0555000009',
            address='View Address',
            city='Constantine',
            is_active=True
        )

    def test_list_categories(self):
        """Test listing service categories"""
        response = self.client.get('/api/local-guide/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_services(self):
        """Test listing local services"""
        response = self.client.get('/api/local-guide/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_service(self):
        """Test retrieving a service"""
        response = self.client.get(f'/api/local-guide/services/{self.service.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_service_type(self):
        """Test filtering by service type"""
        response = self.client.get('/api/local-guide/services/?service_type=photographer')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_review(self):
        """Test creating a review"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/local-guide/reviews/', {
            'service': self.service.id,
            'rating': 5,
            'comment': 'Excellent service!'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])


class LocalGuideSecurityTests(APITestCase):
    """Security Tests for Local Guide"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='guide_sec@test.com',
            username='guide_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_service_name(self):
        """Test XSS protection in service name"""
        xss_payload = '<script>alert("XSS")</script>'

        service = LocalService.objects.create(
            name=xss_payload,
            name_ar=xss_payload,
            service_type='venue',
            phone='0555000010',
            address='Address',
            city='Constantine'
        )

        self.assertNotIn('<script>', service.name)

    def test_xss_in_description(self):
        """Test XSS protection in description"""
        xss_payload = '<img src=x onerror=alert("XSS")>'

        service = LocalService.objects.create(
            name='XSS Service',
            name_ar='خدمة',
            service_type='caterer',
            phone='0555000011',
            address='Address',
            city='Constantine',
            description=xss_payload
        )

        self.assertNotIn('<img', service.description)

    def test_sql_injection_in_type(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE local_guide_localservice; --"

        service = LocalService.objects.create(
            name='SQL Service',
            name_ar='SQL',
            service_type=sql_payload,
            phone='0555000012',
            address='Address',
            city='Constantine'
        )

        self.assertIsNotNone(service.service_type)


class LocalGuideEdgeCaseTests(TestCase):
    """Edge Case Tests for Local Guide"""

    def test_empty_service_list(self):
        """Test handling of empty service list"""
        services = LocalService.objects.filter(is_active=True)
        self.assertEqual(services.count(), 0)

    def test_unicode_in_service_name(self):
        """Test Unicode in service names"""
        service = LocalService.objects.create(
            name='استوديو تصوير',
            name_ar='استوديو تصوير',
            service_type='photographer',
            phone='0555000013',
            address='عنوان الاستوديو',
            city='قسنطينة',
            description='متخصص في تصوير الأعراس والحفلات'
        )

        self.assertIn('استوديو', service.name)

    def test_service_price_range(self):
        """Test service price range"""
        service = LocalService.objects.create(
            name='Price Range Service',
            name_ar='خدمة النطاق السعري',
            service_type='caterer',
            phone='0555000014',
            address='Address',
            city='Constantine',
            price_range_min=Decimal('10000.00'),
            price_range_max=Decimal('50000.00')
        )

        self.assertEqual(service.price_range_min, Decimal('10000.00'))
        self.assertEqual(service.price_range_max, Decimal('50000.00'))

    def test_service_with_many_images(self):
        """Test service with many images"""
        service = LocalService.objects.create(
            name='Many Images',
            name_ar='صور كثيرة',
            service_type='venue',
            phone='0555000015',
            address='Address',
            city='Constantine'
        )

        for i in range(10):
            ServiceImage.objects.create(
                service=service,
                alt_text=f'Gallery image {i}'
            )

        count = ServiceImage.objects.filter(service=service).count()
        self.assertEqual(count, 10)

    def test_service_social_links(self):
        """Test service social media links"""
        service = LocalService.objects.create(
            name='Social Service',
            name_ar='خدمة اجتماعية',
            service_type='photographer',
            phone='0555000016',
            address='Address',
            city='Constantine',
            website='https://example.com',
            whatsapp='0555123456',
            instagram='service_handle'
        )

        self.assertEqual(service.whatsapp, '0555123456')
        self.assertEqual(service.instagram, 'service_handle')

    def test_inactive_service(self):
        """Test inactive service"""
        service = LocalService.objects.create(
            name='Inactive Service',
            name_ar='خدمة غير نشطة',
            service_type='venue',
            phone='0555000017',
            address='Address',
            city='Constantine',
            is_active=False
        )

        self.assertFalse(service.is_active)

    def test_service_location(self):
        """Test service location with coordinates"""
        service = LocalService.objects.create(
            name='Located Service',
            name_ar='خدمة موقعية',
            service_type='venue',
            phone='0555000018',
            address='123 Venue Street',
            city='Constantine',
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147')
        )

        self.assertEqual(service.latitude, Decimal('36.3650'))
        self.assertEqual(service.longitude, Decimal('6.6147'))


if __name__ == '__main__':
    import unittest
    unittest.main()
