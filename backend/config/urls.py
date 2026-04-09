"""
URL configuration for ReadyRent.Gala project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.utils.translation import gettext_lazy as _
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from core.views import health_check
from django.http import JsonResponse
from apps.disputes.views import (
    initiate_dispute, issue_verdict, get_dispute_status,
    appeal_verdict, close_dispute, TribunalCaseDetailView,
    PublicLedgerListView, PublicMetricsView
)

# Admin site headers and titles (translated)
admin.site.site_header = _('إدارة STANDARD.Rent')
admin.site.site_title = _('إدارة STANDARD.Rent')
admin.site.index_title = _('لوحة التحكم')

def root_view(request):
    """Root view that provides minimal API information"""
    return JsonResponse({
        'message': 'ReadyRent.Gala API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'auth': '/api/auth/',
            'products': '/api/products/',
            'bookings': '/api/bookings/',
        },
        'note': 'This is a REST API. Frontend is served on a different port (typically 3000).'
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('i18n/', include('django.conf.urls.i18n')),  # Language switcher - must be before admin
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health-check'),
]

# CRITICAL: Conditionally include API documentation only in DEBUG mode (C1 fix)
if settings.DEBUG:
    urlpatterns += [
        # API Documentation (Protected in production)
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

urlpatterns += [
    path('api/auth/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/maintenance/', include('apps.maintenance.urls')),
    path('api/returns/', include('apps.returns.urls')),
    path('api/locations/', include('apps.locations.urls')),
    path('api/hygiene/', include('apps.hygiene.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
    path('api/bundles/', include('apps.bundles.urls')),
    path('api/packaging/', include('apps.packaging.urls')),
    path('api/warranties/', include('apps.warranties.urls')),
    path('api/local-guide/', include('apps.local_guide.urls')),
    path('api/artisans/', include('apps.artisans.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/social/', include('apps.social.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/disputes/', include('apps.disputes.urls')),
    path('api/vendors/', include('apps.vendors.urls')),
    path('api/branches/', include('apps.branches.urls')),
    path('api/cms/', include('apps.cms.urls')),
    path('api/payments/', include('apps.payments.urls')),
    
    # Sovereign API Protocol (Phase 31/34)
    path('api/v1/judicial/disputes/initiate/', initiate_dispute, name='sovereign-dispute-initiate'),
    path('api/v1/judicial/disputes/<int:dispute_id>/verdict/', issue_verdict, name='sovereign-dispute-verdict'),
    path('api/v1/judicial/disputes/<int:dispute_id>/status/', get_dispute_status, name='sovereign-dispute-status'),
    path('api/v1/judicial/disputes/<int:dispute_id>/appeal/', appeal_verdict, name='sovereign-dispute-appeal'),
    path('api/v1/judicial/disputes/<int:dispute_id>/close/', close_dispute, name='sovereign-dispute-close'),
    
    # Internal Tribunal Portal (Phase 36)
    path('api/v1/tribunal/cases/<int:dispute_id>/', TribunalCaseDetailView.as_view(), name='tribunal-case-detail'),
    
    # Public Ledger & Transparency (Phase 38)
    path('api/v1/public/ledger/', PublicLedgerListView.as_view(), name='public-ledger'),
    path('api/v1/public/metrics/', PublicMetricsView.as_view(), name='public-metrics'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

