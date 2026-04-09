"""
Comprehensive Tests for Branches App
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
from apps.branches.models import Branch, BranchInventory, BranchStaff, BranchPerformance
from apps.branches.serializers import BranchSerializer, BranchInventorySerializer
from apps.products.models import Product, Category


class BranchModelTests(TestCase):
    """Test Cases for Branch Models"""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='branch_admin@test.com',
            username='branch_admin_test',
            password='TestPass123!',
            role='admin'
        )
        self.staff = User.objects.create_user(
            email='branch_manager@test.com',
            username='branch_manager_test',
            password='TestPass123!',
            role='staff'
        )

    def test_branch_creation(self):
        """Test Branch model creation"""
        branch = Branch.objects.create(
            name='Downtown Branch',
            name_ar='فرع وسط المدينة',
            code='DOWN001',
            address='123 Main Street',
            city='Constantine',
            phone='0555123456',
            email='downtown@readyrent.com',
            manager=self.staff,
            is_active=True
        )

        self.assertEqual(branch.name, 'Downtown Branch')
        self.assertEqual(branch.code, 'DOWN001')
        self.assertEqual(branch.city, 'Constantine')

    def test_branch_unique_code(self):
        """Test branch unique code constraint"""
        Branch.objects.create(
            name='Branch 1',
            name_ar='فرع 1',
            code='UNIQUE001',
            address='Address 1',
            city='Constantine',
            phone='0555000001'
        )

        with self.assertRaises(Exception):
            Branch.objects.create(
                name='Branch 2',
                name_ar='فرع 2',
                code='UNIQUE001',
                address='Address 2',
                city='Constantine',
                phone='0555000002'
            )

    def test_branch_str_representation(self):
        """Test branch string representation"""
        branch = Branch.objects.create(
            name='Test Branch',
            name_ar='فرع اختبار',
            code='TEST001',
            address='Test Address',
            city='Constantine',
            phone='0555000003'
        )

        self.assertIn('فرع اختبار', str(branch))

    def test_branch_opening_hours(self):
        """Test branch opening hours JSON"""
        branch = Branch.objects.create(
            name='Hours Branch',
            name_ar='فرع الساعات',
            code='HOURS001',
            address='Hours Address',
            city='Constantine',
            phone='0555000004',
            opening_hours={
                'monday': {'open': '09:00', 'close': '18:00'},
                'friday': {'open': '14:00', 'close': '20:00'}
            }
        )

        self.assertIn('monday', branch.opening_hours)


class BranchInventoryModelTests(TestCase):
    """Test Cases for BranchInventory Models"""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='inv_owner@test.com',
            username='inv_owner_test',
            password='TestPass123!',
            role='owner'
        )
        self.branch = Branch.objects.create(
            name='Inventory Branch',
            name_ar='فرع المخزون',
            code='INV001',
            address='Inventory Address',
            city='Constantine',
            phone='0555000005'
        )
        self.category = Category.objects.create(name_ar='ملابس', name_en='Clothes')
        self.product = Product.objects.create(
            name_ar='فستان',
            name_en='Dress',
            owner=self.owner,
            category=self.category
        )

    def test_branch_inventory_creation(self):
        """Test BranchInventory model creation"""
        inventory = BranchInventory.objects.create(
            branch=self.branch,
            product=self.product,
            quantity_total=10,
            quantity_available=8,
            quantity_rented=2,
            low_stock_threshold=2
        )

        self.assertEqual(inventory.quantity_total, 10)
        self.assertEqual(inventory.quantity_available, 8)

    def test_branch_inventory_unique_constraint(self):
        """Test unique constraint on branch-product pair"""
        BranchInventory.objects.create(
            branch=self.branch,
            product=self.product,
            quantity_total=10
        )

        with self.assertRaises(Exception):
            BranchInventory.objects.create(
                branch=self.branch,
                product=self.product,
                quantity_total=15
            )

    def test_branch_inventory_low_stock(self):
        """Test low stock detection"""
        inventory = BranchInventory.objects.create(
            branch=self.branch,
            product=self.product,
            quantity_total=10,
            quantity_available=1,
            low_stock_threshold=3
        )

        self.assertTrue(inventory.is_low_stock())

    def test_branch_inventory_str_representation(self):
        """Test inventory string representation"""
        inventory = BranchInventory.objects.create(
            branch=self.branch,
            product=self.product,
            quantity_total=10,
            quantity_available=5
        )

        self.assertIn('Dress', str(inventory))


class BranchStaffModelTests(TestCase):
    """Test Cases for BranchStaff Models"""

    def setUp(self):
        self.branch = Branch.objects.create(
            name='Staff Branch',
            name_ar='فرع الموظفين',
            code='STAFF001',
            address='Staff Address',
            city='Constantine',
            phone='0555000006'
        )
        self.staff1 = User.objects.create_user(
            email='staff1@branch.com',
            username='staff1_branch',
            password='TestPass123!',
            role='staff'
        )
        self.staff2 = User.objects.create_user(
            email='staff2@branch.com',
            username='staff2_branch',
            password='TestPass123!',
            role='staff'
        )

    def test_staff_assignment(self):
        """Test staff assignment to branch"""
        assignment = BranchStaff.objects.create(
            branch=self.branch,
            staff=self.staff1,
            role='sales_associate'
        )

        self.assertEqual(assignment.staff, self.staff1)
        self.assertTrue(assignment.is_active)

    def test_staff_unique_constraint(self):
        """Test unique constraint on staff-branch pair"""
        BranchStaff.objects.create(
            branch=self.branch,
            staff=self.staff1,
            role='manager'
        )

        with self.assertRaises(Exception):
            BranchStaff.objects.create(
                branch=self.branch,
                staff=self.staff1,
                role='sales'
            )

    def test_multiple_staff(self):
        """Test multiple staff in same branch"""
        BranchStaff.objects.create(
            branch=self.branch,
            staff=self.staff1,
            role='manager'
        )
        BranchStaff.objects.create(
            branch=self.branch,
            staff=self.staff2,
            role='sales'
        )

        count = BranchStaff.objects.filter(branch=self.branch).count()
        self.assertEqual(count, 2)


class BranchPerformanceModelTests(TestCase):
    """Test Cases for BranchPerformance Models"""

    def setUp(self):
        self.branch = Branch.objects.create(
            name='Performance Branch',
            name_ar='فرع الأداء',
            code='PERF001',
            address='Performance Address',
            city='Constantine',
            phone='0555000007'
        )

    def test_performance_creation(self):
        """Test BranchPerformance model creation"""
        performance = BranchPerformance.objects.create(
            branch=self.branch,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 3, 31),
            total_bookings=150,
            total_revenue=Decimal('75000.00'),
            total_products=50,
            average_rating=Decimal('4.25')
        )

        self.assertEqual(performance.total_bookings, 150)
        self.assertEqual(performance.total_revenue, Decimal('75000.00'))

    def test_performance_unique_constraint(self):
        """Test unique constraint on branch-period pair"""
        BranchPerformance.objects.create(
            branch=self.branch,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 3, 31)
        )

        with self.assertRaises(Exception):
            BranchPerformance.objects.create(
                branch=self.branch,
                period_start=date(2026, 1, 1),
                period_end=date(2026, 3, 31)
            )


class BranchSerializerTests(TestCase):
    """Test Cases for Branch Serializers"""

    def test_branch_serializer(self):
        """Test BranchSerializer"""
        branch = Branch.objects.create(
            name='Serializer Branch',
            name_ar='فرع المسلسل',
            code='SER001',
            address='Serializer Address',
            city='Constantine',
            phone='0555000008'
        )

        serializer = BranchSerializer(branch)
        data = serializer.data

        self.assertEqual(data['name'], 'Serializer Branch')
        self.assertIn('staff_count', data)

    def test_inventory_serializer(self):
        """Test BranchInventorySerializer"""
        owner = User.objects.create_user(
            email='inv_ser@test.com',
            username='inv_ser_test',
            password='TestPass123!',
            role='owner'
        )
        branch = Branch.objects.create(
            name='Inv Branch',
            name_ar='فرع المخزون',
            code='INVSER001',
            address='Address',
            city='Constantine',
            phone='0555000009'
        )
        category = Category.objects.create(name_ar='test', name_en='test')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )
        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=10
        )

        serializer = BranchInventorySerializer(inventory)
        data = serializer.data

        self.assertEqual(data['quantity_total'], 10)
        self.assertIn('availability_status', data)


class BranchViewTests(APITestCase):
    """Test Cases for Branch Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='branch_admin@test.com',
            username='branch_admin_v',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='branch_user@test.com',
            username='branch_user_v',
            password='TestPass123!',
            role='tenant'
        )
        self.branch = Branch.objects.create(
            name='View Branch',
            name_ar='فرع العرض',
            code='VIEW001',
            address='View Address',
            city='Constantine',
            phone='0555000010',
            is_active=True
        )

    def test_list_branches(self):
        """Test listing branches"""
        response = self.client.get('/api/branches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_branch(self):
        """Test retrieving a branch"""
        response = self.client.get(f'/api/branches/{self.branch.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_city(self):
        """Test filtering by city"""
        response = self.client.get('/api/branches/?city=Constantine')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BranchSecurityTests(APITestCase):
    """Security Tests for Branches"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='branch_sec@test.com',
            username='branch_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_branch_name(self):
        """Test XSS protection in branch name"""
        xss_payload = '<script>alert("XSS")</script>'

        branch = Branch.objects.create(
            name=xss_payload,
            name_ar=xss_payload,
            code='XSS001',
            address='Address',
            city='Constantine',
            phone='0555000011'
        )

        self.assertNotIn('<script>', branch.name)

    def test_sql_injection_in_code(self):
        """Test SQL injection protection"""
        sql_payload = "'; DROP TABLE branches_branch; --"

        branch = Branch.objects.create(
            name='SQL Branch',
            name_ar='SQL',
            code=sql_payload,
            address='Address',
            city='Constantine',
            phone='0555000012'
        )

        self.assertIsNotNone(branch.code)


class BranchEdgeCaseTests(TestCase):
    """Edge Case Tests for Branches"""

    def test_empty_branch_list(self):
        """Test handling of empty branch list"""
        branches = Branch.objects.filter(is_active=True)
        self.assertEqual(branches.count(), 0)

    def test_unicode_in_branch_name(self):
        """Test Unicode in branch names"""
        branch = Branch.objects.create(
            name='فرع عربي',
            name_ar='فرع عربي',
            code='ARB001',
            address='عنوان عربي',
            city='قسنطينة',
            phone='0555000013'
        )

        self.assertIn('قسنطينة', branch.city)

    def test_zero_inventory(self):
        """Test zero inventory values"""
        owner = User.objects.create_user(
            email='zero_inv@test.com',
            username='zero_inv_test',
            password='TestPass123!',
            role='owner'
        )
        branch = Branch.objects.create(
            name='Zero Branch',
            name_ar='فرع صفر',
            code='ZERO001',
            address='Address',
            city='Constantine',
            phone='0555000014'
        )
        category = Category.objects.create(name_ar='test2', name_en='test2')
        product = Product.objects.create(
            name_ar='منتج',
            name_en='Product',
            owner=owner,
            category=category
        )

        inventory = BranchInventory.objects.create(
            branch=branch,
            product=product,
            quantity_total=0,
            quantity_available=0
        )

        self.assertFalse(inventory.is_in_stock())

    def test_inactive_branch(self):
        """Test inactive branch"""
        branch = Branch.objects.create(
            name='Inactive',
            name_ar='غير نشط',
            code='INACT001',
            address='Address',
            city='Constantine',
            phone='0555000015',
            is_active=False
        )

        self.assertFalse(branch.is_active)

    def test_branch_performance_multiple_periods(self):
        """Test multiple performance periods for branch"""
        branch = Branch.objects.create(
            name='Multi Period',
            name_ar='فترات متعددة',
            code='MULTI001',
            address='Address',
            city='Constantine',
            phone='0555000016'
        )

        for i in range(4):
            BranchPerformance.objects.create(
                branch=branch,
                period_start=date(2026, 1 + (i * 3), 1),
                period_end=date(2026, 3 + (i * 3), 31),
                total_bookings=100 + (i * 10)
            )

        count = BranchPerformance.objects.filter(branch=branch).count()
        self.assertEqual(count, 4)


if __name__ == '__main__':
    import unittest
    unittest.main()
