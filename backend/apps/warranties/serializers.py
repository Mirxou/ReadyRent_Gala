from rest_framework import serializers
from .models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan


class WarrantyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarrantyPlan
        fields = [
            'id', 'name', 'name_ar', 'plan_type', 'coverage_type',
            'description', 'description_ar',
            'price', 'price_percentage',
            'max_coverage_amount', 'deductible',
            'covers_normal_wear', 'covers_accidental_damage',
            'covers_theft', 'covers_loss',
            'is_active', 'is_featured',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class WarrantyPurchaseSerializer(serializers.ModelSerializer):
    warranty_plan_details = WarrantyPlanSerializer(source='warranty_plan', read_only=True)
    booking_details = serializers.SerializerMethodField()
    
    class Meta:
        model = WarrantyPurchase
        fields = [
            'id', 'booking', 'booking_details',
            'warranty_plan', 'warranty_plan_details',
            'warranty_price', 'coverage_amount', 'deductible',
            'status', 'purchased_at', 'activated_at',
            'expires_at', 'claimed_at',
            'claim_amount', 'claim_description'
        ]
        read_only_fields = ['purchased_at', 'activated_at']
    
    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'product_name': obj.booking.product.name_ar,
            'total_price': str(obj.booking.total_price),
        }


class WarrantyClaimSerializer(serializers.ModelSerializer):
    warranty_purchase_details = WarrantyPurchaseSerializer(source='warranty_purchase', read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = WarrantyClaim
        fields = [
            'id', 'warranty_purchase', 'warranty_purchase_details',
            'claim_type', 'status',
            'claim_amount', 'description', 'evidence_files',
            'reviewed_by', 'reviewed_by_email',
            'review_notes', 'approved_amount',
            'submitted_at', 'reviewed_at', 'paid_at'
        ]
        read_only_fields = ['submitted_at', 'reviewed_at', 'paid_at']


class InsurancePlanSerializer(serializers.ModelSerializer):
    """Serializer for Insurance Plan"""
    calculated_price = serializers.SerializerMethodField()
    calculated_coverage = serializers.SerializerMethodField()
    
    class Meta:
        model = InsurancePlan
        fields = [
            'id', 'name', 'name_ar', 'plan_type',
            'description', 'description_ar',
            'base_price', 'price_percentage',
            'max_coverage_percentage', 'deductible_percentage',
            'covers_damage', 'covers_theft', 'covers_loss',
            'covers_accidental_damage', 'covers_normal_wear',
            'applicable_product_types', 'is_active', 'is_featured',
            'calculated_price', 'calculated_coverage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_calculated_price(self, obj):
        """Calculate price for a product value"""
        product_value = self.context.get('product_value')
        if product_value:
            return float(obj.calculate_price(product_value))
        return None
    
    def get_calculated_coverage(self, obj):
        """Calculate coverage for a product value"""
        product_value = self.context.get('product_value')
        if product_value:
            return float(obj.calculate_coverage(product_value))
        return None

