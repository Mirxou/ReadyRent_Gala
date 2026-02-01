import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
from decimal import Decimal

from apps.warranties.models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan
from apps.bookings.models import Booking

@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantiesDetailed:
    """Detailed tests for warranties views"""

    def test_warranty_plan_calculate_price(self, api_client):
        """Test calculate_price action in WarrantyPlanViewSet"""
        plan = WarrantyPlan.objects.create(
            name='Basic', plan_type='basic', coverage_type='damage',
            price=Decimal('500.00'), is_active=True
        )
        response = api_client.get(f'/api/warranties/plans/{plan.id}/calculate_price/?rental_price=5000')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['warranty_price'] == 500.0

    def test_warranty_purchase_viewset(self, api_client, regular_user, booking):
        """Test WarrantyPurchase ViewSet"""
        plan = WarrantyPlan.objects.create(
            name='Standard', plan_type='standard', coverage_type='full',
            price=Decimal('1000.00'), is_active=True
        )
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('1000.00'),
            coverage_amount=Decimal('10000.00'),
            deductible=Decimal('500.00'),
            expires_at=timezone.now() + timedelta(days=30)
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/warranties/purchases/')
        assert response.status_code == status.HTTP_200_OK
        # Check if paginated or list
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1

    def test_warranty_claim_flow(self, api_client, regular_user, admin_user, booking):
        """Test submitting and approving a claim"""
        plan = WarrantyPlan.objects.create(
            name='Premium', plan_type='premium', coverage_type='full',
            price=Decimal('2000.00'), is_active=True
        )
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('2000.00'),
            coverage_amount=Decimal('20000.00'),
            deductible=Decimal('0.00'),
            expires_at=timezone.now() + timedelta(days=30)
        )
        
        # 1. Submit Claim
        api_client.force_authenticate(user=regular_user)
        claim_data = {
            'warranty_purchase': purchase.id,
            'claim_type': 'damage',
            'claim_amount': 5000.00,
            'description': 'Broken screen'
        }
        response = api_client.post('/api/warranties/claims/', claim_data)
        assert response.status_code == status.HTTP_201_CREATED
        claim_id = response.data['id']
        
        # 2. Approve Claim (Admin)
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/warranties/claims/{claim_id}/approve/', {'approved_amount': 4500.00})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'approved'

    def test_insurance_views(self, api_client, product):
        """Test Insurance related views with corrected URLs"""
        plan = InsurancePlan.objects.create(
            name='Insurance 1', plan_type='basic', base_price=Decimal('1000.00'), is_active=True
        )
        
        # List
        response = api_client.get('/api/warranties/insurance/plans/')
        assert response.status_code == status.HTTP_200_OK
        
        # Detail with product_id
        response = api_client.get(f'/api/warranties/insurance/plans/{plan.id}/?product_id={product.id}')
        assert response.status_code == status.HTTP_200_OK
        
        # Calculator
        response = api_client.get(f'/api/warranties/insurance/calculator/?plan_id={plan.id}&product_value=10000')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['insurance_price'] == 1000.0

    @patch('apps.warranties.services.InsuranceService.get_recommended_plan')
    def test_recommended_insurance(self, mock_recommended, api_client, product):
        """Test recommended insurance view with corrected URL"""
        plan = InsurancePlan.objects.create(
            name='Rec Plan', plan_type='premium', base_price=Decimal('1500.00'), is_active=True
        )
        mock_recommended.return_value = plan
        response = api_client.get(f'/api/warranties/insurance/recommended/?product_id={product.id}')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['recommended_plan']['id'] == plan.id

    @patch('apps.warranties.services.InsuranceService.process_insurance_claim')
    def test_admin_process_claim(self, mock_process, api_client, admin_user, booking):
        """Test admin processing insurance claim with corrected URL"""
        plan = WarrantyPlan.objects.create(
            name='Plan', plan_type='premium', coverage_type='full', price=0, is_active=True
        )
        purchase = WarrantyPurchase.objects.create(
            booking=booking, warranty_plan=plan, warranty_price=0, coverage_amount=0,
            deductible=0, expires_at=timezone.now() + timedelta(days=1)
        )
        claim = WarrantyClaim.objects.create(
            warranty_purchase=purchase, claim_type='damage', claim_amount=1000, description='d'
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/warranties/insurance/claims/{claim.id}/process/', {'action': 'approve', 'approved_amount': 1000})
        assert response.status_code == status.HTTP_200_OK
        mock_process.assert_called_once()
