"""
Insurance services for ReadyRent.Gala
"""
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from .models import InsurancePlan, WarrantyPlan, WarrantyPurchase, WarrantyClaim


class InsuranceService:
    """Service for insurance calculations and management"""
    
    @staticmethod
    def calculate_insurance_price(plan, product_value):
        """Calculate insurance price for a plan and product"""
        return plan.calculate_price(product_value)
    
    @staticmethod
    def get_recommended_plan(product_value, product_category_id=None):
        """Get recommended insurance plan based on product value"""
        plans = InsurancePlan.objects.filter(is_active=True)
        
        if product_category_id:
            plans = plans.filter(
                models.Q(applicable_product_types__contains=[product_category_id]) |
                models.Q(applicable_product_types=[])
            )
        
        # Recommend based on product value
        if product_value < 10000:
            # Low value - recommend basic
            return plans.filter(plan_type='basic').first()
        elif product_value < 50000:
            # Medium value - recommend premium
            return plans.filter(plan_type='premium').first() or plans.filter(plan_type='basic').first()
        else:
            # High value - recommend full coverage
            return plans.filter(plan_type='full_coverage').first() or plans.filter(plan_type='premium').first()
    
    @staticmethod
    def get_available_plans(product_category_id=None):
        """Get all available insurance plans for a product category"""
        plans = InsurancePlan.objects.filter(is_active=True)
        
        if product_category_id:
            plans = plans.filter(
                models.Q(applicable_product_types__contains=[product_category_id]) |
                models.Q(applicable_product_types=[])
            )
        
        return plans.order_by('plan_type', 'base_price')
    
    @staticmethod
    def process_insurance_claim(claim, approved_amount=None):
        """Process insurance claim"""
        if claim.status != 'pending':
            raise ValueError('Claim is not in pending status')
        
        warranty_purchase = claim.warranty_purchase
        
        # Calculate deductible
        plan = warranty_purchase.warranty_plan
        if hasattr(plan, 'insuranceplan'):
            insurance_plan = plan.insuranceplan
            deductible = insurance_plan.calculate_deductible(claim.claim_amount)
        else:
            deductible = plan.deductible
        
        # Calculate approved amount (considering deductible and max coverage)
        if approved_amount is None:
            approved_amount = claim.claim_amount - deductible
        
        # Check max coverage
        max_coverage = warranty_purchase.coverage_amount
        if approved_amount > max_coverage:
            approved_amount = max_coverage
        
        # Update claim
        claim.approved_amount = approved_amount
        claim.status = 'approved'
        claim.reviewed_at = timezone.now()
        claim.save()
        
        # Update warranty purchase
        warranty_purchase.status = 'claimed'
        warranty_purchase.claimed_at = timezone.now()
        warranty_purchase.claim_amount = approved_amount
        warranty_purchase.save()
        
        return claim
    
    @staticmethod
    def reject_insurance_claim(claim, reason):
        """Reject insurance claim"""
        if claim.status != 'pending':
            raise ValueError('Claim is not in pending status')
        
        claim.status = 'rejected'
        claim.reviewed_at = timezone.now()
        claim.review_notes = reason
        claim.save()
        
        return claim
    
    @staticmethod
    def mark_claim_as_paid(claim, transaction_id=None):
        """Mark claim as paid"""
        if claim.status != 'approved':
            raise ValueError('Claim must be approved before marking as paid')
        
        claim.status = 'paid'
        claim.paid_at = timezone.now()
        if transaction_id:
            # Store transaction ID in review_notes or create separate field
            claim.review_notes = f"{claim.review_notes}\nTransaction ID: {transaction_id}"
        claim.save()
        
        return claim


