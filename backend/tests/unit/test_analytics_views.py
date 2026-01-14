"""
Unit tests for analytics Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from apps.analytics.models import (
    AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast
)
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestAnalyticsEventViewSet:
    """Test AnalyticsEvent ViewSet"""
    
    def test_list_requires_admin(self, api_client, regular_user):
        """Test listing analytics events requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/events/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_as_admin(self, api_client, admin_user):
        """Test listing analytics events as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/events/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_event_as_admin(self, api_client, admin_user):
        """Test creating analytics event as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/analytics/events/', {
            'event_type': 'page_view',
            'session_id': 'test_session',
            'event_data': {'page': '/products'}
        })
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.unit
@pytest.mark.django_db
class TestProductAnalyticsViewSet:
    """Test ProductAnalytics ViewSet"""
    
    def test_list_requires_admin(self, api_client, regular_user):
        """Test listing product analytics requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/products/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_as_admin(self, api_client, admin_user, product):
        """Test listing product analytics as admin"""
        ProductAnalytics.objects.create(
            product=product,
            total_views=100,
            total_bookings=10
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/products/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_top_products(self, api_client, admin_user, product):
        """Test top products endpoint"""
        ProductAnalytics.objects.create(
            product=product,
            total_revenue=10000.00
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/products/top_products/?metric=revenue')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 0


@pytest.mark.unit
@pytest.mark.django_db
class TestDailyAnalyticsViewSet:
    """Test DailyAnalytics ViewSet"""
    
    def test_list_requires_admin(self, api_client, regular_user):
        """Test listing daily analytics requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/daily/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_summary_endpoint(self, api_client, admin_user):
        """Test summary endpoint"""
        DailyAnalytics.objects.create(
            date=date.today(),
            new_users=10,
            bookings_created=5,
            total_revenue=5000.00
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/daily/summary/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert 'period' in response.data
        assert 'users' in response.data
        assert 'bookings' in response.data


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminDashboardStatsView:
    """Test AdminDashboardStatsView"""
    
    def test_dashboard_stats_requires_admin(self, api_client, regular_user):
        """Test dashboard stats requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/admin/dashboard-stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_dashboard_stats_as_admin(self, api_client, admin_user):
        """Test dashboard stats as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/dashboard-stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'overall' in response.data
        assert 'this_month' in response.data
        assert 'products' in response.data


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminRevenueView:
    """Test AdminRevenueView"""
    
    def test_revenue_view_requires_admin(self, api_client, regular_user):
        """Test revenue view requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/admin/revenue/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_revenue_view_as_admin(self, api_client, admin_user):
        """Test revenue view as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/revenue/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert 'period' in response.data
        assert 'total_revenue' in response.data
        assert 'daily_revenue' in response.data


@pytest.mark.unit
@pytest.mark.django_db
class TestAdminSalesReportView:
    """Test AdminSalesReportView"""
    
    def test_sales_report_requires_admin(self, api_client, regular_user):
        """Test sales report requires admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/admin/sales-report/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_sales_report_as_admin(self, api_client, admin_user):
        """Test sales report as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/sales-report/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert 'period' in response.data
        assert 'summary' in response.data
        assert 'sales_by_category' in response.data
