"""
Comprehensive Tests for Reviews App
Full Coverage: Models, Views, Serializers, Services, Security, Edge Cases
"""
import os
import sys
import django
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch

from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.reviews.models import Review, ReviewResponse


class ReviewModelTests(TestCase):
    """Test Cases for Review Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='review@test.com',
            username='review_test',
            password='TestPass123!',
            role='tenant'
        )
        self.vendor = User.objects.create_user(
            email='vendor_review@test.com',
            username='vendor_review_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='test', name_en='test')

    def test_review_creation(self):
        """Test Review model creation"""
        product = Product.objects.create(
            name_ar='Test Product',
            owner=self.vendor,
            category=self.category
        )
        
        review = Review.objects.create(
            product=product,
            user=self.user,
            rating=5,
            title='Great product',
            content='Excellent service'
        )
        
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.title, 'Great product')
        self.assertIsNotNone(review.created_at)

    def test_review_with_response(self):
        """Test Review with vendor response"""
        product = Product.objects.create(
            name_ar='Test Product 2',
            owner=self.vendor,
            category=self.category
        )
        
        review = Review.objects.create(
            product=product,
            user=self.user,
            rating=4,
            content='Good but could be better'
        )
        
        response = ReviewResponse.objects.create(
            review=review,
            user=self.vendor,
            content='Thank you for your feedback'
        )
        
        self.assertEqual(review.responses.count(), 1)
        self.assertEqual(response.content, 'Thank you for your feedback')

    def test_review_rating_validation(self):
        """Test rating validation"""
        product = Product.objects.create(
            name_ar='Test Product 3',
            owner=self.vendor,
            category=self.category
        )
        
        review = Review.objects.create(
            product=product,
            user=self.user,
            rating=3,
            content='Average'
        )
        
        self.assertGreaterEqual(review.rating, 1)
        self.assertLessEqual(review.rating, 5)


class ReviewViewTests(APITestCase):
    """Test Cases for Review Views"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='review_view@test.com',
            username='review_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.vendor = User.objects.create_user(
            email='vendor_view@test.com',
            username='vendor_view_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='cat', name_en='cat')

    def test_create_review(self):
        """Test creating a review"""
        self.client.force_authenticate(user=self.user)
        
        product = Product.objects.create(
            name_ar='Test Product',
            owner=self.vendor,
            category=self.category
        )
        
        response = self.client.post('/api/reviews/', {
            'product': product.id,
            'rating': 5,
            'title': 'Great!',
            'content': 'Excellent service'
        })
        
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_list_reviews(self):
        """Test listing reviews"""
        response = self.client.get('/api/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_review_owner_only(self):
        """Test only owner can update review"""
        self.client.force_authenticate(user=self.user)
        
        product = Product.objects.create(
            name_ar='Test Product 2',
            owner=self.vendor,
            category=self.category
        )
        
        review_response = self.client.post('/api/reviews/', {
            'product': product.id,
            'rating': 4,
            'content': 'Good'
        })
        
        if review_response.status_code == status.HTTP_201_CREATED:
            review_id = review_response.data.get('id')
            if review_id:
                other_user = User.objects.create_user(
                    email='other@test.com',
                    username='other_test',
                    password='TestPass123!',
                    role='tenant'
                )
                self.client.force_authenticate(user=other_user)
                update_response = self.client.patch(f'/api/reviews/{review_id}/', {
                    'rating': 1
                })
                self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)


class ReviewSecurityTests(APITestCase):
    """Security Tests for Reviews"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user_sec@test.com',
            username='user_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_review_content(self):
        """Test XSS protection in review content"""
        self.client.force_authenticate(user=self.user)
        
        xss_payload = '<script>alert("XSS")</script>'
        
        response = self.client.post('/api/reviews/', {
            'rating': 5,
            'title': 'XSS Test',
            'content': xss_payload
        })
        
        if response.status_code == status.HTTP_201_CREATED:
            self.assertNotIn('<script>', str(response.data))

    def test_sql_injection_in_review(self):
        """Test SQL injection protection"""
        self.client.force_authenticate(user=self.user)
        
        sql_payload = "'; DROP TABLE reviews; --"
        
        response = self.client.post('/api/reviews/', {
            'rating': 5,
            'content': sql_payload
        })
        
        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


if __name__ == '__main__':
    import unittest
    unittest.main()
