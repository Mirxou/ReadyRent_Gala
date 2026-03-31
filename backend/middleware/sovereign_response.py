import json
from django.http import JsonResponse
from core.utils.responses import SovereignResponse

class SovereignResponseMiddleware:
    """
    The Constitutional Enforcer (Elite Standard).
    Automatically wraps all /api/ responses in the Sovereign Schema:
    { success, data, meta, error }
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only target API endpoints
        if not request.path.startswith('/api/'):
            return response

        # If it's already a SovereignResponse or similar structured JsonResponse, skip
        if isinstance(response, SovereignResponse):
            return response

        if isinstance(response, JsonResponse):
            try:
                content = response.content.decode('utf-8')
                data = json.loads(content)
                
                # Check if it's already following our elite schema
                if isinstance(data, dict) and 'success' in data and 'data' in data:
                    return response
                
                # Otherwise, wrap it!
                success = 200 <= response.status_code < 300
                wrapped_data = {
                    "success": success,
                    "data": data if success else None,
                    "meta": {"version": "1.0-auto-wrapped", "path": request.path},
                    "error": data if not success else None
                }
                
                response.content = json.dumps(wrapped_data).encode('utf-8')
                # Content-Length must be updated if edited manually
                response['Content-Length'] = str(len(response.content))
                
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
                
        return response

