
from django.conf import settings
from django.http import JsonResponse
from django.core.cache import cache

class MaintenanceModeMiddleware:
    """
    Sovereign Kill Switch:
    Blocks all non-admin write operations when Maintenance Mode is active.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Check if Maintenance Mode is active (Cache is fastest)
        is_maintenance = cache.get('MAINTENANCE_MODE', False)
        
        if is_maintenance:
            # Allow Admin and Read-Only operations
            # We assume admins have 'admin' role or are superusers
            if request.user.is_authenticated and (request.user.is_superuser or request.user.role == 'admin'):
                pass # Allow passage
            
            # Allow Safe Methods (GET, HEAD, OPTIONS)
            elif request.method in ['GET', 'HEAD', 'OPTIONS']:
                pass # Allow passage (Display only)
                
            else:
                # Block Write Operations (POST, PUT, PATCH, DELETE)
                return JsonResponse({
                    "error": "Sovereign Emergency Protocol Active",
                    "detail": "The platform is currently in maintenance mode. Please try again later.",
                    "code": "maintenance_mode"
                }, status=503)

        response = self.get_response(request)
        return response
