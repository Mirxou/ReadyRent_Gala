from rest_framework.response import Response
from rest_framework import status

class SovereignResponse(Response):
    """
    ReadyRent Global Response Standard (Elite Level).
    Enforces a consistent top-level structure for all API outputs.
    Format:
    {
      "success": bool,
      "data": object | list | None,
      "meta": { "pagination": {...}, "request_id": "...", "version": "v1.0" },
      "error": { "code": "...", "message": "...", "details": [...] } | None
    }
    """
    def __init__(self, data=None, success=True, meta=None, error=None, 
                 status_code=status.HTTP_200_OK, template_name=None, 
                 headers=None, exception=False, content_type=None):
        
        # Build the elite response body
        response_body = {
            "success": success,
            "data": data if success else None,
            "meta": meta or {},
            "error": error if not success else None,
        }

        # Auto-append version if not present
        if "version" not in response_body["meta"]:
            response_body["meta"]["version"] = "1.0-sovereign"

        super().__init__(
            data=response_body,
            status=status_code,
            template_name=template_name,
            headers=headers,
            exception=exception,
            content_type=content_type
        )

    @classmethod
    def success(cls, data=None, meta=None, status_code=status.HTTP_200_OK):
        return cls(data=data, success=True, meta=meta, status_code=status_code)

    @classmethod
    def error(cls, message, code="ERROR", details=None, status_code=status.HTTP_400_BAD_REQUEST):
        error_payload = {
            "code": code,
            "message": message,
            "details": details or []
        }
        return cls(success=False, error=error_payload, status_code=status_code)
