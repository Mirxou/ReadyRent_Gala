from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsEventViewSet, ProductAnalyticsViewSet,
    DailyAnalyticsViewSet, UserBehaviorViewSet,
    AdminDashboardStatsView, AdminRevenueView, AdminSalesReportView,
    ForecastListView, ForecastDetailView, GenerateForecastView,
    HighDemandProductsView, LowStockAlertsView, TrendAnalysisView,
)

router = DefaultRouter()
router.register(r'events', AnalyticsEventViewSet, basename='analytics-event')
router.register(r'products', ProductAnalyticsViewSet, basename='product-analytics')
router.register(r'daily', DailyAnalyticsViewSet, basename='daily-analytics')
router.register(r'user-behavior', UserBehaviorViewSet, basename='user-behavior')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('admin/revenue/', AdminRevenueView.as_view(), name='admin-revenue'),
    path('admin/sales-report/', AdminSalesReportView.as_view(), name='admin-sales-report'),
    
    # Forecasting routes
    path('forecasts/', ForecastListView.as_view(), name='forecast-list'),
    path('forecasts/<int:pk>/', ForecastDetailView.as_view(), name='forecast-detail'),
    path('forecasts/generate/', GenerateForecastView.as_view(), name='generate-forecast'),
    path('forecasts/high-demand/', HighDemandProductsView.as_view(), name='high-demand-products'),
    path('forecasts/low-stock-alerts/', LowStockAlertsView.as_view(), name='low-stock-alerts'),
    path('forecasts/trends/', TrendAnalysisView.as_view(), name='trend-analysis'),
]

