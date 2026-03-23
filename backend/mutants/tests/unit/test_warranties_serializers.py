"""
Unit tests for warranties Serializers
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta

from apps.warranties.serializers import (
    WarrantyPlanSerializer, WarrantyPurchaseSerializer,
    WarrantyClaimSerializer, InsurancePlanSerializer
)
from apps.warranties.models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyPlanSerializer:
    """Test WarrantyPlanSerializer"""
    
    def test_serializer_output_fields(self):
        """Test serializer includes all expected fields"""
        plan = WarrantyPlan.objects.create(
            name='Basic Protection',
            name_ar='حماية أساسية',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00'),
            max_coverage_amount=Decimal('10000.00'),
            deductible=Decimal('100.00')
        )
        
        serializer = WarrantyPlanSerializer(plan)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'name_ar' in data
        assert 'plan_type' in data
        assert 'coverage_type' in data
        assert 'price' in data
        assert 'max_coverage_amount' in data
        assert 'deductible' in data
        assert 'covers_accidental_damage' in data
        
        assert data['name'] == 'Basic Protection'
        assert float(data['price']) == 500.00
    
    def test_serializer_read_only_fields(self):
        """Test created_at and updated_at are read-only"""
        plan = WarrantyPlan.objects.create(
            name='Test',
            name_ar='تست',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00')
        )
        
        data = {
            'name': 'Updated',
            'created_at': '2020-01-01T00:00:00Z',  # Should be ignored
        }
        
        serializer = WarrantyPlanSerializer(plan, data=data, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        
        assert updated.name == 'Updated'
        # created_at should not change
        assert updated.created_at != datetime(2020, 1, 1)


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyPurchaseSerializer:
    """Test WarrantyPurchaseSerializer"""
    
    def test_serializer_with_booking_details(self, booking):
        """Test serializer includes booking details"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='standard',
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
        
        serializer = WarrantyPurchaseSerializer(purchase)
        data = serializer.data
        
        assert 'booking_details' in data
        assert 'warranty_plan_details' in data
        assert 'warranty_price' in data
        assert 'status' in data
        
        assert data['booking_details']['id'] == booking.id


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyClaimSerializer:
    """Test WarrantyClaimSerializer"""
    
    def test_serializer_fields(self, booking):
        """Test claim serializer output"""
        plan = WarrantyPlan.objects.create(
            name='Test Plan',
            name_ar='خطة',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('1500.00')
        )
        
        purchase = WarrantyPurchase.objects.create(
            booking=booking,
            warranty_plan=plan,
            warranty_price=Decimal('1500.00'),
            coverage_amount=Decimal('75000.00'),
            deductible=Decimal('750.00'),
            expires_at=datetime.now() + timedelta(days=30)
        )
        
        claim = WarrantyClaim.objects.create(
            warranty_purchase=purchase,
            claim_type='damage',
            claim_amount=Decimal('5000.00'),
            description='Product was damaged during use'
        )
        
        serializer = WarrantyClaimSerializer(claim)
        data = serializer.data
        
        assert 'id' in data
        assert 'claim_type' in data
        assert 'claim_amount' in data
        assert 'description' in data
        assert 'status' in data
        
        assert data['claim_type'] == 'damage'
        assert float(data['claim_amount']) == 5000.00


@pytest.mark.unit
@pytest.mark.django_db
class TestInsurancePlanSerializer:
    """Test InsurancePlanSerializer"""
    
    def test_serializer_basic_fields(self):
        """Test insurance plan serializer fields"""
        plan = InsurancePlan.objects.create(
            name='Premium Insurance',
            name_ar='تأمين متميز',
            plan_type='premium',
            base_price=Decimal('2000.00'),
            price_percentage=Decimal('10.00'),
            max_coverage_percentage=Decimal('100.00'),
            deductible_percentage=Decimal('5.00')
        )
        
        serializer = InsurancePlanSerializer(plan)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert 'plan_type' in data
        assert 'base_price' in data
        assert 'price_percentage' in data
        assert 'covers_damage' in data
        assert 'covers_theft' in data
    
    def test_serializer_with_product_value_context(self):
        """Test calculated price with product value"""
        plan = InsurancePlan.objects.create(
            name='Full Coverage',
            name_ar='تغطية كاملة',
            plan_type='full_coverage',
            price_percentage=Decimal('15.00'),
            max_coverage_percentage=Decimal('100.00')
        )
        
        context = {'product_value': 10000.00}
        serializer = InsurancePlanSerializer(plan, context=context)
        data = serializer.data
        
        assert 'calculated_price' in data
        assert 'calculated_coverage' in data
        # 15% of 10000 = 1500
        assert float(data['calculated_price']) == 1500.00
        # 100% of 10000 = 10000
        assert float(data['calculated_coverage']) == 10000.00
