from rest_framework import serializers
from .models import Return, ReturnItem, Refund


class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    
    class Meta:
        model = ReturnItem
        fields = [
            'id', 'product', 'product_name',
            'quantity_returned', 'condition', 'notes'
        ]


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            'id', 'return_request', 'refund_type', 'amount',
            'status', 'reason', 'processed_at',
            'transaction_reference', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ReturnSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    items = ReturnItemSerializer(many=True, read_only=True)
    refund = RefundSerializer(read_only=True)
    inspector_email = serializers.EmailField(source='inspector.email', read_only=True)
    is_late = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Return
        fields = [
            'id', 'booking', 'booking_details',
            'status', 'requested_at',
            'scheduled_pickup_date', 'actual_pickup_date', 'received_at',
            'inspection_date', 'inspector', 'inspector_email',
            'inspection_notes', 'damage_assessment', 'damage_cost',
            'return_notes', 'completed_at',
            'items', 'refund', 'is_late',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['requested_at', 'created_at', 'updated_at']
    
    def get_booking_details(self, obj):
        """Get booking details"""
        booking = obj.booking
        return {
            'id': booking.id,
            'product_name': booking.product.name_ar,
            'start_date': booking.start_date,
            'end_date': booking.end_date,
            'total_price': str(booking.total_price),
        }

