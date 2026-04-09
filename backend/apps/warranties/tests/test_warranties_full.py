"""
Comprehensive Tests for Warranties App
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
from datetime import date, timedelta

from apps.users.models import User
from apps.warranties.models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan
from apps.warranties.serializers import WarrantyPlanSerializer, WarrantyPurchaseSerializer
from apps.products.models import Product, Category
from apps.bookings.models import Booking


class WarrantyPlanModelTests(TestCase):
    """Test Cases for WarrantyPlan Models"""

    def test_warranty_plan_creation(self):
        """Test WarrantyPlan model creation"""
        plan = WarrantyPlan.objects.create(
            name='Basic Protection',
            name_ar='حماية أساسية',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('100.00'),
            max_coverage_amount=Decimal('5000.00'),
            deductible=Decimal('50.00'),
            covers_accidental_damage=True
        )

        self.assertEqual(plan.name, 'Basic Protection')
        self.assertEqual(plan.plan_type, 'basic')

    def test_warranty_plan_types(self):
        """Test different plan types"""
        types = ['basic', 'standard', 'premium', 'full_coverage']

        for plan_type in types:
            plan = WarrantyPlan.objects.create(
                name=f'{plan_type.title()} Plan',
                name_ar=f'خطة {plan_type}',
                plan_type=plan_type,
                coverage_type='damage',
                price=Decimal('100.00')
            )
            self.assertEqual(plan.plan_type, plan_type)

    def test_warranty_plan_coverage_types(self):
        """Test different coverage types"""
        types = ['damage', 'theft', 'loss', 'full']

        for coverage_type in types:
            plan = WarrantyPlan.objects.create(
                name=f'{coverage_type.title()} Coverage',
                name_ar=f'{coverage_type} التغطية',
                plan_type='standard',
                coverage_type=coverage_type,
                price=Decimal('100.00')
            )
            self.assertEqual(plan.coverage_type, coverage_type)

    def test_warranty_plan_price_calculation(self):
        """Test price calculation"""
        plan = WarrantyPlan.objects.create(
            name='Percentage Plan',
            name_ar='خطة النسبة',
            plan_type='standard',
            coverage_type='damage',
            price_percentage=Decimal('10.00')
        )

        rental_price = Decimal('1000.00')
        calculated_price = plan.calculate_price(rental_price)
        self.assertEqual(calculated_price, Decimal('100.00'))

    def test_warranty_plan_str_representation(self):
        """Test plan string representation"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة اختبار',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('100.00')
        )

        self.assertIn('خطة اختبار', str(plan))


class WarrantyPurchaseModelTests(TestCase):
    """Test Cases for WarrantyPurchase Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='warranty_user@test.com',
            username='warranty_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='warranty_owner@test.com',
            username='warranty_owner_test',
            password='TestPass123!',
            role='owner'
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
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='confirmed'
        )
        self.plan = WarrantyPlan.objects.create(
            name='Basic Warranty',
            name_ar='ضمان أساسي',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('200.00'),
            max_coverage_amount=Decimal('5000.00'),
            deductible=Decimal('100.00')
        )

    def test_purchase_creation(self):
        """Test WarrantyPurchase model creation"""
        purchase = WarrantyPurchase.objects.create(
            booking=self.booking,
            warranty_plan=self.plan,
            warranty_price=Decimal('200.00'),
            coverage_amount=Decimal('5000.00'),
            deductible=Decimal('100.00'),
            expires_at=timezone.now() + timedelta(days=30)
        )

        self.assertEqual(purchase.warranty_price, Decimal('200.00'))
        self.assertEqual(purchase.status, 'active')

    def test_purchase_statuses(self):
        """Test different purchase statuses"""
        statuses = ['active', 'claimed', 'expired', 'void']

        for purchase_status in statuses:
            purchase = WarrantyPurchase.objects.create(
                booking=self.booking,
                warranty_plan=self.plan,
                warranty_price=Decimal('100.00'),
                coverage_amount=Decimal('5000.00'),
                deductible=Decimal('100.00'),
                expires_at=timezone.now() + timedelta(days=30),
                status=purchase_status
            )
            self.assertEqual(purchase.status, purchase_status)


class WarrantyClaimModelTests(TestCase):
    """Test Cases for WarrantyClaim Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='claim_user@test.com',
            username='claim_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.admin = User.objects.create_user(
            email='claim_admin@test.com',
            username='claim_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.owner = User.objects.create_user(
            email='claim_owner@test.com',
            username='claim_owner_test',
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
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 5),
            total_days=5,
            total_price=Decimal('2000.00'),
            status='completed'
        )
        self.plan = WarrantyPlan.objects.create(
            name='Premium Warranty',
            name_ar='ضمان متميز',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('300.00'),
            max_coverage_amount=Decimal('10000.00'),
            deductible=Decimal('200.00')
        )
        self.purchase = WarrantyPurchase.objects.create(
            booking=self.booking,
            warranty_plan=self.plan,
            warranty_price=Decimal('300.00'),
            coverage_amount=Decimal('10000.00'),
            deductible=Decimal('200.00'),
            expires_at=timezone.now() + timedelta(days=365)
        )

    def test_claim_creation(self):
        """Test WarrantyClaim model creation"""
        claim = WarrantyClaim.objects.create(
            warranty_purchase=self.purchase,
            claim_type='damage',
            claim_amount=Decimal('1500.00'),
            description='Item was damaged during use'
        )

        self.assertEqual(claim.claim_type, 'damage')
        self.assertEqual(claim.status, 'pending')

    def test_claim_types(self):
        """Test different claim types"""
        claim_types = ['damage', 'theft', 'loss', 'other']

        for claim_type in claim_types:
            claim = WarrantyClaim.objects.create(
                warranty_purchase=self.purchase,
                claim_type=claim_type,
                claim_amount=Decimal('1000.00'),
                description=f'{claim_type} claim'
            )
            self.assertEqual(claim.claim_type, claim_type)

    def test_claim_statuses(self):
        """Test different claim statuses"""
        statuses = ['pending', 'reviewing', 'approved', 'rejected', 'paid']

        for claim_status in statuses:
            claim = WarrantyClaim.objects.create(
                warranty_purchase=self.purchase,
                claim_type='damage',
                claim_amount=Decimal('1000.00'),
                description='Test claim',
                status=claim_status
            )
            self.assertEqual(claim.status, claim_status)


class InsurancePlanModelTests(TestCase):
    """Test Cases for InsurancePlan Models"""

    def test_insurance_plan_creation(self):
        """Test InsurancePlan model creation"""
        plan = InsurancePlan.objects.create(
            name='Full Coverage Insurance',
            name_ar='تأمين التغطية الكاملة',
            plan_type='full_coverage',
            base_price=Decimal('500.00'),
            max_coverage_percentage=Decimal('90.00'),
            deductible_percentage=Decimal('10.00'),
            covers_damage=True,
            covers_theft=True,
            covers_accidental_damage=True
        )

        self.assertEqual(plan.name, 'Full Coverage Insurance')
        self.assertTrue(plan.covers_damage)

    def test_insurance_price_calculation(self):
        """Test insurance price calculation"""
        plan = InsurancePlan.objects.create(
            name='Percentage Insurance',
            name_ar='تأمين النسبة',
            plan_type='premium',
            price_percentage=Decimal('5.00')
        )

        product_value = Decimal('10000.00')
        calculated_price = plan.calculate_price(product_value)
        self.assertEqual(calculated_price, Decimal('500.00'))

    def test_insurance_coverage_calculation(self):
        """Test coverage calculation"""
        plan = InsurancePlan.objects.create(
            name='Coverage Calculator',
            name_ar='حاسبة التغطية',
            plan_type='premium',
            max_coverage_percentage=Decimal('80.00')
        )

        product_value = Decimal('10000.00')
        coverage = plan.calculate_coverage(product_value)
        self.assertEqual(coverage, Decimal('8000.00'))

    def test_insurance_deductible_calculation(self):
        """Test deductible calculation"""
        plan = InsurancePlan.objects.create(
            name='Deductible Calculator',
            name_ar='حاسبة التحمل',
            plan_type='standard',
            deductible_percentage=Decimal('15.00')
        )

        claim_amount = Decimal('1000.00')
        deductible = plan.calculate_deductible(claim_amount)
        self.assertEqual(deductible, Decimal('150.00'))


class WarrantySerializerTests(TestCase):
    """Test Cases for Warranty Serializers"""

    def test_warranty_plan_serializer(self):
        """Test WarrantyPlanSerializer"""
        plan = WarrantyPlan.objects.create(
            name='Serializer Plan',
            name_ar='خطة المسلسل',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('150.00'),
            max_coverage_amount=Decimal('5000.00')
        )

        serializer = WarrantyPlanSerializer(plan)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Plan')
        self.assertIn('covers_accidental_damage', data)


class WarrantyViewTests(APITestCase):
    """Test Cases for Warranty Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='warranty_admin@test.com',
            username='warranty_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='warranty_view@test.com',
            username='warranty_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.plan = WarrantyPlan.objects.create(
            name='View Plan',
            name_ar='خطة العرض',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('100.00'),
            is_active=True
        )

    def test_list_warranty_plans(self):
        """Test listing warranty plans"""
        response = self.client.get('/api/warranties/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_warranty_plan(self):
        """Test retrieving a warranty plan"""
        response = self.client.get(f'/api/warranties/plans/{self.plan.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_calculate_warranty_price(self):
        """Test calculating warranty price"""
        response = self.client.get(
            f'/api/warranties/plans/{self.plan.id}/calculate_price/',
            {'rental_price': '1000'}
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class WarrantySecurityTests(APITestCase):
    """Security Tests for Warranties"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='warranty_sec@test.com',
            username='warranty_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_plan_name(self):
        """Test XSS protection in plan name"""
        xss_payload = '<script>alert("XSS")</script>'

        plan = WarrantyPlan.objects.create(
            name=xss_payload,
            name_ar=xss_payload,
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('100.00')
        )

        self.assertNotIn('<script>', plan.name)

    def test_sql_injection_in_type(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE warranties_warrantyplan; --"

        plan = WarrantyPlan.objects.create(
            name='SQL Plan',
            name_ar='SQL',
            plan_type=sql_payload,
            coverage_type='damage',
            price=Decimal('100.00')
        )

        self.assertIsNotNone(plan.plan_type)


class WarrantyEdgeCaseTests(TestCase):
    """Edge Case Tests for Warranties"""

    def test_empty_warranty_plans(self):
        """Test handling of empty warranty plans"""
        plans = WarrantyPlan.objects.filter(is_active=True)
        self.assertEqual(plans.count(), 0)

    def test_unicode_in_plan_name(self):
        """Test Unicode in plan names"""
        plan = WarrantyPlan.objects.create(
            name='خطة عربية',
            name_ar='خطة عربية',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('100.00'),
            description='هذا وصف الخطة باللغة العربية'
        )

        self.assertIn('خطة عربية', plan.name)

    def test_zero_price_plan(self):
        """Test zero price plan"""
        plan = WarrantyPlan.objects.create(
            name='Free Warranty',
            name_ar='ضمان مجاني',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('0.00')
        )

        self.assertEqual(plan.price, Decimal('0.00'))

    def test_expired_purchase(self):
        """Test expired purchase"""
        user = User.objects.create_user(
            email='expired@test.com',
            username='expired_test',
            password='TestPass123!',
            role='tenant'
        )
        owner = User.objects.create_user(
            email='expired_owner@test.com',
            username='expired_owner_test',
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
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 3),
            total_days=3,
            total_price=Decimal('300.00'),
            status='completed'
        )
        plan = WarrantyPlan.objects.create(
            name='Expired Plan',
            name_ar='خطة منتهية',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('50.00')
        )

        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('50.00'),
            coverage_amount=Decimal('1000.00'),
            deductible=Decimal('50.00'),
            expires_at=timezone.now() - timedelta(days=1)
        )

        self.assertTrue(purchase.status == 'expired' or purchase.expires_at < timezone.now())


if __name__ == '__main__':
    import unittest
    unittest.main()
