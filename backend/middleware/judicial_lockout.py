
import json
from django.utils import timezone
from django.http import JsonResponse
from apps.disputes.engine import TribunalEngine

class JudicialLockoutMiddleware:
    """
    Proactively blocks access to judicial endpoints if the user
    is currently under an emotional cooling-off lock.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Only enforce on judicial API endpoints
        if request.path.startswith('/api/v1/judicial/'):
            user = request.user
            
            # 2. Check if user is authenticated and has a lock
            if user.is_authenticated:
                now = timezone.now()
                if user.emotional_lock_until and user.emotional_lock_until > now:
                    # 3. Intercept and return Sovereign Halt response
                    # We reuse the logic from TribunalEngine to ensure consistency
                    response_data = TribunalEngine._cooling_off_response(
                        dispute_id="GLOBAL_LOCK", 
                        unlock_time=user.emotional_lock_until
                    )
                    return JsonResponse(response_data)

        return self.get_response(request)
