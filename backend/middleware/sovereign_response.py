
import json
from django.http import JsonResponse
from django.core.exceptions import MiddlewareNotUsed

class ConstitutionalViolation(Exception):
    pass

class SovereignResponseMiddleware:
    """
    Ensures that all JSON responses from the Sovereign API
    adhere to the 'dignity_preserved' contract.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Only activate for API routes to avoid breaking Django Admin
        # self.api_prefix = '/api/v1/judicial/' 

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only check Judicial API endpoints
        if not request.path.startswith('/api/v1/judicial/'):
            return response

        # If it's a JSON response, inspect it
        if isinstance(response, JsonResponse):
            try:
                # content is bytes, need to decode
                content = response.content.decode('utf-8')
                data = json.loads(content)
                
                if isinstance(data, dict):
                    if 'dignity_preserved' not in data:
                        # VIOLATION DETECTED
                        # In production, we might log this. 
                        # In development (now), we RAISE HELL to fix it.
                        raise ConstitutionalViolation(
                            f"Sovereign Contract Violation: Endpoint {request.path} returned a response "
                            f"without the 'dignity_preserved' flag. The Soul cannot interpret this Body."
                        )
            except json.JSONDecodeError:
                pass # Not valid JSON, skip check
                
        return response
