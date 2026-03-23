"""
Unit tests for warranties Views
"""
import pytest
from rest_framework import status
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from apps.warranties.models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyPlanViewSet:
    """Test WarrantyPlanViewSet"""
    
    def test_list_active_plans(self, api_client):
        """Test listing active warranty plans"""
        WarrantyPlan.objects.create(
            name='Active Plan',
            name_ar='خطة نشطة',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00'),
            is_active=True
        )
        WarrantyPlan.objects.create(
            name='Inactive Plan',
            name_ar='خطة غير نشطة',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('1500.00'),
            is_active=False
        )
        
        response = api_client.get('/api/warranties/plans/')
        
        assert response.status_code == status.HTTP_200_OK
        # Only active plans should be visible
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Active Plan'
    
    def test_calculate_price(self, api_client):
        """Test warranty price calculation"""
        plan = WarrantyPlan.objects.create(
            name='Percentage Plan',
            name_ar='خطة نسبية',
            plan_type='standard',
            coverage_type='damage',
            price=Decimal('0.00'),
            price_percentage=Decimal('10.00'),  # 10%
            max_coverage_amount=Decimal('10000.00'),
            deductible=Decimal('100.00')
        )
        
        response = api_client.get(f'/api/warranties/plans/{plan.id}/calculate_price/?rental_price=5000')
        
        assert response.status_code == status.HTTP_200_OK
        # 10% of 5000 = 500
        assert float(response.data['warranty_price']) == 500.00
        assert float(response.data['coverage_amount']) == 10000.00


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyPurchaseViewSet:
    """Test WarrantyPurchaseViewSet"""
    
    def test_list_purchases_as_user(self, api_client, regular_user, booking):
        """Test user can only see their own purchases"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00')
        )
        
        WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('500.00'),
            coverage_amount=Decimal('10000.00'),
            deductible=Decimal('100.00'),
            expires_at=datetime.now() + timedelta(days=30)
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/warranties/purchases/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
    
    def test_list_purchases_unauthenticated(self, api_client):
        """Test unauthenticated access is denied"""
        response = api_client.get('/api/warranties/purchases/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyClaimViewSet:
    """Test WarrantyClaimViewSet"""
    
    def test_create_claim_authenticated(self, api_client, regular_user, booking):
        """Test creating a warranty claim"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('1000.00')
        )
        
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('1000.00'),
            coverage_amount=Decimal('50000.00'),
            deductible=Decimal('500.00'),
            expires_at=datetime.now() + timedelta(days=30)
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/warranties/claims/', {
            'warranty_purchase': purchase.id,
            'claim_type': 'damage',
            'claim_amount': 3000.00,
            'description': 'Product was damaged'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert WarrantyClaim.objects.filter(warranty_purchase=purchase).exists()
    
    def test_approve_claim_as_admin(self, api_client, admin_user, regular_user, booking):
        """Test admin approving a claim"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('1000.00')
        )
        
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('1000.00'),
            coverage_amount=Decimal('50000.00'),
            deductible=Decimal('500.00'),
            expires_at=datetime.now() + timedelta(days=30)
        )
        
        claim = WarrantyClaim.objects.create(
            warranty_purchase=purchase,
            claim_type='damage',
            claim_amount=Decimal('3000.00'),
            description='Damaged product'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/warranties/claims/{claim.id}/approve/', {
            'approved_amount': 2500.00,
            'review_notes': 'Approved with reduced amount'
        })
        
        assert response.status_code == status.HTTP_200_OK
        claim.refresh_from_db()
        assert claim.status == 'approved'
        assert float(claim.approved_amount) == 2500.00
    
    def test_approve_claim_non_admin(self, api_client, regular_user, booking):
        """Test non-admin cannot approve claims"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00')
        )
        
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('500.00'),
            coverage_amount=Decimal('10000.00'),
            deductible=Decimal('100.00'),
            expires_at=datetime.now() + timedelta(days=30)
        )
        
        claim = WarrantyClaim.objects.create(
            warranty_purchase=purchase,
            claim_type='damage',
            claim_amount=Decimal('1000.00'),
            description='Test claim'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post(f'/api/warranties/claims/{claim.id}/approve/', {
            'approved_amount': 1000.00
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
@pytest.mark.django_db
class TestInsurancePlanViews:
    """Test Insurance Plan Views"""
    
    def test_list_insurance_plans(self, api_client):
        """Test listing active insurance plans"""
        InsurancePlan.objects.create(
            name='Basic Insurance',
            name_ar='تأمين أساسي',
            plan_type='basic',
            base_price=Decimal('1000.00'),
            is_active=True
        )
        InsurancePlan.objects.create(
            name='Inactive Insurance',
            name_ar='تأمين غير نشط',
            plan_type='premium',
            base_price=Decimal('2000.00'),
            is_active=False
        )
        
        response = api_client.get('/api/warranties/insurance/plans/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
    
    def test_insurance_calculator(self, api_client):
        """Test insurance price calculator"""
        plan = InsurancePlan.objects.create(
            name='Test Insurance',
            name_ar='تأمين تجريبي',
            plan_type='premium',
            price_percentage=Decimal('15.00'),
            max_coverage_percentage=Decimal('100.00'),
            deductible_percentage=Decimal('5.00'),
            is_active=True
        )
        
        response = api_client.get(f'/api/warranties/insurance/calculator/?plan_id={plan.id}&product_value=10000')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'insurance_price' in response.data
        assert 'max_coverage' in response.data
        assert 'deductible' in response.data
        # 15% of 10000 = 1500
        assert float(response.data['insurance_price']) == 1500.00
        # 100% of 10000 = 10000
        assert float(response.data['max_coverage']) == 10000.00
