import re
import uuid
import structlog
from django.utils.deprecation import MiddlewareMixin

_SAFE_REQUEST_ID = re.compile(r'^[a-zA-Z0-9\-_]{1,64}$')

class RequestIDMiddleware(MiddlewareMixin):
    """
    Middleware to ensure every request has a unique correlation ID.
    Links structural logging with incoming HTTP requests.
    """
    def process_request(self, request):
        raw_id = request.headers.get("X-Request-ID")
        if raw_id and _SAFE_REQUEST_ID.match(raw_id):
            request_id = raw_id
        else:
            request_id = str(uuid.uuid4())
        
        # Attach to request for downstream use
        request.request_id = request_id
        
        # Bind to structlog context
        structlog.contextvars.bind_contextvars(request_id=request_id)

    def process_response(self, request, response):
        """
        Ensure the Request-ID is returned in headers for debugging.
        Unbind context to prevent leakage between requests.
        """
        request_id = getattr(request, 'request_id', None)
        if request_id:
            response['X-Request-ID'] = request_id
            
        structlog.contextvars.unbind_contextvars('request_id')
        return response
