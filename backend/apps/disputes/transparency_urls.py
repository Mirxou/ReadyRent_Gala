from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .transparency_views import (
    PublicJudgmentLedgerViewSet,
    PublicMetricsViewSet
)
from . import expectation_views, abuse_views

router = DefaultRouter()
router.register(r'public/judgments', PublicJudgmentLedgerViewSet, basename='public-judgments')
router.register(r'public/metrics', PublicMetricsViewSet, basename='public-metrics')

urlpatterns = [
    path('', include(router.urls)),
    
    # Expectation Setting (Phase 23, Step 4)
    path('expectations/booking/<int:product_id>/', expectation_views.booking_expectations, name='booking-expectations'),
    path('expectations/dispute-warning/', expectation_views.dispute_warning, name='dispute-warning'),
    
    # Abuse Visibility (Phase 23, Step 5) - Admin Only
    path('admin/abuse/dashboard/', abuse_views.abuse_dashboard_summary, name='abuse-dashboard'),
    path('admin/abuse/users/<int:user_id>/', abuse_views.user_abuse_detail, name='user-abuse-detail'),
    path('admin/abuse/logs/', abuse_views.reputation_logs, name='reputation-logs'),
]
