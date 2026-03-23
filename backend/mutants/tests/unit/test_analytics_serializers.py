"""
Unit tests for analytics Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from apps.analytics.serializers import (
    AnalyticsEventSerializer, ProductAnalyticsSerializer,
    DailyAnalyticsSerializer, UserBehaviorSerializer, ForecastSerializer
)
from apps.analytics.models import (
    AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast
)
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestAnalyticsEventSerializer:
    """Test AnalyticsEvent serializer"""
    
    def test_analytics_event_serialization(self, admin_user, api_client):
        """Test analytics event serialization"""
        event = AnalyticsEvent.objects.create(
            event_type='page_view',
            user=admin_user,
            session_id='test_session_123',
            event_data={'page': '/products'},
            ip_address='127.0.0.1'
        )
        
        serializer = AnalyticsEventSerializer(event)
        data = serializer.data
        
        assert 'id' in data
        assert 'event_type' in data
        assert 'user' in data
        assert 'session_id' in data
        assert 'event_data' in data
        assert 'timestamp' in data
        assert data['event_type'] == 'page_view'
    
    def test_analytics_event_validation(self):
        """Test analytics event validation"""
        serializer = AnalyticsEventSerializer(data={
            'event_type': 'invalid_type'
        })
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestProductAnalyticsSerializer:
    """Test ProductAnalytics serializer"""
    
    def test_product_analytics_serialization(self, product, api_client):
        """Test product analytics serialization"""
        analytics = ProductAnalytics.objects.create(
            product=product,
            total_views=100,
            unique_views=50,
            total_bookings=10,
            conversion_rate=10.0,
            total_revenue=10000.00
        )
        
        serializer = ProductAnalyticsSerializer(analytics)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'total_views' in data
        assert 'total_bookings' in data
        assert 'conversion_rate' in data
        assert 'total_revenue' in data
        assert data['total_views'] == 100
        assert data['total_bookings'] == 10


@pytest.mark.unit
@pytest.mark.django_db
class TestDailyAnalyticsSerializer:
    """Test DailyAnalytics serializer"""
    
    def test_daily_analytics_serialization(self, api_client):
        """Test daily analytics serialization"""
        daily = DailyAnalytics.objects.create(
            date=date.today(),
            new_users=10,
            active_users=50,
            bookings_created=5,
            total_revenue=5000.00
        )
        
        serializer = DailyAnalyticsSerializer(daily)
        data = serializer.data
        
        assert 'id' in data
        assert 'date' in data
        assert 'new_users' in data
        assert 'active_users' in data
        assert 'bookings_created' in data
        assert 'total_revenue' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestUserBehaviorSerializer:
    """Test UserBehavior serializer"""
    
    def test_user_behavior_serialization(self, regular_user, api_client):
        """Test user behavior serialization"""
        behavior = UserBehavior.objects.create(
            user=regular_user,
            total_sessions=5,
            total_page_views=50,
            total_bookings=3,
            total_spent=3000.00
        )
        
        serializer = UserBehaviorSerializer(behavior)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'total_sessions' in data
        assert 'total_bookings' in data
        assert 'total_spent' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestForecastSerializer:
    """Test Forecast serializer"""
    
    def test_forecast_serialization(self, product, category, api_client):
        """Test forecast serialization"""
        forecast = Forecast.objects.create(
            forecast_type='product',
            product=product,
            category=category,
            forecast_start=date.today(),
            forecast_end=date.today() + timedelta(days=30),
            predicted_demand=50,
            predicted_revenue=50000.00,
            confidence_level=85.5
        )
        
        serializer = ForecastSerializer(forecast)
        data = serializer.data
        
        assert 'id' in data
        assert 'forecast_type' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'predicted_demand' in data
        assert 'predicted_revenue' in data
        assert 'confidence_level' in data
