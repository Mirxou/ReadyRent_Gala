from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger("apps.disputes.middleware")

class TribunalSovereigntyMiddleware(MiddlewareMixin):
    """
    Sovereign Safety & Judicial Guard (Phase 36/42).
    
    1. The Kill Switch: Halts AI-driven operations if SOVEREIGN_AI_HALTED is raised.
    2. Emotional Cooling-Off: Blocks users under judicial lock from sensitive actions.
    """
    
    def process_request(self, request):
        path = request.path
        user = getattr(request, 'user', None)
        
        # --- 1. SCOPE DEFINITION ---
        target_prefixes = [
            '/api/v1/judicial/',           # Sovereign Protocol
            '/api/v1/tribunal/',           # Internal Portal
            '/api/disputes/',              # Dispute Management
        ]
        
        is_targeted = any(path.startswith(prefix) for prefix in target_prefixes)
        if '/mediation/' in path and request.method == 'POST':
            is_targeted = True

        if not is_targeted:
            return None

        # --- 2. EMOTIONAL COOLING-OFF LOCK ---
        if user and user.is_authenticated:
            now = timezone.now()
            if getattr(user, 'emotional_lock_until', None) and user.emotional_lock_until > now:
                # Intercept if trying to perform state-changing judicial action
                if request.method not in ['GET', 'HEAD', 'OPTIONS']:
                    from .engine import TribunalEngine
                    response_data = TribunalEngine._cooling_off_response(
                        dispute_id="GLOBAL_LOCK", 
                        unlock_time=user.emotional_lock_until
                    )
                    return JsonResponse(response_data, status=403)

        # --- 3. SYSTEM-WIDE AI HALT (KILL SWITCH) ---
        is_halted = cache.get('SOVEREIGN_AI_HALTED', None)
        
        if is_halted is None:
            # Fallback to DB if cache is cold
            try:
                from .models import SystemFlag
                is_halted = SystemFlag.get_flag('SOVEREIGN_AI_HALTED', False)
            except Exception:
                is_halted = False
        
        if is_halted:
            # Exemptions: Transparency (Read-only) operations are allowed
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return None
                
            return JsonResponse({
                'status': 'sovereign_halt',
                'dignity_preserved': True,
                'code': 'SOVEREIGN_HALTED',
                'sovereign_message': 'Sovereign AI operations have been halted by emergency protocol.',
            }, status=503)
            
        return None
