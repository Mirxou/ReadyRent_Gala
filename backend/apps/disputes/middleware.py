
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class SovereignSafetyMiddleware(MiddlewareMixin):
    """
    The Kill Switch Implementation.
    Intercepts traffic to the Digital Sovereign and blocks it if the HALT flag is raised.
    """
    
    def __init__(self, get_response):
        super().__init__(get_response)

    def process_request(self, request):
        path = request.path
        # 1. Scope: Only affects Judicial/Sovereign endpoints
        # Also limit scope to /api/disputes/mediation because standard disputes might be manual
        # We want to halt AI-driven processes primarily.
        
        target_prefixes = [
            '/api/v1/judicial/',           # Sovereign Protocol
            '/api/disputes/admin/offers/', # Admin Approvals
            '/api/disputes/',              # CRITICAL: Protect standard dispute creation
        ]
        
        is_targeted = any(path.startswith(prefix) for prefix in target_prefixes)
        
        # Also catch mediation generation specifically
        if '/mediation/' in path and request.method == 'POST':
            is_targeted = True

        if not is_targeted:
            return None
            
        # 2. Check Halt Status
        # Use cache for speed (Redis)
        is_halted = cache.get('SOVEREIGN_AI_HALTED', None)
        
        # Fallback: Check database if cache is missing/False (for LocMemCache isolation or cold start)
        if not is_halted:
            from .models import SystemFlag
            is_halted = SystemFlag.get_flag('SOVEREIGN_AI_HALTED', False)
        
        if is_halted:
            # 3. Exemptions: Read-only operations are allowed (Transparency)
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return None
                
            # 4. Block: Reject any state-changing operation
            return JsonResponse({
                'status': 'sovereign_halt',
                'dignity_preserved': True,
                'code': 'SOVEREIGN_HALTED',
                'sovereign_message': 'Sovereign AI operations have been halted by emergency protocol.',
            }, status=503)
            
        return None
