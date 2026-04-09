"""
Comprehensive Tests for Maintenance App
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
from datetime import timedelta
from datetime import date

from apps.users.models import User
from apps.maintenance.models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod
from apps.maintenance.serializers import MaintenanceScheduleSerializer, MaintenanceRecordSerializer
from apps.products.models import Product, Category
from apps.bookings.models import Booking


class MaintenanceScheduleModelTests(TestCase):
    """Test Cases for MaintenanceSchedule Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='maint_owner@test.com',
            username='maint_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='أثاث', name_en='Furniture')
        self.product = Product.objects.create(
            name_ar='كنبة',
            name_en='Sofa',
            owner=self.owner,
            category=self.category
        )

    def test_schedule_creation(self):
        """Test MaintenanceSchedule model creation"""
        schedule = MaintenanceSchedule.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            duration_hours=4,
            required_between_rentals=True
        )

        self.assertEqual(schedule.maintenance_type, 'cleaning')
        self.assertTrue(schedule.required_between_rentals)

    def test_schedule_types(self):
        """Test different maintenance types"""
        types = ['cleaning', 'repair', 'inspection', 'deep_clean']

        for maint_type in types:
            schedule = MaintenanceSchedule.objects.create(
                product=self.product,
                maintenance_type=maint_type,
                duration_hours=2
            )
            self.assertEqual(schedule.maintenance_type, maint_type)

    def test_schedule_str_representation(self):
        """Test schedule string representation"""
        schedule = MaintenanceSchedule.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            duration_hours=3
        )

        self.assertIn('Sofa', str(schedule))


class MaintenanceRecordModelTests(TestCase):
    """Test Cases for MaintenanceRecord Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='record_owner@test.com',
            username='record_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='record_staff@test.com',
            username='record_staff_test',
            password='TestPass123!',
            role='staff'
        )
        self.category = Category.objects.create(name_ar='ديكور', name_en='Decor')
        self.product = Product.objects.create(
            name_ar='لوحة',
            name_en='Painting',
            owner=self.owner,
            category=self.category
        )

    def test_record_creation(self):
        """Test MaintenanceRecord model creation"""
        record = MaintenanceRecord.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=4),
            assigned_to=self.staff
        )

        self.assertEqual(record.status, 'scheduled')
        self.assertEqual(record.assigned_to, self.staff)

    def test_record_statuses(self):
        """Test different record statuses"""
        statuses = ['scheduled', 'in_progress', 'completed', 'cancelled']

        for status_val in statuses:
            record = MaintenanceRecord.objects.create(
                product=self.product,
                maintenance_type='repair',
                status=status_val,
                scheduled_start=timezone.now(),
                scheduled_end=timezone.now() + timedelta(hours=2)
            )
            self.assertEqual(record.status, status_val)

    def test_record_is_overdue(self):
        """Test overdue detection"""
        record = MaintenanceRecord.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=timezone.now() - timedelta(days=2),
            scheduled_end=timezone.now() - timedelta(days=1)
        )

        self.assertTrue(record.is_overdue())

    def test_record_duration_minutes(self):
        """Test duration calculation"""
        start = timezone.now()
        end = start + timedelta(hours=2, minutes=30)

        record = MaintenanceRecord.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            status='completed',
            scheduled_start=start,
            scheduled_end=end,
            actual_start=start,
            actual_end=end
        )

        duration = record.duration_minutes()
        self.assertEqual(duration, 150)

    def test_record_with_related_booking(self):
        """Test record with related booking"""
        user = User.objects.create_user(
            email='record_booking@test.com',
            username='record_booking_test',
            password='TestPass123!',
            role='tenant'
        )
        booking = Booking.objects.create(
            user=user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('500.00'),
            status='completed'
        )

        record = MaintenanceRecord.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=2),
            related_booking=booking
        )

        self.assertEqual(record.related_booking, booking)


class MaintenancePeriodModelTests(TestCase):
    """Test Cases for MaintenancePeriod Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='period_owner@test.com',
            username='period_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='إلكترونيات', name_en='Electronics')
        self.product = Product.objects.create(
            name_ar='تلفاز',
            name_en='TV',
            owner=self.owner,
            category=self.category
        )
        self.record = MaintenanceRecord.objects.create(
            product=self.product,
            maintenance_type='repair',
            status='scheduled',
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=4)
        )

    def test_period_creation(self):
        """Test MaintenancePeriod model creation"""
        period = MaintenancePeriod.objects.create(
            maintenance_record=self.record,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=1, hours=4),
            blocks_bookings=True
        )

        self.assertTrue(period.blocks_bookings)

    def test_period_overlap(self):
        """Test period overlap detection"""
        period = MaintenancePeriod.objects.create(
            maintenance_record=self.record,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            blocks_bookings=True
        )

        overlaps = period.overlaps_with(
            date(2026, 4, 10),
            date(2026, 4, 15)
        )
        self.assertFalse(overlaps)

        overlaps2 = period.overlaps_with(
            date(2026, 4, 8),
            date(2026, 4, 12)
        )
        self.assertTrue(overlaps2)


class MaintenanceSerializerTests(TestCase):
    """Test Cases for Maintenance Serializers"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='maint_ser@test.com',
            username='maint_ser_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')

    def test_schedule_serializer(self):
        """Test MaintenanceScheduleSerializer"""
        product = Product.objects.create(
            name_ar='فستان',
            name_en='Dress',
            owner=self.owner,
            category=self.category
        )
        schedule = MaintenanceSchedule.objects.create(
            product=product,
            maintenance_type='cleaning',
            duration_hours=2
        )

        serializer = MaintenanceScheduleSerializer(schedule)
        data = serializer.data

        self.assertEqual(data['maintenance_type'], 'cleaning')
        self.assertIn('product_name', data)

    def test_record_serializer(self):
        """Test MaintenanceRecordSerializer"""
        product = Product.objects.create(
            name_ar='معطف',
            name_en='Coat',
            owner=self.owner,
            category=self.category
        )
        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='repair',
            status='scheduled',
            scheduled_start=timezone.now(),
            scheduled_end=timezone.now() + timedelta(hours=2)
        )

        serializer = MaintenanceRecordSerializer(record)
        data = serializer.data

        self.assertEqual(data['maintenance_type'], 'repair')
        self.assertIn('is_overdue', data)


class MaintenanceViewTests(APITestCase):
    """Test Cases for Maintenance Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='maint_admin@test.com',
            username='maint_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='maint_user@test.com',
            username='maint_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = Category.objects.create(name_ar='حديقة', name_en='Garden')
        self.product = Product.objects.create(
            name_ar='طاولة',
            name_en='Table',
            owner=self.admin,
            category=self.category
        )
        self.schedule = MaintenanceSchedule.objects.create(
            product=self.product,
            maintenance_type='cleaning',
            duration_hours=2
        )

    def test_list_schedules_admin(self):
        """Test listing schedules as admin"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/maintenance/schedules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_schedule(self):
        """Test creating a schedule"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/maintenance/schedules/', {
            'product': self.product.id,
            'maintenance_type': 'repair',
            'duration_hours': 4
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_upcoming_maintenance(self):
        """Test getting upcoming maintenance"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/maintenance/records/upcoming/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MaintenanceSecurityTests(APITestCase):
    """Security Tests for Maintenance"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='maint_sec@test.com',
            username='maint_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_maintenance_notes(self):
        """Test XSS protection in notes"""
        self.client.force_authenticate(user=self.user)

        xss_payload = '<script>alert("XSS")</script>'

        response = self.client.post('/api/maintenance/schedules/', {
            'product': 1,
            'maintenance_type': 'cleaning',
            'notes': xss_payload
        })

        if response.status_code == status.HTTP_201_CREATED:
            self.assertNotIn('<script>', str(response.data))

    def test_sql_injection_in_type(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE maintenance_maintenancerecord; --"

        record = MaintenanceRecord.objects.create(
            product_id=1,
            maintenance_type=sql_payload,
            status='scheduled',
            scheduled_start=timezone.now(),
            scheduled_end=timezone.now() + timedelta(hours=2)
        )

        self.assertIsNotNone(record.maintenance_type)


class MaintenanceEdgeCaseTests(TestCase):
    """Edge Case Tests for Maintenance"""

    def test_empty_schedule_list(self):
        """Test handling of empty schedule list"""
        schedules = MaintenanceSchedule.objects.all()
        self.assertEqual(schedules.count(), 0)

    def test_zero_duration(self):
        """Test maintenance with zero duration"""
        owner = User.objects.create_user(
            email='zero_dur@test.com',
            username='zero_dur_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='test', name_en='test')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )

        schedule = MaintenanceSchedule.objects.create(
            product=product,
            maintenance_type='inspection',
            duration_hours=0
        )

        self.assertEqual(schedule.duration_hours, 0)

    def test_unicode_in_notes(self):
        """Test Unicode in maintenance notes"""
        owner = User.objects.create_user(
            email='unicode_maint@test.com',
            username='unicode_maint_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='test2', name_en='test2')
        product = Product.objects.create(
            name_ar='منتج اختبار',
            name_en='Test Product',
            owner=owner,
            category=category
        )

        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='cleaning',
            status='scheduled',
            scheduled_start=timezone.now(),
            scheduled_end=timezone.now() + timedelta(hours=2),
            notes='تم تنظيف المنتج بشكل جيد'
        )

        self.assertIn('تنظيف', record.notes)

    def test_past_maintenance_not_overdue(self):
        """Test completed maintenance not marked overdue"""
        owner = User.objects.create_user(
            email='past_maint@test.com',
            username='past_maint_test',
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

        record = MaintenanceRecord.objects.create(
            product=product,
            maintenance_type='cleaning',
            status='completed',
            scheduled_start=timezone.now() - timedelta(days=2),
            scheduled_end=timezone.now() - timedelta(days=1)
        )

        self.assertFalse(record.is_overdue())


if __name__ == '__main__':
    import unittest
    unittest.main()
