"""
Serializers for Booking app
"""
from rest_framework import serializers
from .models import (
    Booking, Cart, CartItem, Waitlist,
    DamageAssessment, DamagePhoto, InspectionChecklist, DamageClaim,
    Refund, Cancellation
)
from apps.products.serializers import ProductListSerializer
from django.utils import timezone


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True, required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_email', 'product', 'product_id',
            'start_date', 'end_date', 'total_days', 'total_price',
            'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate booking dates and status"""
        # If updating dates, recalculate total_days and total_price
        if 'start_date' in data or 'end_date' in data:
            instance = self.instance
            start_date = data.get('start_date', instance.start_date if instance else None)
            end_date = data.get('end_date', instance.end_date if instance else None)
            
            if start_date and end_date:
                if end_date < start_date:
                    raise serializers.ValidationError({
                        'end_date': 'End date must be after start date'
                    })
                
                # Calculate total days
                total_days = (end_date - start_date).days + 1
                data['total_days'] = total_days
                
                # Calculate total price if product exists
                product = instance.product if instance else None
                if 'product_id' in data:
                    from apps.products.models import Product
                    try:
                        product = Product.objects.get(pk=data['product_id'])
                    except Product.DoesNotExist:
                        pass
                
                if product:
                    data['total_price'] = product.price_per_day * total_days
        
        # Validate status transitions (basic validation)
        if 'status' in data and self.instance:
            current_status = self.instance.status
            new_status = data['status']
            
            # Users can only cancel their own bookings
            if current_status in ['pending', 'confirmed'] and new_status == 'cancelled':
                pass  # Allowed
            elif current_status == 'pending' and new_status == 'confirmed':
                pass  # Admin can confirm
            # Other transitions would need admin permissions
        
        return data


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating bookings (allows more fields to be updated)"""
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'product', 'start_date', 'end_date',
            'total_days', 'total_price', 'status', 'notes'
        ]
        read_only_fields = ['id', 'total_days', 'total_price']
    
    def validate(self, data):
        """Validate booking update"""
        instance = self.instance
        start_date = data.get('start_date', instance.start_date)
        end_date = data.get('end_date', instance.end_date)
        
        if end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })
        
        # Recalculate if dates changed
        if 'start_date' in data or 'end_date' in data:
            total_days = (end_date - start_date).days + 1
            data['total_days'] = total_days
            data['total_price'] = instance.product.price_per_day * total_days
        
        return data


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'start_date', 'end_date', 'quantity', 'created_at']
        read_only_fields = ['created_at']


class CartSerializer(serializers.ModelSerializer):
    """Serializer for Cart"""
    items = CartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class WaitlistSerializer(serializers.ModelSerializer):
    """Serializer for Waitlist"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Waitlist
        fields = [
            'id', 'user', 'product', 'product_id',
            'preferred_start_date', 'preferred_end_date',
            'notified', 'notified_at', 'created_at'
        ]
        read_only_fields = ['user', 'notified', 'notified_at', 'created_at']


class DamagePhotoSerializer(serializers.ModelSerializer):
    """Serializer for Damage Photo"""
    
    class Meta:
        model = DamagePhoto
        fields = ['id', 'photo', 'photo_type', 'description', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class InspectionChecklistSerializer(serializers.ModelSerializer):
    """Serializer for Inspection Checklist Item"""
    
    class Meta:
        model = InspectionChecklist
        fields = ['id', 'item_name', 'item_description', 'is_checked', 'condition', 'notes', 'checked_at']
        read_only_fields = ['checked_at']


class DamageAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Damage Assessment"""
    booking = serializers.PrimaryKeyRelatedField(read_only=True)
    booking_id = serializers.IntegerField(write_only=True, required=False)
    assessed_by_email = serializers.EmailField(source='assessed_by.email', read_only=True)
    photos = DamagePhotoSerializer(many=True, read_only=True)
    checklist_items = InspectionChecklistSerializer(many=True, read_only=True)
    claim = serializers.SerializerMethodField()
    
    class Meta:
        model = DamageAssessment
        fields = [
            'id', 'booking', 'booking_id', 'assessed_by', 'assessed_by_email',
            'severity', 'status', 'damage_description', 'repair_cost',
            'replacement_cost', 'assessed_at', 'reviewed_at', 'notes',
            'photos', 'checklist_items', 'claim'
        ]
        read_only_fields = ['assessed_at', 'reviewed_at']
    
    def get_claim(self, obj):
        """Get claim if exists"""
        if hasattr(obj, 'claim'):
            return DamageClaimSerializer(obj.claim).data
        return None


class DamageClaimSerializer(serializers.ModelSerializer):
    """Serializer for Damage Claim"""
    assessment = DamageAssessmentSerializer(read_only=True)
    assessment_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = DamageClaim
        fields = [
            'id', 'assessment', 'assessment_id', 'claimed_amount',
            'approved_amount', 'status', 'claim_description',
            'admin_notes', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at']


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund"""
    booking = BookingSerializer(read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'booking', 'amount', 'reason', 'status',
            'processing_days', 'processed_at', 'transaction_id',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'processed_at', 'created_at', 'updated_at']


class CancellationSerializer(serializers.ModelSerializer):
    """Serializer for Cancellation"""
    booking = BookingSerializer(read_only=True)
    cancelled_by_email = serializers.EmailField(source='cancelled_by.email', read_only=True)
    refund = RefundSerializer(read_only=True)
    
    class Meta:
        model = Cancellation
        fields = [
            'id', 'booking', 'cancelled_by', 'cancelled_by_email',
            'reason', 'cancellation_fee', 'refund_amount', 'refund',
            'cancelled_at'
        ]
        read_only_fields = ['cancelled_at']

