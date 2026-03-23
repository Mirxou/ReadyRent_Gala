import uuid
import structlog
from django.utils.deprecation import MiddlewareMixin

class RequestIDMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(request_id=request_id)
        request.request_id = request_id
