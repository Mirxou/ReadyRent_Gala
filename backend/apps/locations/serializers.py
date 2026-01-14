from rest_framework import serializers
from .models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'user', 'label', 'full_address',
            'street', 'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude', 'google_place_id',
            'is_default', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure coordinates are provided together"""
        lat = data.get('latitude')
        lng = data.get('longitude')
        
        if (lat is None) != (lng is None):
            raise serializers.ValidationError(
                "Both latitude and longitude must be provided together"
            )
        return data


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = [
            'id', 'name', 'name_ar', 'description', 'city',
            'center_latitude', 'center_longitude', 'radius_km',
            'delivery_fee', 'is_active', 'created_at'
        ]


class DeliveryTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTracking
        fields = [
            'id', 'delivery_request', 'latitude', 'longitude',
            'timestamp', 'status'
        ]
        read_only_fields = ['timestamp']


class DeliveryRequestSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    delivery_address_details = AddressSerializer(source='delivery_address', read_only=True)
    pickup_address_details = AddressSerializer(source='pickup_address', read_only=True)
    delivery_zone_name = serializers.CharField(source='delivery_zone.name_ar', read_only=True)
    assigned_driver_email = serializers.EmailField(source='assigned_driver.email', read_only=True)
    tracking_history = DeliveryTrackingSerializer(many=True, read_only=True)
    
    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'booking', 'booking_details',
            'delivery_type', 'status',
            'delivery_address', 'delivery_address_details',
            'pickup_address', 'pickup_address_details',
            'delivery_zone', 'delivery_zone_name',
            'delivery_date', 'delivery_time_slot',
            'pickup_date', 'pickup_time_slot',
            'assigned_driver', 'assigned_driver_email',
            'delivery_fee',
            'current_latitude', 'current_longitude',
            'last_tracking_update',
            'tracking_history',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_tracking_update']
    
    def get_booking_details(self, obj):
        """Get booking details"""
        booking = obj.booking
        return {
            'id': booking.id,
            'product_name': booking.product.name_ar,
            'user_email': booking.user.email,
        }

