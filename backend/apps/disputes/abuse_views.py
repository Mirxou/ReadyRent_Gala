"""
Admin-Only API Views for Abuse Visibility Dashboard (Phase 23, Step 5)

CRITICAL: These endpoints are staff/admin-only.
Pattern data is NOT exposed publicly.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model

from apps.disputes.abuse_detector import AbuseDetector
from apps.disputes.models import UserReputationLog

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def abuse_dashboard_summary(request):
    """
    GET /api/disputes/admin/abuse/dashboard/
    
    Get comprehensive abuse pattern summary.
    
    Admin-only endpoint.
    """
    days = int(request.GET.get('days', 30))
    
    # Detect all patterns
    serial_filers = AbuseDetector.detect_serial_filers(days=days)
    gaming_attempts = AbuseDetector.detect_gaming_attempts(days=days)
    category_concentration = AbuseDetector.detect_category_concentration(days=days)
    
    return Response({
        'period_days': days,
        'summary': {
            'serial_filers_count': len(serial_filers),
            'gaming_attempts_count': len(gaming_attempts),
            'category_concentration_count': len(category_concentration),
            'total_patterns': len(serial_filers) + len(gaming_attempts) + len(category_concentration)
        },
        'patterns': {
            'serial_filers': serial_filers,
            'gaming_attempts': gaming_attempts,
            'category_concentration': category_concentration
        },
        'disclaimer': {
            'ar': 'هذه البيانات لأغراض المراقبة الداخلية فقط. لا تؤثر على نتائج الأحكام.',
            'en': 'This data is for internal monitoring only. Does NOT affect judgment outcomes.'
        }
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_abuse_detail(request, user_id):
    """
    GET /api/disputes/admin/abuse/users/<user_id>/
    
    Get detailed abuse summary for specific user.
    
    Admin-only endpoint.
    """
    try:
        summary = AbuseDetector.get_user_abuse_summary(user_id)
        return Response(summary)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def reputation_logs(request):
    """
    GET /api/disputes/admin/abuse/logs/
    
    Get recent reputation logs with filtering.
    
    Admin-only endpoint.
    
    Query params:
    - user_id: Filter by user
    - event_type: Filter by event type
    - days: Time range (default 30)
    """
    logs = UserReputationLog.objects.all()
    
    # Filters
    user_id = request.GET.get('user_id')
    if user_id:
        logs = logs.filter(user_id=user_id)
    
    event_type = request.GET.get('event_type')
    if event_type:
        logs = logs.filter(event_type=event_type)
    
    days = int(request.GET.get('days', 30))
    from datetime import timedelta
    from django.utils import timezone
    cutoff = timezone.now() - timedelta(days=days)
    logs = logs.filter(timestamp__gte=cutoff)
    
    # Limit to 100 most recent
    logs = logs[:100]
    
    results = [{
        'id': log.id,
        'user_id': log.user.id,
        'user_email': log.user.email,
        'event_type': log.event_type,
        'detection_method': log.detection_method,
        'severity': log.severity,
        'context': log.context,
        'event_data': log.event_data,
        'timestamp': log.timestamp,
        'action': log.action
    } for log in logs]
    
    return Response({
        'count': len(results),
        'results': results
    })
