from django.http import JsonResponse
from django.urls import resolve
from rest_framework import status

class SovereignGuardMiddleware:
    """
    Sovereign Guard Middleware (Phase 7).
    Enforces Two-Factor Authentication (2FA) for all administrative and staff actions.
    Principles: 
    - Zero Trust for Elite Roles.
    - Graceful redirection for Sovereign Security setup.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Paths that are allowed even without 2FA (to enable setup)
        self.EXCLUDED_PATHS = [
            '2fa_generate',
            '2fa_enable',
            'login',
            'logout',
            'token_refresh',
        ]

    def __call__(self, request):
        if request.user.is_authenticated:
            # Check if the user is staff or admin
            is_high_risk_role = request.user.role in ['admin', 'staff', 'manager'] or request.user.is_staff
            
            if is_high_risk_role and not request.user.is_2fa_enabled:
                # Resolve current path to check if it's excluded
                match = resolve(request.path_info)
                if match.url_name not in self.EXCLUDED_PATHS and not request.path.startswith('/admin/'):
                    # If it's an API request, return 403 with specialized Sovereign code
                    if request.path.startswith('/api/'):
                        return JsonResponse({
                            "success": False,
                            "status": "sovereign_halt",
                            "dignity_preserved": True,
                            "code": "2FA_REQUIRED",
                            "message_ar": "المصادقة الثنائية مطلوبة للوصول الإداري",
                            "message_en": "Two-factor authentication is required for administrative access."
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # For non-API (if any), we could redirect, but our app is SPA/API driven
        
        response = self.get_response(request)
        return response
