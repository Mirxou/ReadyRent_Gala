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
        if hasattr(request, 'user') and request.user.is_authenticated:
            is_high_risk_role = request.user.role in ['admin', 'staff', 'manager'] or request.user.is_staff
            
            if is_high_risk_role and not request.user.is_2fa_enabled:
                try:
                    match = resolve(request.path_info)
                    url_name = match.url_name or ''
                except Exception:
                    url_name = ''

                if url_name not in self.EXCLUDED_PATHS:
                    if request.path.startswith('/api/'):
                        return JsonResponse({
                            "success": False,
                            "status": "sovereign_halt",
                            "dignity_preserved": True,
                            "code": "2FA_REQUIRED",
                            "message_ar": "المصادقة الثنائية مطلوبة للوصول الإداري",
                            "message_en": "Two-factor authentication is required for administrative access."
                        }, status=status.HTTP_403_FORBIDDEN)
        
        response = self.get_response(request)
        return response
