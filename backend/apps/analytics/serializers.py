from rest_framework import serializers
from .models import AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast


class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = [
            'id', 'event_type', 'user', 'session_id',
            'event_data', 'ip_address', 'user_agent',
            'referrer', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class ProductAnalyticsSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    
    class Meta:
        model = ProductAnalytics
        fields = [
            'id', 'product', 'product_name',
            'total_views', 'unique_views',
            'total_searches', 'total_cart_adds',
            'total_bookings', 'conversion_rate',
            'total_revenue',
            'last_viewed', 'last_booked', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalytics
        fields = [
            'id', 'date',
            'new_users', 'active_users', 'total_users',
            'bookings_created', 'bookings_completed', 'bookings_cancelled',
            'total_revenue', 'average_booking_value',
            'products_viewed', 'unique_products_viewed',
            'total_searches', 'unique_searches',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserBehaviorSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserBehavior
        fields = [
            'id', 'user', 'user_email',
            'last_login', 'total_sessions', 'total_page_views',
            'favorite_categories', 'favorite_products',
            'total_bookings', 'total_spent', 'average_booking_value',
            'preferred_price_range', 'preferred_rental_duration',
            'updated_at'
        ]
        read_only_fields = ['updated_at']


class ForecastSerializer(serializers.ModelSerializer):
    """Serializer for Forecast"""
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    category_name = serializers.CharField(source='category.name_ar', read_only=True)
    
    class Meta:
        model = Forecast
        fields = [
            'id', 'forecast_type', 'product', 'product_name', 'category', 'category_name',
            'forecast_start', 'forecast_end', 'forecast_date',
            'predicted_demand', 'predicted_revenue', 'confidence_level',
            'seasonal_factor', 'trend_factor', 'forecast_data', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['forecast_date', 'created_at', 'updated_at']

