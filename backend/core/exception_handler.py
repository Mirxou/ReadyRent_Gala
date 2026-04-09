"""
Sovereign Global Error Contract (Phase 13 P0)
=============================================
Every error response conforms to the Sovereign Error Envelope.
Deterministic. Bilingual. Dignified.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied, NotFound as DRFNotFound
from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
import structlog

logger = structlog.get_logger("sovereign.errors")

# Try to import Sentry
try:
    import sentry_sdk
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False


# ---------------------------------------------------------------------------
# SOVEREIGN ERROR CODE REGISTRY
# Maps DRF internal codes to institutional machine-readable codes.
# DO NOT expose raw DRF codes to the contract.
# ---------------------------------------------------------------------------
ERROR_CODE_MAP = {
    'permission_denied': 'PERMISSION_DENIED',
    'not_authenticated': 'AUTHENTICATION_REQUIRED',
    'authentication_failed': 'AUTHENTICATION_FAILED',
    'not_found': 'RESOURCE_NOT_FOUND',
    'throttled': 'RATE_LIMIT_EXCEEDED',
    'invalid': 'VALIDATION_ERROR',
    'required': 'FIELD_REQUIRED',
    'parse_error': 'MALFORMED_REQUEST',
    'method_not_allowed': 'METHOD_NOT_ALLOWED',
    'unsupported_media_type': 'UNSUPPORTED_MEDIA_TYPE',
}

# ---------------------------------------------------------------------------
# ARABIC MESSAGE MAP
# Institutional Arabic translations for common error families.
# ---------------------------------------------------------------------------
AR_MESSAGE_MAP = {
    'AUTHENTICATION_REQUIRED': 'يجب تسجيل الدخول للمتابعة.',
    'AUTHENTICATION_FAILED': 'فشل التحقق من الهوية.',
    'PERMISSION_DENIED': 'ليس لديك صلاحية لهذا الإجراء.',
    'RESOURCE_NOT_FOUND': 'المورد المطلوب غير موجود.',
    'RATE_LIMIT_EXCEEDED': 'تم تجاوز الحد المسموح. يرجى الانتظار.',
    'VALIDATION_ERROR': 'البيانات المرسلة غير صالحة. يرجى المراجعة.',
    'FIELD_REQUIRED': 'حقل مطلوب مفقود.',
    'MALFORMED_REQUEST': 'صيغة الطلب غير صحيحة.',
    'METHOD_NOT_ALLOWED': 'طريقة الطلب غير مسموحة.',
    'UNSUPPORTED_MEDIA_TYPE': 'نوع المحتوى غير مدعوم.',
    'INTERNAL_SYSTEM_ERROR': 'حدث خطأ في النظام. الفريق الفني على علم.',
}


def _resolve_sovereign_status(status_code):
    """
    Maps HTTP status codes to sovereign authority postures.
    Sovereignty is deterministic — different failures express different authority.
    """
    if status_code == 400:
        return 'sovereign_rejection'
    elif status_code in (401, 403):
        return 'sovereign_denial'
    elif status_code == 404:
        return 'sovereign_absence'
    elif status_code == 429:
        return 'sovereign_throttle'
    else:
        return 'sovereign_error'


def _resolve_category(status_code):
    """Maps HTTP status codes to monitoring categories."""
    if status_code == 400:
        return 'validation'
    elif status_code == 401:
        return 'auth'
    elif status_code == 403:
        return 'permission'
    elif status_code == 404:
        return 'validation'
    elif status_code == 429:
        return 'throttle'
    else:
        return 'system'


def _resolve_code(exc):
    """Resolves a machine-readable sovereign code from the exception."""
    raw_code = getattr(exc, 'default_code', None)
    if raw_code and str(raw_code) in ERROR_CODE_MAP:
        return ERROR_CODE_MAP[str(raw_code)]
    return 'VALIDATION_ERROR'


def _resolve_message_en(response, exc):
    """Extracts a safe English message from the DRF response."""
    if hasattr(response, 'data') and isinstance(response.data, dict):
        detail = response.data.get('detail')
        if detail:
            return str(detail)
    return 'A request error occurred.'


def _resolve_message_ar(code):
    """Returns institutional Arabic message for the given sovereign code."""
    return AR_MESSAGE_MAP.get(code, 'حدث خطأ. يرجى المحاولة لاحقاً.')


def custom_exception_handler(exc, context):
    """
    Sovereign Global Error Handler.
    
    Contract: Every error response MUST conform to:
    {
        "status": "<sovereign_posture>",
        "category": "<monitoring_category>",
        "dignity_preserved": true,
        "code": "<MACHINE_READABLE_CODE>",
        "message_ar": "...",
        "message_en": "...",
        "request_id": "<uuid>"
    }
    """
    request = context.get('request')
    request_id = getattr(request, 'request_id', None) if request else None

    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # -----------------------------------------------------------------------
    # UNHANDLED EXCEPTION (500) — The system failed unexpectedly
    # -----------------------------------------------------------------------
    if response is None:
        if isinstance(exc, (Http404, DRFNotFound)):
            return Response(
                {
                    'status': 'sovereign_absence',
                    'category': 'validation',
                    'dignity_preserved': True,
                    'code': 'RESOURCE_NOT_FOUND',
                    'message_ar': AR_MESSAGE_MAP['RESOURCE_NOT_FOUND'],
                    'message_en': 'The requested resource was not found.',
                    'request_id': request_id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if isinstance(exc, (DjangoPermissionDenied, DRFPermissionDenied)):
            return Response(
                {
                    'status': 'sovereign_denial',
                    'category': 'permission',
                    'dignity_preserved': True,
                    'code': 'PERMISSION_DENIED',
                    'message_ar': AR_MESSAGE_MAP['PERMISSION_DENIED'],
                    'message_en': 'You do not have permission to perform this action.',
                    'request_id': request_id,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        logger.error(
            "unhandled_exception",
            error=str(exc),
            exc_info=False,  # Avoid leaking sensitive stack traces in logs
            request_id=request_id,
        )

        # Capture in Sentry
        if SENTRY_AVAILABLE:
            try:
                sentry_sdk.capture_exception(exc)
            except Exception as sentry_error:
                logger.warning(
                    "sentry_capture_failed",
                    sentry_error=str(sentry_error),
                    original_error=str(exc),
                )

        return Response(
            {
                'status': 'sovereign_error',
                'category': 'system',
                'dignity_preserved': True,
                'code': 'INTERNAL_SYSTEM_ERROR',
                'message_ar': AR_MESSAGE_MAP['INTERNAL_SYSTEM_ERROR'],
                'message_en': 'A system error occurred. The technical team has been notified.',
                'request_id': request_id,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # -----------------------------------------------------------------------
    # HANDLED EXCEPTION (4xx) — DRF caught and classified the error
    # -----------------------------------------------------------------------
    sovereign_code = _resolve_code(exc)
    sovereign_status = _resolve_sovereign_status(response.status_code)
    category = _resolve_category(response.status_code)

    sovereign_response = {
        'status': sovereign_status,
        'category': category,
        'dignity_preserved': True,
        'code': sovereign_code,
        'message_ar': _resolve_message_ar(sovereign_code),
        'message_en': _resolve_message_en(response, exc),
        'request_id': request_id,
    }

    # Preserve field-level validation errors (important for forms)
    if isinstance(response.data, dict):
        field_errors = {
            k: v for k, v in response.data.items()
            if k not in ('detail', 'code')
        }
        if field_errors:
            sovereign_response['fields'] = field_errors

    # -----------------------------------------------------------------------
    # LOGGING & TELEMETRY
    # -----------------------------------------------------------------------
    if response.status_code >= 500:
        logger.error(
            "server_error",
            code=sovereign_code,
            error=str(exc),
            exc_info=True,
            request_id=request_id,
        )
        if SENTRY_AVAILABLE:
            try:
                sentry_sdk.capture_exception(exc)
            except Exception as err:
                logger.warning(
                    'sentry_capture_failed',
                    error=str(err),
                    request_id=request_id,
                    exc_info=True,
                )
    elif response.status_code >= 400:
        logger.warning(
            "client_error",
            code=sovereign_code,
            category=category,
            status_code=response.status_code,
            request_id=request_id,
        )

    response.data = sovereign_response
    return response
