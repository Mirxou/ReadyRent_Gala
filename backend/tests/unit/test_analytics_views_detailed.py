import pytest
from rest_framework import status
from django.utils import timezone
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from decimal import Decimal
import csv
import io

from apps.analytics.models import (
    AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast
)
from apps.bookings.models import Booking

@pytest.mark.unit
@pytest.mark.django_db
class TestAnalyticsDetailed:
    """Detailed tests for analytics views to reach 70%+ coverage"""

    def test_user_behavior_viewset(self, api_client, admin_user, regular_user):
        """Test UserBehavior ViewSet"""
        UserBehavior.objects.create(
            user=regular_user,
            total_spent=5000.00,
            total_bookings=5
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/user-behavior/')
        assert response.status_code == status.HTTP_200_OK
        # Check if paginated or list
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1

    def test_admin_dashboard_stats_with_data(self, api_client, admin_user, product, regular_user):
        """Test dashboard stats with actual bookings and products"""
        Booking.objects.create(
            user=regular_user,
            product=product,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            total_days=1,
            total_price=Decimal('1000.00'),
            status='confirmed'
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['overall']['revenue'] > 0
        assert len(response.data['top_products']) > 0

    def test_revenue_view_with_data(self, api_client, admin_user, product, regular_user):
        """Test revenue view with varied booking data"""
        for i in range(3):
            Booking.objects.create(
                user=regular_user,
                product=product,
                start_date=timezone.now().date() - timedelta(days=i),
                end_date=timezone.now().date() + timedelta(days=5),
                total_days=5,
                total_price=Decimal('500.00'),
                status='completed'
            )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/revenue/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_revenue'] > 0
        assert len(response.data['daily_revenue']) > 0
        assert len(response.data['revenue_by_status']) > 0

    def test_sales_report_with_data(self, api_client, admin_user, product, regular_user):
        """Test sales report with varied booking data"""
        Booking.objects.create(
            user=regular_user,
            product=product,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            total_days=1,
            total_price=Decimal('1000.00'),
            status='completed'
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/sales-report/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['summary']['total_bookings'] >= 1
        assert len(response.data['sales_by_category']) > 0
        assert len(response.data['sales_by_product']) > 0
        assert len(response.data['top_customers']) > 0

    @patch('apps.analytics.forecasting.DemandForecastingService.forecast_product_demand')
    def test_generate_forecast_product(self, mock_forecast, api_client, admin_user, product):
        """Test generating forecast for a product"""
        mock_forecast.return_value = {
            'predicted_demand': 10,
            'predicted_revenue': 25000.0,
            'confidence_level': 80,
            'seasonal_factor': 1.2,
            'trend_factor': 1.1,
            'base_daily_demand': 0.5
        }
        api_client.force_authenticate(user=admin_user)
        data = {
            'forecast_type': 'product',
            'product_id': product.id,
            'forecast_start': str(date.today()),
            'forecast_end': str(date.today() + timedelta(days=30))
        }
        response = api_client.post('/api/analytics/forecasts/generate/', data)
        assert response.status_code == status.HTTP_200_OK
        assert 'Generated 1 forecast(s)' in response.data['message']

    @patch('apps.analytics.forecasting.DemandForecastingService.forecast_category_demand')
    def test_generate_forecast_category(self, mock_forecast, api_client, admin_user, category):
        """Test generating forecast for a category"""
        mock_forecast.return_value = {
            'predicted_demand': 50,
            'predicted_revenue': 125000.0,
            'confidence_level': 75
        }
        api_client.force_authenticate(user=admin_user)
        data = {
            'forecast_type': 'category',
            'category_id': category.id,
            'forecast_start': str(date.today()),
            'forecast_end': str(date.today() + timedelta(days=30))
        }
        response = api_client.post('/api/analytics/forecasts/generate/', data)
        assert response.status_code == status.HTTP_200_OK
        assert 'Generated 1 forecast(s)' in response.data['message']

    @patch('apps.analytics.forecasting.DemandForecastingService.generate_seasonal_forecast')
    def test_generate_forecast_seasonal(self, mock_forecast, api_client, admin_user):
        """Test generating seasonal forecast"""
        mock_forecast.return_value = []
        api_client.force_authenticate(user=admin_user)
        data = {
            'forecast_type': 'seasonal',
            'forecast_start': str(date.today()),
            'forecast_end': str(date.today() + timedelta(days=30))
        }
        response = api_client.post('/api/analytics/forecasts/generate/', data)
        assert response.status_code == status.HTTP_200_OK

    @patch('apps.analytics.forecasting.DemandForecastingService.get_high_demand_products')
    def test_high_demand_products(self, mock_get, api_client, admin_user):
        """Test high demand products view"""
        mock_get.return_value = []
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/forecasts/high-demand/')
        assert response.status_code == status.HTTP_200_OK

    @patch('apps.analytics.forecasting.DemandForecastingService.get_low_stock_alerts')
    def test_low_stock_alerts(self, mock_get, api_client, admin_user):
        """Test low stock alerts view"""
        mock_get.return_value = []
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/forecasts/low-stock-alerts/')
        assert response.status_code == status.HTTP_200_OK

    @patch('apps.analytics.forecasting.DemandForecastingService.analyze_trends')
    def test_trend_analysis(self, mock_analyze, api_client, admin_user):
        """Test trend analysis view"""
        mock_analyze.return_value = {'monthly_data': {}}
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/forecasts/trends/')
        assert response.status_code == status.HTTP_200_OK

    def test_forecast_list_and_detail(self, api_client, admin_user, product):
        """Test Forecast List and Detail views"""
        forecast = Forecast.objects.create(
            product=product,
            forecast_type='product',
            forecast_start=date.today(),
            forecast_end=date.today() + timedelta(days=30),
            predicted_demand=10,
            predicted_revenue=25000.0
        )
        api_client.force_authenticate(user=admin_user)
        
        # List
        response = api_client.get('/api/analytics/forecasts/')
        assert response.status_code == status.HTTP_200_OK
        
        # Detail
        response = api_client.get(f'/api/analytics/forecasts/{forecast.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == forecast.id
