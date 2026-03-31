from rest_framework.renderers import JSONRenderer

class SovereignJSONRenderer(JSONRenderer):
    """
    🛡️ Universal Sovereign Response Envelope
    Standardizes all API responses into:
    {
        "success": bool,
        "data": mixed,
        "meta": dict,
        "dignity_preserved": bool
    }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        # Determine success from HTTP status code
        success = True
        if response and response.status_code >= 400:
            success = False

        # Extract metadata if provided (e.g., from pagination)
        meta = {}
        if isinstance(data, dict) and 'results' in data:
            # Handle standard DRF pagination
            meta = {
                'count': data.get('count'),
                'next': data.get('next'),
                'previous': data.get('previous')
            }
            data = data.get('results')

        # Construct Sovereign Envelope
        envelope = {
            "success": success,
            "data": data,
            "meta": meta,
            "dignity_preserved": True
        }

        return super().render(envelope, accepted_media_type, renderer_context)
