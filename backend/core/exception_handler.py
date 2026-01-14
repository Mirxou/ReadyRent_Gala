"""
Custom exception handler for DRF with Sentry integration
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

# Try to import Sentry
try:
    import sentry_sdk
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides user-friendly error messages
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If response is None, it's an unhandled exception
    if response is None:
        # Log the exception
        logger.exception(f"Unhandled exception: {exc}")
        
        # Capture exception in Sentry
        if SENTRY_AVAILABLE:
            try:
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass  # Don't fail if Sentry is not configured
        
        # Return a generic error response
        return Response(
            {
                'error': 'An unexpected error occurred',
                'detail': 'Please try again later or contact support if the problem persists.',
                'code': 'server_error'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Customize the response data structure
    custom_response_data = {
        'error': response.data.get('detail', 'An error occurred'),
        'code': response.data.get('code', exc.default_code if hasattr(exc, 'default_code') else 'unknown_error'),
    }
    
    # Add field errors if they exist
    if isinstance(response.data, dict):
        field_errors = {k: v for k, v in response.data.items() if k != 'detail' and k != 'code'}
        if field_errors:
            custom_response_data['fields'] = field_errors
    
    # Log the exception (except for 4xx errors which are expected)
    if response.status_code >= 500:
        logger.exception(f"Server error: {exc}")
        # Capture server errors in Sentry
        if SENTRY_AVAILABLE:
            try:
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass
    elif response.status_code >= 400:
        logger.warning(f"Client error: {exc}")
        # Only capture 4xx errors in Sentry if they're unexpected (e.g., validation errors that shouldn't happen)
        if response.status_code == 422:  # Unprocessable Entity - might be worth tracking
            if SENTRY_AVAILABLE:
                try:
                    sentry_sdk.capture_exception(exc)
                except Exception:
                    pass
    
    response.data = custom_response_data
    return response


