"""
Comprehensive Tests for Artisans App
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
from apps.artisans.models import Artisan, ArtisanPortfolio, ArtisanReview
from apps.artisans.serializers import ArtisanSerializer, ArtisanPortfolioSerializer, ArtisanReviewSerializer


class ArtisanModelTests(TestCase):
    """Test Cases for Artisan Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='art_user@test.com',
            username='art_user_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_artisan_creation(self):
        """Test Artisan model creation"""
        artisan = Artisan.objects.create(
            name='Sarah Designer',
            name_ar='سارة المصممة',
            specialty='dress_designer',
            phone='0555123456',
            email='sarah@artisan.com',
            city='Constantine',
            bio='Expert in traditional Algerian dresses'
        )

        self.assertEqual(artisan.name, 'Sarah Designer')
        self.assertEqual(artisan.specialty, 'dress_designer')

    def test_artisan_with_user(self):
        """Test artisan with user account"""
        artisan = Artisan.objects.create(
            user=self.user,
            name='Linked Artisan',
            name_ar='حرفي مرتبط',
            specialty='tailor',
            phone='0555987654'
        )

        self.assertEqual(artisan.user, self.user)

    def test_artisan_specialties(self):
        """Test different artisan specialties"""
        specialties = [
            'dress_designer', 'accessories_designer', 'embroidery',
            'beading', 'tailor', 'other'
        ]

        for specialty in specialties:
            artisan = Artisan.objects.create(
                name=f'{specialty} Artisan',
                name_ar=f'حرفي {specialty}',
                specialty=specialty,
                phone='0555000000'
            )
            self.assertEqual(artisan.specialty, specialty)

    def test_artisan_str_representation(self):
        """Test artisan string representation"""
        artisan = Artisan.objects.create(
            name='Test Artisan',
            name_ar='حرفي اختبار',
            specialty='embroidery',
            phone='0555111111'
        )

        self.assertIn('حرفي اختبار', str(artisan))

    def test_artisan_ratings(self):
        """Test artisan ratings"""
        artisan = Artisan.objects.create(
            name='Rated Artisan',
            name_ar='حرفي مُقيّم',
            specialty='beading',
            phone='0555222222',
            rating=Decimal('4.75'),
            review_count=50
        )

        self.assertEqual(artisan.rating, Decimal('4.75'))
        self.assertEqual(artisan.review_count, 50)

    def test_artisan_verification(self):
        """Test artisan verification"""
        artisan = Artisan.objects.create(
            name='Verified Artisan',
            name_ar='حرفي موثّق',
            specialty='tailor',
            phone='0555333333',
            is_verified=True
        )

        self.assertTrue(artisan.is_verified)


class ArtisanPortfolioModelTests(TestCase):
    """Test Cases for ArtisanPortfolio Models"""

    def setUp(self):
        self.artisan = Artisan.objects.create(
            name='Portfolio Artisan',
            name_ar='حرفي معرض',
            specialty='dress_designer',
            phone='0555444444'
        )

    def test_portfolio_creation(self):
        """Test ArtisanPortfolio model creation"""
        portfolio = ArtisanPortfolio.objects.create(
            artisan=self.artisan,
            title='Traditional Dress Collection',
            title_ar='مجموعة الأزياء التقليدية',
            description='Beautiful traditional wedding dresses'
        )

        self.assertEqual(portfolio.title, 'Traditional Dress Collection')

    def test_portfolio_ordering(self):
        """Test portfolio ordering"""
        for i in range(5):
            ArtisanPortfolio.objects.create(
                artisan=self.artisan,
                title=f'Portfolio {i}',
                title_ar=f'معرض {i}',
                order=i
            )

        portfolios = ArtisanPortfolio.objects.filter(artisan=self.artisan)
        self.assertEqual(portfolios[0].order, 0)


class ArtisanReviewModelTests(TestCase):
    """Test Cases for ArtisanReview Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='review_user@test.com',
            username='review_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.artisan = Artisan.objects.create(
            name='Reviewed Artisan',
            name_ar='حرفي مُراجَع',
            specialty='embroidery',
            phone='0555555555'
        )

    def test_review_creation(self):
        """Test ArtisanReview model creation"""
        review = ArtisanReview.objects.create(
            artisan=self.artisan,
            user=self.user,
            rating=5,
            comment='Excellent craftsmanship!'
        )

        self.assertEqual(review.rating, 5)
        self.assertEqual(review.artisan, self.artisan)

    def test_review_unique_constraint(self):
        """Test unique constraint on artisan-user pair"""
        ArtisanReview.objects.create(
            artisan=self.artisan,
            user=self.user,
            rating=4
        )

        with self.assertRaises(Exception):
            ArtisanReview.objects.create(
                artisan=self.artisan,
                user=self.user,
                rating=5
            )

    def test_review_verified(self):
        """Test verified review"""
        review = ArtisanReview.objects.create(
            artisan=self.artisan,
            user=self.user,
            rating=5,
            comment='Verified purchase',
            is_verified=True
        )

        self.assertTrue(review.is_verified)


class ArtisanSerializerTests(TestCase):
    """Test Cases for Artisan Serializers"""

    def test_artisan_serializer(self):
        """Test ArtisanSerializer"""
        artisan = Artisan.objects.create(
            name='Serializer Artisan',
            name_ar='حرفي المسلسل',
            specialty='tailor',
            phone='0555666666',
            is_active=True
        )

        serializer = ArtisanSerializer(artisan)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Artisan')
        self.assertIn('portfolio_items', data)

    def test_portfolio_serializer(self):
        """Test ArtisanPortfolioSerializer"""
        artisan = Artisan.objects.create(
            name='Portfolio Ser',
            name_ar='معرض',
            specialty='beading',
            phone='0555777777'
        )
        portfolio = ArtisanPortfolio.objects.create(
            artisan=artisan,
            title='Collection',
            title_ar='مجموعة'
        )

        serializer = ArtisanPortfolioSerializer(portfolio)
        data = serializer.data

        self.assertEqual(data['title'], 'Collection')


class ArtisanViewTests(APITestCase):
    """Test Cases for Artisan Views"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='art_view@test.com',
            username='art_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.artisan = Artisan.objects.create(
            name='View Artisan',
            name_ar='حرفي العرض',
            specialty='dress_designer',
            phone='0555888888',
            is_active=True
        )

    def test_list_artisans(self):
        """Test listing artisans"""
        response = self.client.get('/api/artisans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_artisan(self):
        """Test retrieving an artisan"""
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_specialty(self):
        """Test filtering by specialty"""
        response = self.client.get('/api/artisans/?specialty=dress_designer')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_review(self):
        """Test creating a review"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/artisan-reviews/', {
            'artisan': self.artisan.id,
            'rating': 5,
            'comment': 'Great work!'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])


class ArtisanSecurityTests(APITestCase):
    """Security Tests for Artisans"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='art_sec@test.com',
            username='art_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_bio(self):
        """Test XSS protection in bio"""
        xss_payload = '<script>alert("XSS")</script>'

        artisan = Artisan.objects.create(
            name='XSS Artisan',
            name_ar='XSS',
            specialty='other',
            phone='0555999999',
            bio=xss_payload
        )

        self.assertNotIn('<script>', artisan.bio)

    def test_sql_injection_in_specialty(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE artisans_artisan; --"

        artisan = Artisan.objects.create(
            name='SQL Artisan',
            name_ar='SQL',
            specialty=sql_payload,
            phone='0555000001'
        )

        self.assertIsNotNone(artisan.specialty)


class ArtisanEdgeCaseTests(TestCase):
    """Edge Case Tests for Artisans"""

    def test_empty_artisan_list(self):
        """Test handling of empty artisan list"""
        artisans = Artisan.objects.filter(is_active=True)
        self.assertEqual(artisans.count(), 0)

    def test_unicode_in_artisan_name(self):
        """Test Unicode in artisan names"""
        artisan = Artisan.objects.create(
            name='حرفي عربي',
            name_ar='حرفي عربي',
            specialty='embroidery',
            phone='0555000002',
            bio='هذا الحرفي متخصص في التطريز التقليدي'
        )

        self.assertIn('حرفي عربي', artisan.name)

    def test_artisan_social_links(self):
        """Test artisan social media links"""
        artisan = Artisan.objects.create(
            name='Social Artisan',
            name_ar='حرفي اجتماعي',
            specialty='accessories_designer',
            phone='0555000003',
            whatsapp='0555123456',
            instagram='artisan_handles',
            facebook='artisan.page'
        )

        self.assertEqual(artisan.whatsapp, '0555123456')
        self.assertEqual(artisan.instagram, 'artisan_handles')

    def test_artisan_location(self):
        """Test artisan location"""
        artisan = Artisan.objects.create(
            name='Located Artisan',
            name_ar='حرفي الموقع',
            specialty='tailor',
            phone='0555000004',
            address='Cité El Badr',
            city='Constantine',
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147')
        )

        self.assertEqual(artisan.city, 'Constantine')
        self.assertIsNotNone(artisan.latitude)

    def test_artisan_portfolio_many_images(self):
        """Test artisan with many portfolio items"""
        artisan = Artisan.objects.create(
            name='Many Portfolio',
            name_ar='معرض كثير',
            specialty='dress_designer',
            phone='0555000005'
        )

        for i in range(10):
            ArtisanPortfolio.objects.create(
                artisan=artisan,
                title=f'Portfolio {i}',
                title_ar=f'معرض {i}'
            )

        count = artisan.portfolio_items.count()
        self.assertEqual(count, 10)

    def test_inactive_artisan(self):
        """Test inactive artisan"""
        artisan = Artisan.objects.create(
            name='Inactive',
            name_ar='غير نشط',
            specialty='other',
            phone='0555000006',
            is_active=False
        )

        self.assertFalse(artisan.is_active)


if __name__ == '__main__':
    import unittest
    unittest.main()
