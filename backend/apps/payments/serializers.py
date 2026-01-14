"""
Serializers for Payment app
"""
from rest_framework import serializers
from .models import Payment, PaymentMethod, PaymentWebhook
from apps.bookings.serializers import BookingSerializer


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for Payment Method"""
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'is_active', 'display_name', 'description', 'icon']
        read_only_fields = ['id']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment"""
    booking = BookingSerializer(read_only=True)
    booking_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_email', 'booking', 'booking_id',
            'payment_method', 'payment_method_display',
            'amount', 'currency', 'status', 'status_display',
            'phone_number', 'card_last_four', 'card_brand',
            'transaction_id', 'failure_reason',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'transaction_id', 'created_at',
            'updated_at', 'completed_at'
        ]
    
    def validate(self, data):
        """Validate payment data"""
        payment_method = data.get('payment_method')
        
        if payment_method == 'baridimob':
            if not data.get('phone_number'):
                raise serializers.ValidationError({
                    'phone_number': 'Phone number is required for BaridiMob payment'
                })
        elif payment_method == 'bank_card':
            # Card validation will be done in the service
            pass
        
        return data


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payment"""
    booking_id = serializers.IntegerField(required=False, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    otp_code = serializers.CharField(required=False, allow_blank=True, max_length=10)
    card_number = serializers.CharField(required=False, allow_blank=True, max_length=19, write_only=True)
    card_expiry = serializers.CharField(required=False, allow_blank=True, max_length=7, write_only=True)
    card_cvv = serializers.CharField(required=False, allow_blank=True, max_length=4, write_only=True)
    cardholder_name = serializers.CharField(required=False, allow_blank=True, max_length=100, write_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'payment_method', 'amount', 'currency',
            'booking_id', 'phone_number', 'otp_code',
            'card_number', 'card_expiry', 'card_cvv', 'cardholder_name'
        ]
    
    def validate(self, data):
        """Validate payment creation"""
        payment_method = data.get('payment_method')
        
        if payment_method == 'baridimob':
            if not data.get('phone_number'):
                raise serializers.ValidationError({
                    'phone_number': 'Phone number is required for BaridiMob'
                })
        elif payment_method == 'bank_card':
            required_fields = ['card_number', 'card_expiry', 'card_cvv', 'cardholder_name']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({
                        field: f'{field} is required for bank card payment'
                    })
        
        return data


class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer for Payment Webhook"""
    
    class Meta:
        model = PaymentWebhook
        fields = [
            'id', 'payment', 'payment_method', 'event_type',
            'payload', 'processed', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
