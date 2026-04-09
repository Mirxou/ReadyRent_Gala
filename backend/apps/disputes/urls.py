"""
URLs for Disputes app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DisputeListView, DisputeDetailView, DisputeCreateView,
    DisputeMessageCreateView, EvidenceLogView,
    JudgmentDetailView, AppealCreateView,
    PublicLedgerListView, PublicMetricsView,
    MediationView,
    SupportTicketListView, SupportTicketCreateView, SupportTicketDetailView,
    TicketMessageCreateView, AdminDisputeStatsView, AdminTicketStatsView,
    get_dispute_status, sovereign_override,  # Phase 42
    AdminPendingOffersView, admin_decide_offer,  # Phase 44
    VaultIntegrityView, ExportIntegrityCertificateView # Phase 6 & 7
)

app_name = 'disputes'

# DRF Router for API endpoints
from .api_views import (
    DisputeViewSet, SettlementOfferViewSet, AdminOfferViewSet, 
    SovereignEyeStatsView, EvidenceTickerView
)

router = DefaultRouter()
router.register(r'api/disputes', DisputeViewSet, basename='api-dispute')
router.register(r'api/settlement-offers', SettlementOfferViewSet, basename='api-offer')
router.register(r'api/admin/offers', AdminOfferViewSet, basename='api-admin-offer')
router.register(r'api/sovereign-eye/stats', SovereignEyeStatsView, basename='api-sovereign-eye-stats')
router.register(r'api/sovereign-eye/ticker', EvidenceTickerView, basename='api-sovereign-eye-ticker')

urlpatterns = [
    # Dispute routes
    path('disputes/', DisputeListView.as_view(), name='dispute-list'),
    path('disputes/create/', DisputeCreateView.as_view(), name='dispute-create'),
    path('judgments/<int:pk>/appeal/', AppealCreateView.as_view(), name='appeal-create'),

    # Phase 42: Sovereign Override
    path('disputes/<int:dispute_id>/override/', sovereign_override, name='dispute-override'),
    
    # Phase 40: Mediation
    path('<int:dispute_id>/mediation/', MediationView.as_view(), name='dispute-mediation'),
    path('disputes/<int:pk>/', DisputeDetailView.as_view(), name='dispute-detail'),
    path('disputes/<int:pk>/messages/', DisputeMessageCreateView.as_view(), name='dispute-message-create'),
    path('disputes/<int:pk>/evidence/', EvidenceLogView.as_view(), name='dispute-evidence'),
    path('<int:dispute_id>/status/', get_dispute_status, name='dispute-status'),
    
    # Support ticket routes
    path('tickets/', SupportTicketListView.as_view(), name='ticket-list'),
    path('tickets/create/', SupportTicketCreateView.as_view(), name='ticket-create'),
    path('tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<int:pk>/messages/', TicketMessageCreateView.as_view(), name='ticket-message-create'),
    
    # Phase 44: Admin Approval Workflow
    path('admin/pending-proposals/', AdminPendingOffersView.as_view(), name='admin-pending-proposals'),
    path('admin/offers/<int:offer_id>/decide/', admin_decide_offer, name='admin-decide-offer'),
    
    # Admin routes
    path('admin/disputes/stats/', AdminDisputeStatsView.as_view(), name='admin-dispute-stats'),
    path('admin/tickets/stats/', AdminTicketStatsView.as_view(), name='admin-ticket-stats'),
    
    # Phase 23: Public Transparency APIs
    path('', include('apps.disputes.transparency_urls')),
    
    # Phase 6 & 7: High Court (Executive Oversight)
    path('admin/vault/integrity/', VaultIntegrityView.as_view(), name='vault-integrity'),
    path('admin/vault/certificate/', ExportIntegrityCertificateView.as_view(), name='vault-certificate'),

    # Phase 6: REST API Routes
    path('', include(router.urls)),
]
