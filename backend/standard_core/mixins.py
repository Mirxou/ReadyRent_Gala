from rest_framework.response import Response

class SovereignResponseMixin:
    """
    Mixin to wrap API responses in a Sovereign/Dignified envelope.
    Ensures 'dignity_preserved: true' is always present.
    Standard Core Component for STANDARD.Rent.
    """
    
    def finalize_response(self, request, response, *args, **kwargs):
        # Let the parent class create the response object first
        response = super().finalize_response(request, response, *args, **kwargs)
        
        # Only wrap success responses (200-299) or specific errors if needed
        # We generally want to wrap everything to maintain the 'Protocol'
        
        if hasattr(response, 'data') and isinstance(response.data, dict):
            # Avoid double wrapping if already wrapped
            if 'dignity_preserved' not in response.data:
                original_data = response.data
                response.data = {
                    'status': 'sovereign_proceeding', # Default status
                    'dignity_preserved': True,
                    'data': original_data
                }
        
        return response
