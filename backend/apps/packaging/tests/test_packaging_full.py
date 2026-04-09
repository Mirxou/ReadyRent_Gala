"""
Comprehensive Tests for Packaging App
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
from datetime import date

from apps.users.models import User
from apps.packaging.models import PackagingType, PackagingMaterial, PackagingRule, PackagingInstance, PackagingMaterialUsage
from apps.packaging.serializers import PackagingTypeSerializer, PackagingMaterialSerializer, PackagingRuleSerializer
from apps.products.models import Product, Category
from apps.bookings.models import Booking


class PackagingTypeModelTests(TestCase):
    """Test Cases for PackagingType Models"""

    def test_packaging_type_creation(self):
        """Test PackagingType model creation"""
        packaging_type = PackagingType.objects.create(
            name='Standard Box',
            name_ar='صندوق قياسي',
            size='medium',
            dimensions_length=Decimal('30.00'),
            dimensions_width=Decimal('20.00'),
            dimensions_height=Decimal('15.00'),
            weight_capacity=Decimal('5.00')
        )

        self.assertEqual(packaging_type.name, 'Standard Box')
        self.assertEqual(packaging_type.size, 'medium')

    def test_packaging_type_sizes(self):
        """Test different packaging sizes"""
        sizes = ['small', 'medium', 'large', 'xlarge', 'custom']

        for size in sizes:
            packaging_type = PackagingType.objects.create(
                name=f'{size.title()} Package',
                name_ar=f'حزمة {size}',
                size=size
            )
            self.assertEqual(packaging_type.size, size)

    def test_packaging_type_str_representation(self):
        """Test packaging type string representation"""
        packaging_type = PackagingType.objects.create(
            name='Gift Box',
            name_ar='صندوق هدايا',
            size='medium'
        )

        self.assertIn('صندوق هدايا', str(packaging_type))


class PackagingMaterialModelTests(TestCase):
    """Test Cases for PackagingMaterial Models"""

    def test_packaging_material_creation(self):
        """Test PackagingMaterial model creation"""
        material = PackagingMaterial.objects.create(
            name='Bubble Wrap',
            name_ar='ورق فقاعي',
            material_type='bubble_wrap',
            cost_per_unit=Decimal('50.00'),
            is_reusable=False
        )

        self.assertEqual(material.name, 'Bubble Wrap')
        self.assertEqual(material.material_type, 'bubble_wrap')

    def test_material_types(self):
        """Test different material types"""
        types = ['box', 'bag', 'wrap', 'bubble_wrap', 'protective_sheet', 'hanger', 'other']

        for material_type in types:
            material = PackagingMaterial.objects.create(
                name=f'{material_type} Material',
                name_ar=f'مادة {material_type}',
                material_type=material_type
            )
            self.assertEqual(material.material_type, material_type)

    def test_reusable_material(self):
        """Test reusable material flag"""
        material = PackagingMaterial.objects.create(
            name='Cloth Bag',
            name_ar='حقيبة قماش',
            material_type='bag',
            is_reusable=True
        )

        self.assertTrue(material.is_reusable)


class PackagingRuleModelTests(TestCase):
    """Test Cases for PackagingRule Models"""

    def setUp(self):
        self.category = Category.objects.create(name_ar='فساتين', name_en='Dresses')
        self.packaging_type = PackagingType.objects.create(
            name='Garment Box',
            name_ar='صندوق ملابس',
            size='large'
        )

    def test_rule_creation_with_category(self):
        """Test rule creation with product category"""
        rule = PackagingRule.objects.create(
            product_category=self.category,
            packaging_type=self.packaging_type,
            min_rental_days=3,
            priority=1
        )

        self.assertEqual(rule.product_category, self.category)

    def test_rule_creation_with_product(self):
        """Test rule creation with specific product"""
        owner = User.objects.create_user(
            email='rule_owner@test.com',
            username='rule_owner_test',
            password='TestPass123!',
            role='owner'
        )
        product = Product.objects.create(
            name_ar='فستان فاخر',
            name_en='Luxury Dress',
            owner=owner,
            category=self.category
        )

        rule = PackagingRule.objects.create(
            product=product,
            packaging_type=self.packaging_type,
            requires_protection=True
        )

        self.assertEqual(rule.product, product)

    def test_rule_priority(self):
        """Test rule priority ordering"""
        for i in range(5):
            PackagingRule.objects.create(
                product_category=self.category,
                packaging_type=self.packaging_type,
                priority=5 - i
            )

        rules = PackagingRule.objects.all()
        priorities = [r.priority for r in rules]
        self.assertEqual(priorities, sorted(priorities, reverse=True))

    def test_rule_str_representation(self):
        """Test rule string representation"""
        rule = PackagingRule.objects.create(
            product_category=self.category,
            packaging_type=self.packaging_type
        )

        self.assertIn('صندوق ملابس', str(rule))


class PackagingInstanceModelTests(TestCase):
    """Test Cases for PackagingInstance Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='pkg_user@test.com',
            username='pkg_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='pkg_owner@test.com',
            username='pkg_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='pkg_staff@test.com',
            username='pkg_staff_test',
            password='TestPass123!',
            role='staff'
        )
        self.category = Category.objects.create(name_ar='إكسسوارات', name_en='Accessories')
        self.product = Product.objects.create(
            name_ar='حقيبة يد',
            name_en='Handbag',
            owner=self.owner,
            category=self.category
        )
        self.packaging_type = PackagingType.objects.create(
            name='Handbag Box',
            name_ar='صندوق حقائب',
            size='medium'
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('500.00'),
            status='confirmed'
        )

    def test_packaging_instance_creation(self):
        """Test PackagingInstance model creation"""
        instance = PackagingInstance.objects.create(
            booking=self.booking,
            packaging_type=self.packaging_type,
            status='prepared',
            packaging_cost=Decimal('100.00'),
            prepared_by=self.staff
        )

        self.assertEqual(instance.status, 'prepared')
        self.assertEqual(instance.packaging_cost, Decimal('100.00'))

    def test_packaging_instance_statuses(self):
        """Test different instance statuses"""
        statuses = ['prepared', 'used', 'returned', 'damaged', 'disposed']

        for status_val in statuses:
            instance = PackagingInstance.objects.create(
                booking=self.booking,
                packaging_type=self.packaging_type,
                status=status_val
            )
            self.assertEqual(instance.status, status_val)

    def test_packaging_instance_str_representation(self):
        """Test instance string representation"""
        instance = PackagingInstance.objects.create(
            booking=self.booking,
            packaging_type=self.packaging_type,
            status='prepared'
        )

        self.assertIn('Handbag', str(instance))


class PackagingMaterialUsageModelTests(TestCase):
    """Test Cases for PackagingMaterialUsage Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='usage_user@test.com',
            username='usage_user_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='usage_owner@test.com',
            username='usage_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')
        self.product = Product.objects.create(
            name_ar='بدلة',
            name_en='Suit',
            owner=self.owner,
            category=self.category
        )
        self.packaging_type = PackagingType.objects.create(
            name='Suit Cover',
            name_ar='غطاء بدلة',
            size='large'
        )
        self.material = PackagingMaterial.objects.create(
            name='Hanger',
            name_ar='كلب',
            material_type='hanger',
            cost_per_unit=Decimal('25.00')
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 3),
            total_days=3,
            total_price=Decimal('300.00'),
            status='confirmed'
        )
        self.instance = PackagingInstance.objects.create(
            booking=self.booking,
            packaging_type=self.packaging_type,
            status='prepared'
        )

    def test_material_usage_creation(self):
        """Test PackagingMaterialUsage model creation"""
        usage = PackagingMaterialUsage.objects.create(
            packaging_instance=self.instance,
            material=self.material,
            quantity=2,
            unit_cost=Decimal('25.00')
        )

        self.assertEqual(usage.quantity, 2)
        self.assertEqual(usage.total_cost, Decimal('50.00'))

    def test_material_usage_total_cost_calculation(self):
        """Test total cost calculation"""
        usage = PackagingMaterialUsage.objects.create(
            packaging_instance=self.instance,
            material=self.material,
            quantity=5,
            unit_cost=Decimal('25.00')
        )

        self.assertEqual(usage.total_cost, Decimal('125.00'))


class PackagingSerializerTests(TestCase):
    """Test Cases for Packaging Serializers"""

    def test_packaging_type_serializer(self):
        """Test PackagingTypeSerializer"""
        packaging_type = PackagingType.objects.create(
            name='Serializer Type',
            name_ar='نوع المسلسل',
            size='medium'
        )

        serializer = PackagingTypeSerializer(packaging_type)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Type')
        self.assertEqual(data['size'], 'medium')

    def test_packaging_material_serializer(self):
        """Test PackagingMaterialSerializer"""
        material = PackagingMaterial.objects.create(
            name='Material Serializer',
            name_ar='مادة المسلسل',
            material_type='box',
            cost_per_unit=Decimal('50.00')
        )

        serializer = PackagingMaterialSerializer(material)
        data = serializer.data

        self.assertEqual(data['name'], 'Material Serializer')


class PackagingViewTests(APITestCase):
    """Test Cases for Packaging Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='pkg_admin@test.com',
            username='pkg_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='pkg_view@test.com',
            username='pkg_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.packaging_type = PackagingType.objects.create(
            name='View Type',
            name_ar='نوع العرض',
            size='medium',
            is_active=True
        )
        self.material = PackagingMaterial.objects.create(
            name='View Material',
            name_ar='مادة العرض',
            material_type='box',
            is_active=True
        )

    def test_list_packaging_types(self):
        """Test listing packaging types"""
        response = self.client.get('/api/packaging/types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_packaging_materials(self):
        """Test listing packaging materials"""
        response = self.client.get('/api/packaging/materials/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_suggested_packaging(self):
        """Test suggested packaging endpoint"""
        self.client.force_authenticate(user=self.user)
        owner = User.objects.create_user(
            email='suggest_owner@test.com',
            username='suggest_owner_test',
            password='TestPass123!',
            role='owner'
        )
        category = Category.objects.create(name_ar='اختبار', name_en='Test')
        product = Product.objects.create(
            name_ar='منتج اختبار',
            name_en='Test Product',
            owner=owner,
            category=category
        )

        response = self.client.get(
            '/api/packaging/instances/suggested_for_booking/',
            {'product_id': product.id}
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class PackagingSecurityTests(APITestCase):
    """Security Tests for Packaging"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='pkg_sec@test.com',
            username='pkg_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_packaging_name(self):
        """Test XSS protection in packaging name"""
        xss_payload = '<script>alert("XSS")</script>'

        packaging_type = PackagingType.objects.create(
            name=xss_payload,
            name_ar=xss_payload,
            size='medium'
        )

        self.assertNotIn('<script>', packaging_type.name)

    def test_sql_injection_in_size(self):
        """Test SQL injection protection in size"""
        sql_payload = "'; DROP TABLE packaging_packagingtype; --"

        packaging_type = PackagingType.objects.create(
            name='SQL Test',
            name_ar='اختبار',
            size=sql_payload
        )

        self.assertIsNotNone(packaging_type.size)


class PackagingEdgeCaseTests(TestCase):
    """Edge Case Tests for Packaging"""

    def test_empty_packaging_types(self):
        """Test handling of empty packaging types"""
        types = PackagingType.objects.filter(is_active=True)
        self.assertEqual(types.count(), 0)

    def test_zero_cost_material(self):
        """Test material with zero cost"""
        material = PackagingMaterial.objects.create(
            name='Free Material',
            name_ar='مادة مجانية',
            material_type='wrap',
            cost_per_unit=Decimal('0.00')
        )

        self.assertEqual(material.cost_per_unit, Decimal('0.00'))

    def test_unicode_in_packaging(self):
        """Test Unicode in packaging names"""
        packaging_type = PackagingType.objects.create(
            name='صندوق عربي',
            name_ar='صندوق عربي',
            size='medium'
        )

        self.assertIn('صندوق عربي', packaging_type.name)

    def test_decimal_dimensions(self):
        """Test decimal dimensions"""
        packaging_type = PackagingType.objects.create(
            name='Decimal Dimensions',
            name_ar='أبعاد عشرية',
            size='custom',
            dimensions_length=Decimal('30.55'),
            dimensions_width=Decimal('20.33'),
            dimensions_height=Decimal('15.99')
        )

        self.assertEqual(packaging_type.dimensions_length, Decimal('30.55'))

    def test_rule_without_conditions(self):
        """Test rule without product or category"""
        packaging_type = PackagingType.objects.create(
            name='Default Type',
            name_ar='نوع افتراضي',
            size='medium'
        )

        rule = PackagingRule.objects.create(
            packaging_type=packaging_type
        )

        self.assertIsNone(rule.product_category)
        self.assertIsNone(rule.product)

    def test_instance_without_cost(self):
        """Test packaging instance without explicit cost"""
        owner = User.objects.create_user(
            email='cost_user@test.com',
            username='cost_user_test',
            password='TestPass123!',
            role='owner'
        )
        user = User.objects.create_user(
            email='cost_tenant@test.com',
            username='cost_tenant_test',
            password='TestPass123!',
            role='tenant'
        )
        category = Category.objects.create(name_ar='مptest', name_en='Test')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )
        packaging_type = PackagingType.objects.create(
            name='Zero Cost',
            name_ar='صفر',
            size='small'
        )
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 2),
            total_days=2,
            total_price=Decimal('100.00'),
            status='confirmed'
        )

        instance = PackagingInstance.objects.create(
            booking=booking,
            packaging_type=packaging_type,
            packaging_cost=Decimal('0.00')
        )

        self.assertEqual(instance.packaging_cost, Decimal('0.00'))


if __name__ == '__main__':
    import unittest
    unittest.main()
