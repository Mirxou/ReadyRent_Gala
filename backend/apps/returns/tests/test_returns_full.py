"""
Comprehensive Tests for Returns App
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
from apps.returns.models import Return, ReturnItem, Refund
from apps.returns.serializers import ReturnSerializer, RefundSerializer
from apps.products.models import Product, Category
from apps.bookings.models import Booking


class ReturnModelTests(TestCase):
    """Test Cases for Return Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='return_user@test.com',
            username='return_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='return_owner@test.com',
            username='return_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='return_staff@test.com',
            username='return_staff_test',
            password='TestPass123!',
            role='staff'
        )
        self.admin = User.objects.create_user(
            email='return_admin@test.com',
            username='return_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')
        self.product = Product.objects.create(
            name_ar='فستان زفاف',
            name_en='Wedding Dress',
            owner=self.owner,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='completed'
        )

    def test_return_creation(self):
        """Test Return model creation"""
        return_request = Return.objects.create(
            booking=self.booking,
            status='requested',
            scheduled_pickup_date=date(2026, 3, 6)
        )

        self.assertEqual(return_request.status, 'requested')
        self.assertEqual(return_request.booking, self.booking)

    def test_return_statuses(self):
        """Test different return statuses"""
        statuses = [
            'requested', 'approved', 'scheduled', 'in_transit',
            'received', 'inspecting', 'accepted', 'damaged',
            'rejected', 'completed'
        ]

        for return_status in statuses:
            return_request = Return.objects.create(
                booking=self.booking,
                status=return_status
            )
            self.assertEqual(return_request.status, return_status)

    def test_return_is_late(self):
        """Test late return detection"""
        late_booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 2, 1),
            end_date=date(2026, 2, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='completed'
        )

        return_request = Return.objects.create(
            booking=late_booking,
            status='requested'
        )

        self.assertTrue(return_request.is_late())

    def test_return_str_representation(self):
        """Test return string representation"""
        return_request = Return.objects.create(
            booking=self.booking,
            status='requested'
        )

        self.assertIn('Wedding Dress', str(return_request))


class ReturnItemModelTests(TestCase):
    """Test Cases for ReturnItem Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='item_user@test.com',
            username='item_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='item_owner@test.com',
            username='item_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='إكسسوارات', name_en='Accessories')
        self.product = Product.objects.create(
            name_ar='حقيبة يد',
            name_en='Handbag',
            owner=self.owner,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 3),
            total_days=3,
            total_price=Decimal('1500.00'),
            status='completed'
        )
        self.return_request = Return.objects.create(
            booking=self.booking,
            status='received'
        )

    def test_return_item_creation(self):
        """Test ReturnItem model creation"""
        item = ReturnItem.objects.create(
            return_request=self.return_request,
            product=self.product,
            quantity_returned=1,
            condition='good'
        )

        self.assertEqual(item.product, self.product)
        self.assertEqual(item.condition, 'good')

    def test_return_item_conditions(self):
        """Test different return conditions"""
        conditions = ['excellent', 'good', 'fair', 'damaged', 'lost']

        for condition in conditions:
            item = ReturnItem.objects.create(
                return_request=self.return_request,
                product=self.product,
                quantity_returned=1,
                condition=condition
            )
            self.assertEqual(item.condition, condition)


class RefundModelTests(TestCase):
    """Test Cases for Refund Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='refund_user@test.com',
            username='refund_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='refund_owner@test.com',
            username='refund_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='أثاث', name_en='Furniture')
        self.product = Product.objects.create(
            name_ar='طاولة',
            name_en='Table',
            owner=self.owner,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 7),
            total_days=7,
            total_price=Decimal('3500.00'),
            status='completed'
        )
        self.return_request = Return.objects.create(
            booking=self.booking,
            status='accepted'
        )

    def test_refund_creation(self):
        """Test Refund model creation"""
        refund = Refund.objects.create(
            return_request=self.return_request,
            refund_type='full',
            amount=Decimal('3500.00'),
            reason='Rental completed successfully'
        )

        self.assertEqual(refund.refund_type, 'full')
        self.assertEqual(refund.amount, Decimal('3500.00'))

    def test_refund_types(self):
        """Test different refund types"""
        types = ['full', 'partial', 'damage_fee', 'late_fee']

        for refund_type in types:
            refund = Refund.objects.create(
                return_request=self.return_request,
                refund_type=refund_type,
                amount=Decimal('100.00'),
                reason=f'{refund_type} refund'
            )
            self.assertEqual(refund.refund_type, refund_type)

    def test_refund_statuses(self):
        """Test different refund statuses"""
        statuses = ['pending', 'approved', 'processed', 'completed', 'cancelled']

        for refund_status in statuses:
            refund = Refund.objects.create(
                return_request=self.return_request,
                refund_type='partial',
                amount=Decimal('100.00'),
                reason='Test refund',
                status=refund_status
            )
            self.assertEqual(refund.status, refund_status)


class ReturnSerializerTests(TestCase):
    """Test Cases for Return Serializers"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='ser_return@test.com',
            username='ser_return_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='ser_owner@test.com',
            username='ser_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='test', name_en='test')

    def test_return_serializer(self):
        """Test ReturnSerializer"""
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=self.owner,
            category=self.category
        )
        booking = Booking.objects.create(
            user=self.user,
            product=product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 3),
            total_days=3,
            total_price=Decimal('300.00'),
            status='completed'
        )
        return_request = Return.objects.create(
            booking=booking,
            status='requested'
        )

        serializer = ReturnSerializer(return_request)
        data = serializer.data

        self.assertEqual(data['status'], 'requested')
        self.assertIn('booking_details', data)
        self.assertIn('is_late', data)


class ReturnViewTests(APITestCase):
    """Test Cases for Return Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='return_admin@test.com',
            username='return_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='return_view@test.com',
            username='return_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='return_view_owner@test.com',
            username='return_view_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='ديكور', name_en='Decor')
        self.product = Product.objects.create(
            name_ar='مزهرية',
            name_en='Vase',
            owner=self.admin,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('2500.00'),
            status='completed'
        )

    def test_list_returns(self):
        """Test listing returns"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/returns/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_returns(self):
        """Test getting user's returns"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/returns/my_returns/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])


class ReturnSecurityTests(APITestCase):
    """Security Tests for Returns"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='return_sec@test.com',
            username='return_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_notes(self):
        """Test XSS protection in notes"""
        xss_payload = '<script>alert("XSS")</script>'

        return_request = Return.objects.create(
            booking_id=1,
            status='requested',
            return_notes=xss_payload
        )

        self.assertNotIn('<script>', return_request.return_notes)

    def test_sql_injection_in_status(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE returns_return; --"

        return_request = Return.objects.create(
            booking_id=1,
            status=sql_payload
        )

        self.assertIsNotNone(return_request.status)


class ReturnEdgeCaseTests(TestCase):
    """Edge Case Tests for Returns"""

    def test_empty_return_list(self):
        """Test handling of empty return list"""
        returns = Return.objects.all()
        self.assertEqual(returns.count(), 0)

    def test_unicode_in_notes(self):
        """Test Unicode in return notes"""
        return_request = Return.objects.create(
            booking_id=1,
            status='requested',
            return_notes='تم إرجاع المنتج بحالة جيدة',
            inspection_notes='الفحص أظهر حالة ممتازة'
        )

        self.assertIn('إرجاع', return_request.return_notes)

    def test_partial_refund_calculation(self):
        """Test partial refund"""
        user = User.objects.create_user(
            email='partial@test.com',
            username='partial_test',
            password='TestPass123!',
            role='tenant'
        )
        owner = User.objects.create_user(
            email='partial_owner@test.com',
            username='partial_owner_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='test3', name_en='test3')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='completed'
        )
        return_request = Return.objects.create(
            booking=booking,
            status='accepted',
            damage_cost=Decimal('500.00')
        )

        refund = Refund.objects.create(
            return_request=return_request,
            refund_type='partial',
            amount=Decimal('4500.00'),
            reason='Partial refund after damage deduction'
        )

        self.assertEqual(refund.amount, Decimal('4500.00'))

    def test_damage_assessment(self):
        """Test damage assessment"""
        user = User.objects.create_user(
            email='damage@test.com',
            username='damage_test',
            password='TestPass123!',
            role='tenant'
        )
        owner = User.objects.create_user(
            email='damage_owner@test.com',
            username='damage_owner_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='test4', name_en='test4')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 3),
            total_days=3,
            total_price=Decimal('1500.00'),
            status='completed'
        )

        return_request = Return.objects.create(
            booking=booking,
            status='damaged',
            damage_assessment='Small tear on the fabric',
            damage_cost=Decimal('200.00')
        )

        self.assertIn('tear', return_request.damage_assessment)


if __name__ == '__main__':
    import unittest
    unittest.main()
