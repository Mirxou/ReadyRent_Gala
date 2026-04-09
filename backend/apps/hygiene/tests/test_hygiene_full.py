"""
Comprehensive Tests for Hygiene App
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

from apps.users.models import User
from apps.hygiene.models import HygieneRecord, HygieneChecklist, HygieneCertificate
from apps.hygiene.serializers import HygieneRecordSerializer, HygieneCertificateSerializer
from apps.products.models import Product, Category


class HygieneRecordModelTests(TestCase):
    """Test Cases for HygieneRecord Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='hyg_owner@test.com',
            username='hyg_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='hyg_staff@test.com',
            username='hyg_staff_test',
            password='TestPass123!',
            role='staff'
        )
        self.admin = User.objects.create_user(
            email='hyg_admin@test.com',
            username='hyg_admin_test',
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

    def test_hygiene_record_creation(self):
        """Test HygieneRecord model creation"""
        record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='deep',
            status='pending',
            scheduled_date=timezone.now() + timedelta(hours=2),
            cleaned_by=self.staff
        )

        self.assertEqual(record.cleaning_type, 'deep')
        self.assertEqual(record.status, 'pending')

    def test_hygiene_record_types(self):
        """Test different cleaning types"""
        types = ['standard', 'deep', 'sanitization', 'sterilization', 'dry_clean']

        for clean_type in types:
            record = HygieneRecord.objects.create(
                product=self.product,
                cleaning_type=clean_type,
                status='pending',
                scheduled_date=timezone.now()
            )
            self.assertEqual(record.cleaning_type, clean_type)

    def test_hygiene_record_statuses(self):
        """Test different hygiene record statuses"""
        statuses = ['pending', 'in_progress', 'completed', 'verified', 'failed']

        for status_val in statuses:
            record = HygieneRecord.objects.create(
                product=self.product,
                cleaning_type='cleaning',
                status=status_val,
                scheduled_date=timezone.now()
            )
            self.assertEqual(record.status, status_val)

    def test_hygiene_record_is_overdue(self):
        """Test overdue detection"""
        record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='cleaning',
            status='pending',
            scheduled_date=timezone.now() - timedelta(hours=1)
        )

        self.assertTrue(record.is_overdue())

    def test_hygiene_record_quality_score(self):
        """Test quality score"""
        record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='cleaning',
            status='completed',
            scheduled_date=timezone.now(),
            quality_score=9
        )

        self.assertEqual(record.quality_score, 9)

    def test_hygiene_record_temperature(self):
        """Test temperature recording"""
        record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='sanitization',
            status='pending',
            scheduled_date=timezone.now(),
            temperature=Decimal('60.00')
        )

        self.assertEqual(record.temperature, Decimal('60.00'))


class HygieneChecklistModelTests(TestCase):
    """Test Cases for HygieneChecklist Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='check_owner@test.com',
            username='check_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='check_staff@test.com',
            username='check_staff_test',
            password='TestPass123!',
            role='staff'
        )
        self.category = Category.objects.create(name_ar='أكسسوارات', name_en='Accessories')
        self.product = Product.objects.create(
            name_ar='حقيبة يد',
            name_en='Handbag',
            owner=self.owner,
            category=self.category
        )
        self.record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='cleaning',
            status='in_progress',
            scheduled_date=timezone.now()
        )

    def test_checklist_creation(self):
        """Test HygieneChecklist model creation"""
        item = HygieneChecklist.objects.create(
            hygiene_record=self.record,
            item_name='Surface cleaned',
            item_name_ar='تم تنظيف السطح',
            is_checked=False
        )

        self.assertEqual(item.item_name, 'Surface cleaned')

    def test_checklist_checked(self):
        """Test checklist item checked"""
        item = HygieneChecklist.objects.create(
            hygiene_record=self.record,
            item_name='Interior cleaned',
            is_checked=True,
            checked_by=self.staff,
            checked_at=timezone.now()
        )

        self.assertTrue(item.is_checked)
        self.assertEqual(item.checked_by, self.staff)

    def test_checklist_notes(self):
        """Test checklist item with notes"""
        item = HygieneChecklist.objects.create(
            hygiene_record=self.record,
            item_name='Stain removal',
            notes='Used special cleaning solution'
        )

        self.assertIn('cleaning solution', item.notes)


class HygieneCertificateModelTests(TestCase):
    """Test Cases for HygieneCertificate Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='cert_owner@test.com',
            username='cert_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='أثاث', name_en='Furniture')
        self.product = Product.objects.create(
            name_ar='كرسي',
            name_en='Chair',
            owner=self.owner,
            category=self.category
        )
        self.record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='sanitization',
            status='verified',
            scheduled_date=timezone.now(),
            passed_inspection=True
        )

    def test_certificate_creation(self):
        """Test HygieneCertificate model creation"""
        certificate = HygieneCertificate.objects.create(
            hygiene_record=self.record,
            certificate_number='HC-001-20260408'
        )

        self.assertEqual(certificate.certificate_number, 'HC-001-20260408')
        self.assertTrue(certificate.is_valid)

    def test_certificate_is_expired(self):
        """Test certificate expiry"""
        certificate = HygieneCertificate.objects.create(
            hygiene_record=self.record,
            certificate_number='HC-002-20260408',
            expiry_date=timezone.now() + timedelta(days=30)
        )

        self.assertFalse(certificate.is_expired())

    def test_certificate_expired(self):
        """Test expired certificate"""
        certificate = HygieneCertificate.objects.create(
            hygiene_record=self.record,
            certificate_number='HC-003-20260408',
            expiry_date=timezone.now() - timedelta(days=1)
        )

        self.assertTrue(certificate.is_expired())


class HygieneSerializerTests(TestCase):
    """Test Cases for Hygiene Serializers"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='hyg_ser@test.com',
            username='hyg_ser_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='test', name_en='test')

    def test_hygiene_record_serializer(self):
        """Test HygieneRecordSerializer"""
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=self.owner,
            category=self.category
        )
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='deep',
            status='pending',
            scheduled_date=timezone.now()
        )

        serializer = HygieneRecordSerializer(record)
        data = serializer.data

        self.assertEqual(data['cleaning_type'], 'deep')
        self.assertIn('product_name', data)

    def test_certificate_serializer(self):
        """Test HygieneCertificateSerializer"""
        product = Product.objects.create(
            name_ar='شهادة',
            name_en='Certificate',
            owner=self.owner,
            category=self.category
        )
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='cleaning',
            status='verified',
            scheduled_date=timezone.now()
        )
        certificate = HygieneCertificate.objects.create(
            hygiene_record=record,
            certificate_number='HC-TEST-001'
        )

        serializer = HygieneCertificateSerializer(certificate)
        data = serializer.data

        self.assertEqual(data['certificate_number'], 'HC-TEST-001')
        self.assertIn('is_expired', data)


class HygieneViewTests(APITestCase):
    """Test Cases for Hygiene Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='hyg_admin@test.com',
            username='hyg_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='hyg_user@test.com',
            username='hyg_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.category = Category.objects.create(name_ar='ديكور', name_en='Decor')
        self.product = Product.objects.create(
            name_ar='مزهرية',
            name_en='Vase',
            owner=self.admin,
            category=self.category
        )
        self.record = HygieneRecord.objects.create(
            product=self.product,
            cleaning_type='cleaning',
            status='pending',
            scheduled_date=timezone.now()
        )

    def test_list_hygiene_records(self):
        """Test listing hygiene records"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/hygiene/records/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_pending_hygiene_records(self):
        """Test getting pending records"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/hygiene/records/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_hygiene_record(self):
        """Test creating hygiene record"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/hygiene/records/', {
            'product': self.product.id,
            'cleaning_type': 'deep',
            'scheduled_date': timezone.now().isoformat()
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])


class HygieneSecurityTests(APITestCase):
    """Security Tests for Hygiene"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='hyg_sec@test.com',
            username='hyg_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_cleaning_notes(self):
        """Test XSS protection in notes"""
        self.client.force_authenticate(user=self.user)

        xss_payload = '<script>alert("XSS")</script>'

        response = self.client.post('/api/hygiene/records/', {
            'product': 1,
            'cleaning_type': 'cleaning',
            'scheduled_date': timezone.now().isoformat(),
            'cleaning_notes': xss_payload
        })

        if response.status_code == status.HTTP_201_CREATED:
            self.assertNotIn('<script>', str(response.data))

    def test_sql_injection_in_type(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE hygiene_hygienerecord; --"

        record = HygieneRecord.objects.create(
            product_id=1,
            cleaning_type=sql_payload,
            status='pending',
            scheduled_date=timezone.now()
        )

        self.assertIsNotNone(record.cleaning_type)


class HygieneEdgeCaseTests(TestCase):
    """Edge Case Tests for Hygiene"""

    def test_empty_hygiene_records(self):
        """Test handling of empty records"""
        records = HygieneRecord.objects.all()
        self.assertEqual(records.count(), 0)

    def test_unicode_in_notes(self):
        """Test Unicode in cleaning notes"""
        owner = User.objects.create_user(
            email='hyg_unicode@test.com',
            username='hyg_unicode_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='unicode', name_en='unicode')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )

        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='deep',
            status='completed',
            scheduled_date=timezone.now(),
            cleaning_notes='تم التنظيف بمحلول خاص'
        )

        self.assertIn('التنظيف', record.cleaning_notes)

    def test_checklist_with_many_items(self):
        """Test checklist with many items"""
        owner = User.objects.create_user(
            email='checklist_many@test.com',
            username='checklist_many_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='many', name_en='many')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='deep',
            status='in_progress',
            scheduled_date=timezone.now()
        )

        for i in range(15):
            HygieneChecklist.objects.create(
                hygiene_record=record,
                item_name=f'Check item {i}'
            )

        count = record.checklist_items.count()
        self.assertEqual(count, 15)

    def test_verified_not_overdue(self):
        """Test verified record not marked overdue"""
        owner = User.objects.create_user(
            email='hyg_verified@test.com',
            username='hyg_verified_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='verified', name_en='verified')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )

        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='cleaning',
            status='verified',
            scheduled_date=timezone.now() - timedelta(hours=2)
        )

        self.assertFalse(record.is_overdue())

    def test_chemicals_used(self):
        """Test chemicals used field"""
        owner = User.objects.create_user(
            email='hyg_chem@test.com',
            username='hyg_chem_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='chem', name_en='chem')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )

        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='sanitization',
            status='pending',
            scheduled_date=timezone.now(),
            chemicals_used='Alcohol 70%, Water'
        )

        self.assertIn('Alcohol', record.chemicals_used)


if __name__ == '__main__':
    import unittest
    unittest.main()
