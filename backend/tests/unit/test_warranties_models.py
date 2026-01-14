"""
Unit tests for Warranties models
"""
import pytest
from decimal import Decimal
from apps.warranties.models import WarrantyPlan


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantyPlanModel:
    """Test WarrantyPlan model"""
    
    def test_create_warranty_plan(self):
        """Test creating warranty plan"""
        plan = WarrantyPlan.objects.create(
            name='Basic Coverage',
            name_ar='تغطية أساسية',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00'),
            is_active=True
        )
        
        assert plan.name == 'Basic Coverage'
        assert plan.plan_type == 'basic'
        assert plan.coverage_type == 'damage'
        assert plan.price == Decimal('500.00')
        assert plan.is_active
    
    def test_warranty_plan_calculate_price_fixed(self):
        """Test calculating warranty price (fixed)"""
        plan = WarrantyPlan.objects.create(
            name='Fixed Plan',
            name_ar='خطة ثابتة',
            plan_type='basic',
            coverage_type='damage',
            price=Decimal('500.00')
        )
        
        rental_price = Decimal('5000.00')
        calculated_price = plan.calculate_price(rental_price)
        
        assert calculated_price == Decimal('500.00')
    
    def test_warranty_plan_calculate_price_percentage(self):
        """Test calculating warranty price (percentage)"""
        plan = WarrantyPlan.objects.create(
            name='Percentage Plan',
            name_ar='خطة نسبة',
            plan_type='premium',
            coverage_type='full',
            price=Decimal('0.00'),
            price_percentage=Decimal('15.00')
        )
        
        rental_price = Decimal('5000.00')
        calculated_price = plan.calculate_price(rental_price)
        
        assert calculated_price == Decimal('750.00')  # 15% of 5000

