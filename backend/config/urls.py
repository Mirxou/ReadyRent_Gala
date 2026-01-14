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

# Admin site headers and titles (translated)
admin.site.site_header = _('إدارة ReadyRent.Gala')
admin.site.site_title = _('إدارة ReadyRent.Gala')
admin.site.index_title = _('لوحة التحكم')

def root_view(request):
    """Root view that provides API information"""
    return JsonResponse({
        'message': 'ReadyRent.Gala API',
        'version': '1.0.0',
        'documentation': {
            'swagger': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/',
        },
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
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Routes
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
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/disputes/', include('apps.disputes.urls')),
    path('api/vendors/', include('apps.vendors.urls')),
    path('api/branches/', include('apps.branches.urls')),
    path('api/cms/', include('apps.cms.urls')),
    path('api/payments/', include('apps.payments.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

